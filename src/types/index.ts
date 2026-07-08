export interface User {
  id: string;
  name: string;
  age: number;
  phone: string;
  language: 'hindi' | 'english' | 'kannada' | 'telugu' | 'tamil';
  state: string;
  district: string;
  village: string;
  userType: 'landowner' | 'tenant' | 'government';
  // Landowner specific
  landSize?: number;
  landUnit?: 'bigha' | 'acre' | 'hectare';
  // Tenant specific
  hourlyRate?: number;
  cropSpecialization?: string;
  createdAt: Date;
}

export interface Land {
  id: string;
  userId: string;
  state: string;
  district: string;
  village: string;
  size: number;
  unit: 'bigha' | 'acres' | 'hectares';
  coordinates: Array<{ lat: number; lng: number }>;
  analysis?: LandAnalysis;
  createdAt: Date;
}

export interface LandAnalysis {
  id: string;
  landId: string;
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
  irrigationType?: 'borewell' | 'canal' | 'rain-fed' | 'other';
  createdAt: Date;
}

export interface SatelliteData {
  landId: string;
  ndvi: number;
  vegetationIndex: number;
  groundwaterTrend: 'increasing' | 'stable' | 'decreasing';
  moisture: number;
  nearbyWaterSources: number;
  waterAvailabilityScore: number;
  lastUpdated: Date;
}

export interface CropRecommendation {
  id: string;
  landId: string;
  crops: Array<{
    name: string;
    expectedYield: number;
    expectedProfit: number;
    investment: number;
    riskLevel: 'low' | 'medium' | 'high';
    marketDemand: number;
    growingSeason: string;
    harvestTime: string;
    fertilizerPlan: string;
    pesticidePlan: string;
    irrigationPlan: string;
    expectedROI: number;
    confidenceScore: number;
    reasoning: string;
  }>;
  createdAt: Date;
}

export interface WeatherData {
  location: string;
  temperature: { min: number; max: number };
  humidity: number;
  rainfall: number;
  wind: number;
  heatStress: 'low' | 'medium' | 'high';
  droughtRisk: 'low' | 'medium' | 'high';
  forecast: Array<{
    date: string;
    temperature: { min: number; max: number };
    rainfall: number;
    conditions: string;
  }>;
  lastUpdated: Date;
}

export interface HealthReport {
  id: string;
  landId: string;
  imageUrl: string;
  diagnosis: 'healthy' | 'disease' | 'pest' | 'nitrogen_deficiency' | 'potassium_deficiency' | 'water_stress';
  medicine?: string;
  dosage?: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  needsGovernmentReview: boolean;
  createdAt: Date;
}

export interface GovernmentCase {
  id: string;
  healthReportId: string;
  farmerId: string;
  status: 'pending' | 'approved' | 'rejected';
  officerNotes?: string;
  recommendedAction?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TenantProfile {
  id: string;
  userId: string;
  hourlyRate: number;
  experience: number;
  skills: string[];
  rating: number;
  availability: boolean;
  completedJobs: number;
}

export interface Wallet {
  userId: string;
  balance: number;
  expenses: Array<{
    date: Date;
    amount: number;
    description: string;
    category: string;
  }>;
  projectedProfit: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'weather' | 'disease' | 'market_price' | 'photo_reminder' | 'water_reminder' | 'harvest_reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface RbkEscalation {
  id: string;
  farmerId: string;
  cropName: string;
  quantity: number;
  estimatedCost: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  requestDate: Date;
  approvalDate?: Date;
  notes?: string;
}

export interface SamplePhoto {
  id: string;
  landId: string;
  dayNumber: number;
  imageUrl: string;
  cropType: string;
  description: string;
}

export interface IrrigationChoice {
  type: 'borewell' | 'canal' | 'rain-fed' | 'other';
  description: string;
}

export interface SensorChoice {
  useSensors: boolean;
  sensorTypes?: string[];
}