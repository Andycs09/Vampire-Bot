import { geminiService } from './gemini';

interface PatchData {
  patchNumber: number;
  ndviHealth: number; // 0-100%
  color: 'green' | 'yellow' | 'red';
  lastChecked: string;
  photos: string[]; // photo IDs
  issues?: string[];
}

interface CropHealthAnalysis {
  cropHealth: number;
  confidence: number;
  disease: string;
  growthStage: string;
  waterStress: 'Low' | 'Medium' | 'High';
  nitrogenDeficiency: 'None' | 'Possible' | 'Likely';
  weedCoverage: string;
  leafColor: string;
  pestAttack: string;
  plantDensity: string;
  lodging: string;
  dryPatches: string;
}

interface WeightedHealthScore {
  finalScore: number;
  components: {
    geminiImage: { value: number; weight: number };
    weather: { value: number; weight: number };
    satelliteNDVI: { value: number; weight: number };
    previousReports: { value: number; weight: number };
  };
}

interface LandProductivityScore {
  finalScore: number;
  components: {
    historicalYield: { value: number; weight: number };
    weather: { value: number; weight: number };
    satelliteNDVI: { value: number; weight: number };
    soil: { value: number; weight: number };
    waterAvailability: { value: number; weight: number };
  };
}

interface WaterEfficiencyScore {
  finalScore: number;
  components: {
    rainfall: { value: number; weight: number };
    satelliteMoisture: { value: number; weight: number };
    cropType: { value: number; weight: number };
    irrigationMethod: { value: number; weight: number };
  };
}

class LandMonitoringService {
  private patchesKey = 'land_patches';
  private healthHistoryKey = 'health_history';
  private landRecordsKey = 'land_records';
  private scheduledTasksKey = 'scheduled_tasks';

  // Generate patch grid for a land parcel
  generatePatchGrid(landId: string, gridSize: number = 3): PatchData[] {
    const patches: PatchData[] = [];
    const totalPatches = gridSize * gridSize;

    for (let i = 0; i < totalPatches; i++) {
      const ndviHealth = this.generateRealisticNDVI();
      patches.push({
        patchNumber: i + 1,
        ndviHealth,
        color: ndviHealth >= 85 ? 'green' : ndviHealth >= 65 ? 'yellow' : 'red',
        lastChecked: new Date().toISOString(),
        photos: [],
        issues: ndviHealth < 85 ? this.generatePatchIssues(ndviHealth) : undefined
      });
    }

    // Save to localStorage
    const allPatches = this.getAllPatches();
    allPatches[landId] = patches;
    localStorage.setItem(this.patchesKey, JSON.stringify(allPatches));

    return patches;
  }

  private generateRealisticNDVI(): number {
    // Generate realistic NDVI values with weighted distribution
    // 60% chance of healthy (85-96%), 30% moderate (65-84%), 10% stressed (<65%)
    const random = Math.random();
    if (random < 0.6) {
      return Math.round(85 + Math.random() * 11); // 85-96%
    } else if (random < 0.9) {
      return Math.round(65 + Math.random() * 19); // 65-84%
    } else {
      return Math.round(45 + Math.random() * 19); // 45-64%
    }
  }

  private generatePatchIssues(ndviHealth: number): string[] {
    const issues: string[] = [];
    if (ndviHealth < 65) {
      issues.push('Low vegetation density');
      if (Math.random() > 0.5) issues.push('Possible water stress');
    }
    if (ndviHealth < 75 && Math.random() > 0.6) {
      issues.push('Nutrient deficiency suspected');
    }
    return issues;
  }

  getAllPatches(): Record<string, PatchData[]> {
    const data = localStorage.getItem(this.patchesKey);
    return data ? JSON.parse(data) : {};
  }

  getPatches(landId: string): PatchData[] | null {
    const allPatches = this.getAllPatches();
    return allPatches[landId] || null;
  }

