import { languageService, SUPPORTED_LANGUAGES, type SupportedLanguage } from './language';
import { walletService } from './wallet';
import { weatherService } from './weather';

export interface VoiceAction {
  type: 'buy_item' | 'check_weather' | 'schedule_task' | 'navigate' | 'change_language' | 'check_report' | 'check_inventory' | 'ask_general_question' | 'unknown';
  params: any;
  spoken_response: string;
}

interface VoiceContext {
  currentDate: string;
  currentLanguage: SupportedLanguage;
  walletBalance: number;
  landSummary: Array<{ id: string; district: string; state: string; size: number; soilType?: string }>;
  weatherSummary: string;
  inventorySummary: string;
}

export class VoiceAssistantService {
  private isListening = false;
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
      }
    }
  }

  isSpeechSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  async startListening(onResult: (transcript: string) => void, onError: (error: string) => void): Promise<void> {
    if (!this.recognition) {
      onError('Voice assistant not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (this.isListening) return;

    const currentLang = languageService.getCurrentLanguage();
    this.recognition.lang = this.getRecognitionLanguage(currentLang);
    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎤 Voice command:', transcript);
      this.isListening = false;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;

      if (event?.error === 'no-speech' || event?.error === 'aborted') {
        onError('no-speech');
        return;
      }

      console.error('Voice recognition error:', event.error);
      onError('Sorry, I could not understand. Please try again.');
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.isListening = false;
      onError('Failed to start voice recognition');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async speak(text: string, language?: string): Promise<void> {
    const synthesis = this.synthesis;
    if (!synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Stop any ongoing speech
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const currentLang = language || languageService.getCurrentLanguage();
    utterance.lang = this.getSpeechLanguage(currentLang);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    return new Promise((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synthesis.speak(utterance);
    });
  }

  async processVoiceCommand(transcript: string): Promise<VoiceAction> {
    try {
      const context = await this.buildVoiceContext();

      try {
        const geminiAction = await this.callGeminiForIntent(transcript, context);
        if (geminiAction.type !== 'unknown') {
          return geminiAction;
        }

        const inferredAction = this.inferVoiceActionFromText(transcript, context.currentLanguage);
        if (inferredAction.type !== 'unknown') {
          return inferredAction;
        }

        return geminiAction;
      } catch (cohereError) {
        console.warn('Gemini failed, trying Cohere fallback:', cohereError);
        const cohereAction = await this.callCohereForIntent(transcript, context);
        if (cohereAction.type !== 'unknown') {
          return cohereAction;
        }

        return this.inferVoiceActionFromText(transcript, context.currentLanguage);
      }
    } catch (error) {
      console.error('Both Gemini and Cohere failed:', error);
      return {
        type: 'unknown',
        params: {},
        spoken_response: 'Sorry, I encountered an error processing your request.'
      };
    }
  }

  private async buildVoiceContext(): Promise<VoiceContext> {
    const currentLanguage = languageService.getCurrentLanguage();
    const wallet = walletService.getWallet();
    const lands = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('lands') || '[]') : [];
    const landSummary = lands.map((land: any) => ({
      id: land.id,
      district: land.district,
      state: land.state,
      size: land.size,
      soilType: land.soilType,
    }));

    const primaryLand = lands[0];
    const location = primaryLand ? `${primaryLand.district || 'Mysuru'}, ${primaryLand.state || 'Karnataka'}` : 'Mysuru, Karnataka';

    let weatherSummary = 'partly cloudy, 28 to 35 degrees, 65 percent humidity';
    try {
      const weather = await weatherService.getWeatherData(location);
      weatherSummary = this.formatWeatherSummary(weather);
    } catch (error) {
      console.warn('Weather context unavailable, using fallback summary:', error);
    }

    const stockLevels = walletService.getStockLevels();
    const inventorySummary = JSON.stringify([
      { crop: 'seeds', quantity: stockLevels.seeds, unit: 'kg' },
      { crop: 'pesticide', quantity: stockLevels.pesticide, unit: 'L' },
      { crop: 'fertilizer', quantity: stockLevels.fertilizer, unit: 'kg' },
    ]);

    return {
      currentDate: new Date().toISOString().split('T')[0],
      currentLanguage,
      walletBalance: wallet.balance,
      landSummary,
      weatherSummary,
      inventorySummary,
    };
  }

  private async callCohereForIntent(transcript: string, context: VoiceContext): Promise<VoiceAction> {
    const languageExamples = this.buildLanguageExamples();
    const systemPrompt = `You are the voice assistant for Fasal Munafa, an agricultural app for Indian farmers. The farmer will speak a command or question in English or Hindi. Interpret their intent and respond ONLY with valid JSON, no markdown, no preamble, using this exact schema:

{
  "type": "buy_item" | "check_weather" | "schedule_task" | "navigate" | "change_language" | "check_report" | "check_inventory" | "ask_general_question" | "unknown",
  "params": { ... fields depending on type, see examples below ... },
  "spoken_response": "short natural sentence to speak back to the farmer, in the same language they spoke in"
}

Examples of expected params per type:

- buy_item:
  { "item": "pesticide", "vendor": "any" or a specific vendor name if mentioned, "quantity": "if mentioned, else null" }

- check_weather:
  { }

- schedule_task:
  { "task": "e.g. 'Apply fertilizer'", "date": "YYYY-MM-DD if determinable, else null", "time": "HH:MM if mentioned, else null" }

- navigate:
  { "target": "dashboard" | "finance" | "marketplace" | "reports" | "land-records" | "settings" }

- change_language:
  { "language": "hi" | "en" | "kn" | "te" | "ta" | "mr" | "bn" | "gu" | "ml" | "pa" | "or" }

Examples:
${languageExamples}

- check_report:
  { "report_type": "profit" | "health" | "water" | "general" }

- check_inventory:
  { "crop": "specific crop name if mentioned, else null" }

- ask_general_question:
  { "answer": "your actual answer to their farming question here, 2-3 sentences max" }

- unknown:
  { }

CONTEXT PROVIDED EACH CALL:
Today's date: ${context.currentDate}
Farmer's current UI language: ${context.currentLanguage}
Farmer's land parcel(s): ${JSON.stringify(context.landSummary)}
Current wallet balance: ₹${context.walletBalance}
Current weather summary: ${context.weatherSummary}
Current inventory summary: ${context.inventorySummary}

USER MESSAGE: "${transcript}"`;

    const response = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-a-plus-05-2026',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `USER MESSAGE: "${transcript}"\n\nReturn the JSON action only.` },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere API failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data?.message?.content?.[0]?.text || '';
    const action = this.parseVoiceAction(generatedText, transcript);
    return action;
  }

  private async callGeminiForIntent(transcript: string, context: VoiceContext): Promise<VoiceAction> {
    const languageExamples = this.buildLanguageExamples();
    const prompt = `You are the voice assistant for Fasal Munafa. Respond ONLY with valid JSON in this schema:

{
  "type": "buy_item" | "check_weather" | "schedule_task" | "navigate" | "change_language" | "check_report" | "check_inventory" | "ask_general_question" | "unknown",
  "params": { },
  "spoken_response": "short natural sentence in the same language the farmer used"
}

Today's date: ${context.currentDate}
Farmer's current UI language: ${context.currentLanguage}
Farmer's land parcel(s): ${JSON.stringify(context.landSummary)}
Current wallet balance: ₹${context.walletBalance}
Current weather summary: ${context.weatherSummary}
Current inventory summary: ${context.inventorySummary}

Important mapping rules:
${languageExamples}

Farmer said: "${transcript}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this.parseVoiceAction(text, transcript);
  }

  private parseVoiceAction(rawText: string, transcript: string): VoiceAction {
    const cleanedText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        type: 'unknown',
        params: {},
        spoken_response: cleanedText || 'Sorry, I did not understand that.'
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const actionType = this.isValidActionType(parsed.type) ? parsed.type : 'unknown';
      return {
        type: actionType,
        params: parsed.params || {},
        spoken_response: parsed.spoken_response || this.getFallbackSpokenResponse(actionType, transcript),
      };
    } catch (error) {
      console.error('Failed to parse voice action:', rawText, error);
      return {
        type: 'unknown',
        params: {},
        spoken_response: 'Sorry, I did not understand that.'
      };
    }
  }

  private isValidActionType(type: any): type is VoiceAction['type'] {
    return [
      'buy_item',
      'check_weather',
      'schedule_task',
      'navigate',
      'change_language',
      'check_report',
      'check_inventory',
      'ask_general_question',
      'unknown',
    ].includes(type);
  }

  private getFallbackSpokenResponse(type: VoiceAction['type'], transcript: string): string {
    if (type === 'unknown') {
      return 'Sorry, I did not understand that. Can you repeat your request?';
    }

    if (type === 'ask_general_question') {
      return transcript;
    }

    return 'Okay.';
  }

  private buildLanguageExamples(): string {
    const examples: Record<SupportedLanguage, string> = {
      en: '- "switch to English" -> { "type": "change_language", "params": { "language": "en" }, "spoken_response": "Language changed to English." }',
      hi: '- "हिंदी में बदलो" -> { "type": "change_language", "params": { "language": "hi" }, "spoken_response": "भाषा हिंदी में बदल दी गई है।" }',
      kn: '- "ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ" -> { "type": "change_language", "params": { "language": "kn" }, "spoken_response": "ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ." }',
      te: '- "తెలుగుకు మార్చండి" -> { "type": "change_language", "params": { "language": "te" }, "spoken_response": "భాష తెలుగుకు మార్చబడింది." }',
      ta: '- "தமிழுக்கு மாற்றவும்" -> { "type": "change_language", "params": { "language": "ta" }, "spoken_response": "மொழி தமிழில் மாற்றப்பட்டது." }',
      mr: '- "मराठीत बदला" -> { "type": "change_language", "params": { "language": "mr" }, "spoken_response": "भाषा मराठीत बदलली आहे." }',
      bn: '- "বাংলায় বদলান" -> { "type": "change_language", "params": { "language": "bn" }, "spoken_response": "ভাষা বাংলায় পরিবর্তন করা হয়েছে।" }',
      gu: '- "ગુજરાતીમાં બદલો" -> { "type": "change_language", "params": { "language": "gu" }, "spoken_response": "ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે." }',
      ml: '- "മലയാളത്തിലേക്ക് മാറ്റുക" -> { "type": "change_language", "params": { "language": "ml" }, "spoken_response": "ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി." }',
      pa: '- "ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲੋ" -> { "type": "change_language", "params": { "language": "pa" }, "spoken_response": "ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲੀ ਗਈ ਹੈ।" }',
      or: '- "ଓଡ଼ିଆକୁ ପରିବର୍ତ୍ତନ କରନ୍ତୁ" -> { "type": "change_language", "params": { "language": "or" }, "spoken_response": "ଭାଷା ଓଡ଼ିଆକୁ ପରିବର୍ତ୍ତନ ହୋଇଛି।" }',
    };

    return [
      'Supported language examples:',
      ...SUPPORTED_LANGUAGES.map((language) => examples[language.code]),
      '- "buy pesticide" -> { "type": "buy_item", "params": { "item": "pesticide", "vendor": "any", "quantity": null }, "spoken_response": "Buying pesticide from the marketplace." }',
      '- "what is the weather today" -> { "type": "check_weather", "params": {}, "spoken_response": "Checking weather for your farm." }',
      '- "schedule fertilizer spraying tomorrow" -> { "type": "schedule_task", "params": { "task": "fertilizer spraying", "date": "YYYY-MM-DD", "time": null }, "spoken_response": "Scheduling your task." }',
      '- "open the reports page" -> { "type": "navigate", "params": { "target": "reports" }, "spoken_response": "Opening reports." }',
      '- "show profit report" -> { "type": "check_report", "params": { "report_type": "profit" }, "spoken_response": "Opening your profit report." }',
      '- "how much wheat do I have" -> { "type": "check_inventory", "params": { "crop": "wheat" }, "spoken_response": "Opening your wheat inventory." }',
      '- if unclear, return { "type": "unknown", "params": {}, "spoken_response": "Sorry, I did not understand that. Can you repeat your request?" }',
    ].join('\n');
  }

  private detectLanguageCodeFromText(transcript: string): SupportedLanguage | null {
    const text = transcript.toLowerCase();
    const aliases: Array<{ code: SupportedLanguage; terms: string[] }> = [
      { code: 'hi', terms: ['hindi', 'हिंदी', 'हिन्दी'] },
      { code: 'en', terms: ['english', 'अंग्रेजी'] },
      { code: 'kn', terms: ['kannada', 'ಕನ್ನಡ'] },
      { code: 'te', terms: ['telugu', 'తెలుగు'] },
      { code: 'ta', terms: ['tamil', 'தமிழ்'] },
      { code: 'mr', terms: ['marathi', 'मराठी'] },
      { code: 'bn', terms: ['bengali', 'বাংলা'] },
      { code: 'gu', terms: ['gujarati', 'ગુજરાતી'] },
      { code: 'ml', terms: ['malayalam', 'മലയാളം'] },
      { code: 'pa', terms: ['punjabi', 'ਪੰਜਾਬੀ'] },
      { code: 'or', terms: ['odia', 'oriya', 'ଓଡ଼ିଆ'] },
    ];

    for (const alias of aliases) {
      if (alias.terms.some((term) => text.includes(term.toLowerCase()))) {
        return alias.code;
      }
    }

    return null;
  }

  private buildLanguageChangeAction(language: SupportedLanguage, currentLanguage: SupportedLanguage): VoiceAction {
    return {
      type: 'change_language',
      params: { language },
      spoken_response: this.getLanguageConfirmation(language, currentLanguage),
    };
  }

  private getLanguageConfirmation(language: SupportedLanguage, currentLanguage: SupportedLanguage): string {
    const confirmations: Record<SupportedLanguage, string> = {
      en: 'Language changed to English.',
      hi: 'भाषा हिंदी में बदल दी गई है।',
      kn: 'ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.',
      te: 'భాష తెలుగుకు మార్చబడింది.',
      ta: 'மொழி தமிழில் மாற்றப்பட்டது.',
      mr: 'भाषा मराठीत बदलली आहे.',
      bn: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
      gu: 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.',
      ml: 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.',
      pa: 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲੀ ਗਈ ਹੈ।',
      or: 'ଭାଷା ଓଡ଼ିଆକୁ ପରିବର୍ତ୍ତନ ହୋଇଛି।',
    };

    return confirmations[language] || (currentLanguage === 'hi' ? 'भाषा बदल दी गई है।' : 'Language changed.');
  }

  private inferVoiceActionFromText(transcript: string, currentLanguage: SupportedLanguage): VoiceAction {
    const text = transcript.toLowerCase();
    const detectedLanguage = this.detectLanguageCodeFromText(transcript);

    if (detectedLanguage) {
      return this.buildLanguageChangeAction(detectedLanguage, currentLanguage);
    }

    if (text.includes('change the language') || text.includes('switch to language') || text.includes('set language') || text.includes('language to hindi')) {
      return {
        type: 'change_language',
        params: { language: 'hi' },
        spoken_response: currentLanguage === 'hi'
          ? 'भाषा हिंदी में बदल दी गई है।'
          : 'Language changed to Hindi.'
      };
    }

    if (text.includes('english') || text.includes('अंग्रेजी')) {
      return {
        type: 'change_language',
        params: { language: 'en' },
        spoken_response: 'Language changed to English.'
      };
    }

    if (text.includes('kannada') || text.includes('ಕನ್ನಡ')) {
      return {
        type: 'change_language',
        params: { language: 'kn' },
        spoken_response: 'ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.'
      };
    }

    if (text.includes('telugu') || text.includes('తెలుగు')) {
      return {
        type: 'change_language',
        params: { language: 'te' },
        spoken_response: 'భాష తెలుగుకు మార్చబడింది.'
      };
    }

    if (text.includes('tamil') || text.includes('தமிழ்')) {
      return {
        type: 'change_language',
        params: { language: 'ta' },
        spoken_response: 'மொழி தமிழில் மாற்றப்பட்டது.'
      };
    }

    if (text.includes('marathi') || text.includes('मराठी')) {
      return {
        type: 'change_language',
        params: { language: 'mr' },
        spoken_response: 'भाषा मराठीत बदलली आहे.'
      };
    }

    if (text.includes('bengali') || text.includes('বাংলা')) {
      return {
        type: 'change_language',
        params: { language: 'bn' },
        spoken_response: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।'
      };
    }

    if (text.includes('gujarati') || text.includes('ગુજરાતી')) {
      return {
        type: 'change_language',
        params: { language: 'gu' },
        spoken_response: 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.'
      };
    }

    if (text.includes('malayalam') || text.includes('മലയാളം')) {
      return {
        type: 'change_language',
        params: { language: 'ml' },
        spoken_response: 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.'
      };
    }

    if (text.includes('punjabi') || text.includes('ਪੰਜਾਬੀ')) {
      return {
        type: 'change_language',
        params: { language: 'pa' },
        spoken_response: 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲੀ ਗਈ ਹੈ।'
      };
    }

    if (text.includes('odia') || text.includes('oriya') || text.includes('ଓଡ଼ିଆ')) {
      return {
        type: 'change_language',
        params: { language: 'or' },
        spoken_response: 'ଭାଷା ଓଡ଼ିଆକୁ ପରିବର୍ତ୍ତନ ହୋଇଛି।'
      };
    }

    if (text.includes('weather') || text.includes('मौसम') || text.includes('बारिश')) {
      return {
        type: 'check_weather',
        params: {},
        spoken_response: 'Checking weather for your farm.'
      };
    }

    if (text.includes('report')) {
      return {
        type: 'check_report',
        params: { report_type: text.includes('profit') ? 'financial' : 'general' },
        spoken_response: 'Opening your report.'
      };
    }

    if (text.includes('inventory') || text.includes('stock')) {
      return {
        type: 'check_inventory',
        params: { crop: null },
        spoken_response: 'Opening your inventory.'
      };
    }

    if (text.includes('schedule') || text.includes('task') || text.includes('remind')) {
      return {
        type: 'schedule_task',
        params: { task: transcript, date: null, time: null },
        spoken_response: 'Scheduling your task.'
      };
    }

    if (text.includes('buy') || text.includes('order') || text.includes('marketplace')) {
      const item = this.extractPurchasedItem(transcript) || 'pesticide';
      return {
        type: 'buy_item',
        params: { item, vendor: 'any', quantity: null },
        spoken_response: `Buying ${item} from the marketplace.`
      };
    }

    return {
      type: 'unknown',
      params: {},
      spoken_response: 'Sorry, I did not understand that. Can you repeat your request?'
    };
  }

  private extractPurchasedItem(transcript: string): string | null {
    const text = transcript.toLowerCase();
    const items = ['pesticide', 'fertilizer', 'seed', 'seeds', 'tool', 'spray', 'urea', 'dap'];
    const found = items.find((item) => text.includes(item));
    return found || null;
  }

  private getRecognitionLanguage(lang: string): string {
    const langMap: { [key: string]: string } = {
      'hi': 'hi-IN',
      'kn': 'kn-IN',
      'te': 'te-IN',
      'ta': 'ta-IN',
      'mr': 'mr-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'ml': 'ml-IN',
      'pa': 'pa-IN',
      'or': 'or-IN',
      'en': 'en-IN'
    };
    return langMap[lang] || 'en-IN';
  }

  private getSpeechLanguage(lang: string): string {
    return this.getRecognitionLanguage(lang);
  }

  private formatWeatherSummary(weather: any): string {
    const currentTemp = Math.round(weather.temperature?.max ?? weather.temperature?.min ?? 0);
    const minTemp = Math.round(weather.temperature?.min ?? currentTemp);
    const maxTemp = Math.round(weather.temperature?.max ?? currentTemp);
    return `${weather.location || 'your area'}, ${weather.forecast?.[0]?.conditions || 'partly cloudy'}, ${minTemp} to ${maxTemp} degrees, ${Math.round(weather.humidity || 0)} percent humidity`;
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export const voiceAssistantService = new VoiceAssistantService();