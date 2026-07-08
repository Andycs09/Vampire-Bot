import { geminiService } from './gemini';

interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

class VoiceService {
  private recognition: any = null;
  private synthesis: any = null;
  private isListening: boolean = false;
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for Web Speech API support
      this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      
      if (this.isSupported) {
        // Initialize Speech Recognition
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Initialize Speech Synthesis
        this.synthesis = window.speechSynthesis;
      }
    }
  }

  isWebSpeechSupported(): boolean {
    return this.isSupported;
  }

  async startListening(
    language: 'en' | 'hi' = 'en',
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    const config: VoiceConfig = {
      language: language === 'hi' ? 'hi-IN' : 'en-US',
      continuous: true,
      interimResults: true
    };

    this.recognition.lang = config.language;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      onError(`Speech recognition error: ${event.error}`);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError('Failed to start speech recognition');
      this.isListening = false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async speak(text: string, language: 'en' | 'hi' = 'en'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis is not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      // Get available voices
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find((voice: SpeechSynthesisVoice) => 
        voice.lang.includes(language === 'hi' ? 'hi' : 'en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.synthesis.speak(utterance);
    });
  }

  async processVoiceCommand(
    spokenText: string,
    language: 'en' | 'hi' = 'en'
  ): Promise<string> {
    try {
      // Use Gemini to process the voice query
      const response = await geminiService.processVoiceQuery(spokenText, language);
      return response;
    } catch (error) {
      console.error('Error processing voice command:', error);
      return language === 'hi' 
        ? 'मुझे समझने में समस्या हुई। कृपया दोबारा कोशिश करें।'
        : 'I had trouble understanding. Please try again.';
    }
  }

  // Voice confirmation for purchase requests
  async getVoiceConfirmation(
    promptText: string,
    language: 'en' | 'hi' = 'en'
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Voice recognition not supported'));
        return;
      }

      let confirmed = false;
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        this.stopListening();
        if (timeoutId) clearTimeout(timeoutId);
      };

      // Set timeout for voice confirmation
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, 10000); // 10 second timeout

      this.startListening(
        language,
        (text, isFinal) => {
          if (isFinal) {
            const lowerText = text.toLowerCase();
            
            // Check for positive confirmations
            const yesWords = language === 'hi' 
              ? ['हाँ', 'जी हाँ', 'हां', 'जी', 'ठीक है', 'करो']
              : ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'confirm'];
            
            const noWords = language === 'hi'
              ? ['नहीं', 'ना', 'नही', 'मत करो', 'रोको']
              : ['no', 'nope', 'cancel', 'stop', 'don\'t'];

            if (yesWords.some(word => lowerText.includes(word))) {
              confirmed = true;
              cleanup();
              resolve(true);
            } else if (noWords.some(word => lowerText.includes(word))) {
              cleanup();
              resolve(false);
            }
            // Continue listening if no clear yes/no detected
          }
        },
        (error) => {
          cleanup();
          reject(new Error(error));
        }
      );
    });
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();