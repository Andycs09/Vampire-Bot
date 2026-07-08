import { VoiceAction } from './voiceAssistant';
import { walletService } from './wallet';
import { languageService } from './language';
import { weatherService } from './weather';
import { landMonitoringService } from './landMonitoring';
import type { SupportedLanguage } from './language';

export interface VoiceExecutionResult {
  success: boolean;
  message?: string;
  navigation?: string;
  spokenResponse?: string;
}

export class VoiceActionExecutor {
  private router: any = null;

  setRouter(router: any): void {
    this.router = router;
  }

  async executeVoiceAction(action: VoiceAction): Promise<VoiceExecutionResult> {
    console.log('🎯 Executing voice action:', action);

    try {
      switch (action.type) {
        case 'navigate':
          return this.executeNavigate(action.params);
        
        case 'buy_item':
          return this.executeBuyItem(action.params);
        
        case 'check_weather':
          return this.executeCheckWeather(action.params);
        
        case 'schedule_task':
          return this.executeScheduleTask(action.params);
        
        case 'change_language':
          return this.executeChangeLanguage(action.params);
        
        case 'check_report':
          return this.executeCheckReport(action.params);
        
        case 'check_inventory':
          return this.executeCheckInventory(action.params);
        
        case 'ask_general_question':
          return { success: true, message: 'Question answered' };
        
        case 'unknown':
          return { success: true, message: 'Command not understood', spokenResponse: action.spoken_response };
        
        default:
          return { success: false, message: 'Unknown action type' };
      }
    } catch (error) {
      console.error('Voice action execution failed:', error);
      return { success: false, message: 'Action execution failed' };
    }
  }

  async executeAction(action: VoiceAction): Promise<VoiceExecutionResult> {
    return this.executeVoiceAction(action);
  }

  private executeNavigate(params: { target: string }): VoiceExecutionResult {
    if (!this.router) {
      return { success: false, message: 'Router not available' };
    }

    const routeMap: { [key: string]: string } = {
      'dashboard': '/dashboard',
      'finance': '/finance',
      'marketplace': '/finance', // Finance includes marketplace
      'reports': '/reports',
      'land-records': '/land-records',
      'settings': '/settings',
      'health-check': '/health-check',
    };

    const route = routeMap[params.target];
    if (route) {
      if (params.target === 'marketplace') {
        sessionStorage.setItem('voice_requested_finance_tab', 'marketplace');
      }
      this.router.push(route);
      return { 
        success: true, 
        message: `Navigated to ${params.target}`,
        navigation: route,
        spokenResponse: `Opening ${params.target}.`
      };
    }

    return { success: false, message: 'Unknown navigation target' };
  }

  private executeBuyItem(params: { item: string; vendor?: string; quantity?: string }): VoiceExecutionResult {
    const vendors = walletService.getVendors();

    const itemLower = params.item.toLowerCase();
    const preferredVendor = params.vendor && params.vendor !== 'any'
      ? vendors.find(vendor => vendor.name.toLowerCase().includes(params.vendor!.toLowerCase()))
      : null;

    const candidateVendors = preferredVendor ? [preferredVendor] : vendors;
    const matches: Array<{ vendor: any; product: any }> = [];

    for (const vendor of candidateVendors) {
      for (const product of vendor.products) {
        const productLower = product.name.toLowerCase();
        const categoryLower = product.category.toLowerCase();

        if (productLower.includes(itemLower) || itemLower.includes(productLower) || categoryLower.includes(itemLower) || itemLower.includes(categoryLower)) {
          matches.push({ vendor, product });
        }
      }
    }

    const sortedMatches = matches.sort((left, right) => left.product.price - right.product.price);
    const matchedEntry = sortedMatches[0];

    if (!matchedEntry) {
      return { success: false, message: `Could not find ${params.item} in marketplace` };
    }

    const { vendor: matchedVendor, product: matchedProduct } = matchedEntry;

    const result = walletService.createManualOrder(
      matchedVendor.name, 
      matchedProduct.name, 
      matchedProduct.price
    );

    if (result.success) {
      return { 
        success: true, 
        message: `Purchased ${matchedProduct.name} from ${matchedVendor.name} for ₹${matchedProduct.price}. New balance: ₹${result.newBalance}`,
        spokenResponse: `Purchased ${matchedProduct.name} from ${matchedVendor.name}. Your new balance is ₹${result.newBalance}.`
      };
    }

    return { success: false, message: result.message || 'Purchase failed' };
  }

  private async executeCheckWeather(params: any): Promise<VoiceExecutionResult> {
    const location = this.getPrimaryLandLocation();
    const weather = await weatherService.getWeatherData(location);
    const spokenResponse = this.formatWeatherSpokenResponse(weather);

    return {
      success: true,
      message: 'Weather information provided',
      spokenResponse
    };
  }