  updatePatchHealth(landId: string, patchNumber: number, newHealth: number): void {
    const patches = this.getPatches(landId);
    if (!patches) return;

    const patch = patches.find(p => p.patchNumber === patchNumber);
    if (patch) {
      patch.ndviHealth = newHealth;
      patch.color = newHealth >= 85 ? 'green' : newHealth >= 65 ? 'yellow' : 'red';
      patch.lastChecked = new Date().toISOString();

      const allPatches = this.getAllPatches();
      allPatches[landId] = patches;
      localStorage.setItem(this.patchesKey, JSON.stringify(allPatches));
    }
  }

  // Calculate weighted crop health score
  calculateCropHealthScore(
    geminiAnalysis: CropHealthAnalysis,
    weatherScore: number,
    satelliteNDVIAvg: number,
    landId: string
  ): WeightedHealthScore {
    const history = this.getHealthHistory(landId);
    const previousAvg = history.length > 0
      ? history.slice(-3).reduce((sum, h) => sum + h.finalScore, 0) / Math.min(history.length, 3)
      : 70; // Default if no history

    const components = {
      geminiImage: { value: geminiAnalysis.cropHealth, weight: 0.4 },
      weather: { value: weatherScore, weight: 0.2 },
      satelliteNDVI: { value: satelliteNDVIAvg, weight: 0.2 },
      previousReports: { value: previousAvg, weight: 0.2 }
    };

    const finalScore = Math.round(
      components.geminiImage.value * components.geminiImage.weight +
      components.weather.value * components.weather.weight +
      components.satelliteNDVI.value * components.satelliteNDVI.weight +
      components.previousReports.value * components.previousReports.weight
    );

    // Store in history
    this.addToHealthHistory(landId, {
      finalScore,
      timestamp: new Date().toISOString(),
      components
    });

    return { finalScore, components };
  }

  // Calculate land productivity score
  calculateProductivityScore(
    historicalYield: number,
    weatherScore: number,
    satelliteNDVIAvg: number,
    soilQuality: number,
    waterAvailability: number
  ): LandProductivityScore {
    const components = {
      historicalYield: { value: historicalYield, weight: 0.3 },
      weather: { value: weatherScore, weight: 0.2 },
      satelliteNDVI: { value: satelliteNDVIAvg, weight: 0.2 },
      soil: { value: soilQuality, weight: 0.2 },
      waterAvailability: { value: waterAvailability, weight: 0.1 }
    };

    const finalScore = Math.round(
      components.historicalYield.value * components.historicalYield.weight +
      components.weather.value * components.weather.weight +
      components.satelliteNDVI.value * components.satelliteNDVI.weight +
      components.soil.value * components.soil.weight +
      components.waterAvailability.value * components.waterAvailability.weight
    );

    return { finalScore, components };
  }

  // Calculate water usage efficiency
  calculateWaterEfficiency(
    rainfall: number,
    satelliteMoisture: number,
    cropType: string,
    irrigationMethod: string
  ): WaterEfficiencyScore {
    // Crop water need lookup
    const cropWaterNeeds: Record<string, number> = {
      'rice': 20, // High water need
      'wheat': 60,
      'cotton': 50,
      'maize': 55,
      'millet': 80, // Low water need
      'sorghum': 75,
      'default': 60
    };

    const cropScore = cropWaterNeeds[cropType.toLowerCase()] || cropWaterNeeds.default;

    // Irrigation method efficiency
    const irrigationEfficiency: Record<string, number> = {
      'drip': 90,
      'sprinkler': 75,
      'canal': 60,
      'borewell': 70,
      'rain-fed': 50,
      'other': 60
    };

    const irrigationScore = irrigationEfficiency[irrigationMethod.toLowerCase()] || 60;

    const components = {
      rainfall: { value: rainfall, weight: 0.3 },
      satelliteMoisture: { value: satelliteMoisture, weight: 0.3 },
      cropType: { value: cropScore, weight: 0.2 },
      irrigationMethod: { value: irrigationScore, weight: 0.2 }
    };

    const finalScore = Math.round(
      components.rainfall.value * components.rainfall.weight +
      components.satelliteMoisture.value * components.satelliteMoisture.weight +
      components.cropType.value * components.cropType.weight +
      components.irrigationMethod.value * components.irrigationMethod.weight
    );

    return { finalScore, components };
  }

