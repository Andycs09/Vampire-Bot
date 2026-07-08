interface LandAnalysisPrompt {
  imageUrl: string;
  landSize: number;
  location: string;
}

interface CropRecommendationPrompt {
  landAnalysis: any;
  satelliteData: any;
  weather: any;
  irrigationType?: string;
  farmerPreferences?: string[];
}

interface VisionAnalysis {
  vegetation: number;
  trees: number;
  roads: boolean;
  buildings: boolean;
  water: boolean;
  canals: boolean;
  nearbyLakes: boolean;
  slope: 'low' | 'medium' | 'high';
  rockyArea: number;
  floodRisk: 'low' | 'medium' | 'high';
  cropSuitability: number;
  overallScore: number;
  confidence: number;
  reasoning: string;
  waterSourceType?: 'river' | 'lake' | 'borewell' | 'canal' | 'none';
  treeDensity: number;
  suitabilityScore: number;
  risks: string[];
}

interface HealthDiagnosis {
  diagnosis: 'healthy' | 'disease' | 'pest' | 'nitrogen_deficiency' | 'potassium_deficiency' | 'water_stress';
  medicine?: string;
  dosage?: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  requiresHumanReview: boolean;
  reasoning: string;
}

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }

  async analyzeLandFromImage(imageUrl: string, landSize: number, location: string): Promise<VisionAnalysis> {
    try {
      // For demo, return mock data but in real implementation would call Gemini Vision API
      return this.mockLandAnalysis();
    } catch (error) {
      console.error('Gemini Vision API error:', error);
      return this.mockLandAnalysis();
    }
  }

  async getCropRecommendations(prompt: CropRecommendationPrompt): Promise<any> {
    try {
      return this.mockCropRecommendationsWithPesticides();
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.mockCropRecommendationsWithPesticides();
    }
  }

  async analyzeCropHealth(imageUrl: string): Promise<HealthDiagnosis> {
    try {
      return this.mockHealthAnalysis();
    } catch (error) {
      console.error('Gemini Vision API error:', error);
      return this.mockHealthAnalysis();
    }
  }

  async processVoiceQuery(text: string, language: string = 'en'): Promise<string> {
    try {
      // Mock voice response for demo
      if (language === 'hi') {
        return 'यह एक डेमो रिस्पॉन्स है। वास्तविक ऐप में Gemini API से जवाब मिलेगा।';
      }
      return 'This is a demo response. In the real app, this would be powered by Gemini API.';
    } catch (error) {
      console.error('Gemini voice query error:', error);
      return language === 'hi' 
        ? 'मुझे समझने में समस्या हुई। कृपया दोबारा कोशिश करें।'
        : 'I had trouble understanding. Please try again.';
    }
  }

  private mockLandAnalysis(): VisionAnalysis {
    return {
      vegetation: 75,
      trees: 15,
      roads: true,
      buildings: false,
      water: true,
      canals: false,
      nearbyLakes: true,
      slope: 'low' as const,
      rockyArea: 10,
      floodRisk: 'low' as const,
      cropSuitability: 85,
      overallScore: 88,
      confidence: 92,
      reasoning: 'Excellent agricultural land with good soil quality, adequate water sources, and minimal slope.',
      waterSourceType: 'lake' as const,
      treeDensity: 15,
      suitabilityScore: 85,
      risks: ['occasional flooding during monsoon', 'potential pest issues due to nearby water']
    };
  }

  private mockCropRecommendationsWithPesticides() {
    return {
      crops: [
        {
          name: 'Rice',
          expectedYield: 2500,
          expectedProfit: 45000,
          investment: 25000,
          riskLevel: 'low' as const,
          marketDemand: 95,
          growingSeason: 'Kharif (next 2-3 weeks: optimal planting window)',
          harvestTime: '120-150 days',
          fertilizerPlan: 'Week 1-2: NPK 10:26:26 at 50kg/acre during land preparation',
          pesticidePlan: 'Week 1-3: Preventive neem oil spray, monitor for stem borer',
          irrigationPlan: 'Week 1-2: Initial flooding 2-3 inches, maintain water level',
          expectedROI: 180,
          confidenceScore: 94,
          reasoning: 'Ideal conditions for rice cultivation with adequate water and suitable soil',
          pesticideGuidance: {
            productCategory: 'Organophosphate insecticide for stem borer',
            quantityPerAcre: '200-300ml per acre',
            applicationArea: 'Focus on low-lying areas near water source where pests concentrate'
          }
        }
      ]
    };
  }

  private mockHealthAnalysis(): HealthDiagnosis {
    return {
      diagnosis: 'nitrogen_deficiency' as const,
      medicine: 'Urea fertilizer application',
      dosage: '50kg per acre, split into 2 applications',
      confidence: 78,
      severity: 'medium' as const,
      requiresHumanReview: false,
      reasoning: 'Yellowing of lower leaves indicates nitrogen deficiency. Immediate fertilizer application recommended.'
    };
  }
}

export const geminiService = new GeminiService();