  private executeScheduleTask(params: { task: string; date?: string; time?: string }): VoiceExecutionResult {
    const landId = this.getPrimaryLandId();
    if (!landId) {
      return { success: false, message: 'No land available to schedule task' };
    }

    const date = params.date || this.getRelativeDate(1);
    const time = params.time || '09:00';

    const newTask = {
      task: params.task,
      date,
      time,
      status: 'pending'
    };

    landMonitoringService.addScheduledTask(landId, newTask);

    return { 
      success: true, 
      message: `Scheduled "${params.task}" for ${date}${time ? ` at ${time}` : ''}`,
      spokenResponse: `Scheduled ${params.task} for ${this.formatDateForSpeech(date)}${time ? ` at ${this.formatTimeForSpeech(time)}` : ''}.`
    };
  }

  private executeChangeLanguage(params: { language: string }): VoiceExecutionResult {
    try {
      const supportedLanguages = ['en', 'hi', 'kn', 'te', 'ta', 'mr', 'bn', 'gu', 'ml', 'pa', 'or'];
      
      if (!supportedLanguages.includes(params.language)) {
        return { success: false, message: 'Language not supported' };
      }

      // Use existing language service
      languageService.setLanguage(params.language as SupportedLanguage);
      
      return { 
        success: true, 
        message: `Language changed to ${params.language}`,
        spokenResponse: this.getLanguageConfirmation(params.language as SupportedLanguage)
      };
    } catch (error) {
      return { success: false, message: 'Failed to change language' };
    }
  }

  private executeCheckReport(params: { report_type: string }): VoiceExecutionResult {
    if (!this.router) {
      return { success: false, message: 'Router not available' };
    }

    // Navigate to reports page
    this.router.push('/reports');
    
    // Store the specific report type to highlight/open
    sessionStorage.setItem('voice_requested_report', params.report_type);
    sessionStorage.setItem('voice_requested_report_tab', this.mapReportToTab(params.report_type));
    
    return { 
      success: true, 
      message: `Opening ${params.report_type} report`,
      navigation: '/reports',
      spokenResponse: `Opening your ${params.report_type} report.`
    };
  }

  private executeCheckInventory(params: { crop?: string }): VoiceExecutionResult {
    if (!this.router) {
      return { success: false, message: 'Router not available' };
    }

    // Navigate to finance page (which includes inventory)
    sessionStorage.setItem('voice_requested_finance_tab', 'inventory');
    if (params.crop) {
      sessionStorage.setItem('voice_requested_crop', params.crop);
    }
    this.router.push('/finance');
    
    return { 
      success: true, 
      message: params.crop ? `Showing ${params.crop} inventory` : 'Opening inventory',
      navigation: '/finance',
      spokenResponse: params.crop
        ? `Opening inventory for ${params.crop}.`
        : 'Opening your inventory.'
    };
  }

  private getPrimaryLandId(): string | null {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    return lands[0]?.id || null;
  }

  private getPrimaryLandLocation(): string {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const land = lands[0];
    if (!land) {
      return 'Mysuru, Karnataka';
    }

    return `${land.district || 'Mysuru'}, ${land.state || 'Karnataka'}`;
  }

  private getRelativeDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  private mapReportToTab(reportType: string): string {
    if (reportType === 'profit') return 'financial';
    if (reportType === 'stock') return 'stock';
    return 'performance';
  }

  private formatDateForSpeech(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  }

  private formatTimeForSpeech(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  private formatWeatherSpokenResponse(weather: any): string {
    const min = Math.round(weather.temperature?.min ?? 0);
    const max = Math.round(weather.temperature?.max ?? 0);
    const humidity = Math.round(weather.humidity ?? 0);
    const condition = weather.forecast?.[0]?.conditions || 'partly cloudy';

    const language = languageService.getCurrentLanguage();
    if (language === 'hi') {
      return `आज ${weather.location || 'आपके क्षेत्र'} में ${condition} है। तापमान ${min} से ${max} डिग्री है और आर्द्रता ${humidity} प्रतिशत है।`;
    }

    return `Today in ${weather.location || 'your area'} it is ${condition}. Temperature is ${min} to ${max} degrees with ${humidity} percent humidity.`;
  }

  private getLanguageConfirmation(language: SupportedLanguage): string {
    if (language === 'hi') return 'भाषा हिंदी में बदल दी गई है।';
    if (language === 'kn') return 'ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.';
    if (language === 'te') return 'భాష తెలుగుకు మార్చబడింది.';
    if (language === 'ta') return 'மொழி தமிழில் மாற்றப்பட்டது.';
    if (language === 'mr') return 'भाषा मराठीत बदलली आहे.';
    if (language === 'bn') return 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।';
    if (language === 'gu') return 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.';
    if (language === 'ml') return 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.';
    if (language === 'pa') return 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲੀ ਗਈ ਹੈ।';
    if (language === 'or') return 'ଭାଷା ଓଡ଼ିଆକୁ ପରିବର୍ତ୍ତନ ହୋଇଛି।';
    return 'Language changed to English.';
  }
}

export const voiceActionExecutor = new VoiceActionExecutor();