  // Get average NDVI from all patches
  getAverageNDVI(landId: string): number {
    const patches = this.getPatches(landId);
    if (!patches || patches.length === 0) return 75; // Default

    const sum = patches.reduce((acc, patch) => acc + patch.ndviHealth, 0);
    return Math.round(sum / patches.length);
  }

  // Health history management
  private getHealthHistory(landId: string): any[] {
    const allHistory = localStorage.getItem(this.healthHistoryKey);
    const history = allHistory ? JSON.parse(allHistory) : {};
    return history[landId] || [];
  }

  private addToHealthHistory(landId: string, entry: any): void {
    const allHistory = localStorage.getItem(this.healthHistoryKey);
    const history = allHistory ? JSON.parse(allHistory) : {};
    
    if (!history[landId]) {
      history[landId] = [];
    }
    
    history[landId].push(entry);
    
    // Keep only last 10 entries
    if (history[landId].length > 10) {
      history[landId] = history[landId].slice(-10);
    }
    
    localStorage.setItem(this.healthHistoryKey, JSON.stringify(history));
  }

  // Mock weather scoring
  getWeatherScore(): number {
    // In production, this would call OpenWeather API
    // For now, return a realistic mock score based on time of year
    const month = new Date().getMonth();
    
    // Monsoon months (June-September) get lower scores
    if (month >= 5 && month <= 8) {
      return Math.round(65 + Math.random() * 15); // 65-80%
    }
    
    // Good weather months
    return Math.round(75 + Math.random() * 20); // 75-95%
  }

  // Mock soil quality lookup
  getSoilQuality(state: string, district: string): number {
    // Karnataka generally has good soil
    if (state.toLowerCase().includes('karnataka')) {
      return Math.round(75 + Math.random() * 15); // 75-90%
    }
    
    // Punjab/Haryana - excellent soil
    if (state.toLowerCase().includes('punjab') || state.toLowerCase().includes('haryana')) {
      return Math.round(85 + Math.random() * 10); // 85-95%
    }
    
    // Default
    return Math.round(65 + Math.random() * 20); // 65-85%
  }

  // Scheduled tasks
  getScheduledTasks(landId: string): any[] {
    const allTasks = localStorage.getItem(this.scheduledTasksKey);
    const tasks = allTasks ? JSON.parse(allTasks) : {};
    return tasks[landId] || [];
  }

  addScheduledTask(landId: string, task: any): void {
    const allTasks = localStorage.getItem(this.scheduledTasksKey);
    const tasks = allTasks ? JSON.parse(allTasks) : {};
    
    if (!tasks[landId]) {
      tasks[landId] = [];
    }
    
    tasks[landId].push({
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(this.scheduledTasksKey, JSON.stringify(tasks));
  }

  // Land records
  getLandRecords(landId: string): any {
    const allRecords = localStorage.getItem(this.landRecordsKey);
    const records = allRecords ? JSON.parse(allRecords) : {};
    return records[landId] || this.createDefaultLandRecord(landId);
  }

  private createDefaultLandRecord(landId: string): any {
    return {
      landId,
      pastCrops: [
        { crop: 'Rice', season: 'Kharif 2025', yield: 2500, profit: 45000 },
        { crop: 'Wheat', season: 'Rabi 2024-25', yield: 1800, profit: 32000 }
      ],
      photos: [],
      healthScores: [],
      totalInvestment: 0,
      totalRevenue: 0
    };
  }

  updateLandRecords(landId: string, updates: any): void {
    const allRecords = localStorage.getItem(this.landRecordsKey);
    const records = allRecords ? JSON.parse(allRecords) : {};
    
    records[landId] = {
      ...this.getLandRecords(landId),
      ...updates
    };
    
    localStorage.setItem(this.landRecordsKey, JSON.stringify(records));
  }
}

export const landMonitoringService = new LandMonitoringService();
export type { PatchData, CropHealthAnalysis, WeightedHealthScore, LandProductivityScore, WaterEfficiencyScore };
