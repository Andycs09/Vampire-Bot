import { geminiService } from './gemini';

export interface SensorReading {
  sensorId: string;
  sensorName: string;
  value: string;
  timestamp: Date;
  unit: string;
}

export interface SensorAnalysisResult {
  recommendation_still_valid: boolean;
  confidence: number;
  sensor_summary: string;
  concerns: {
    sensor: string;
    reading: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  suggested_adjustment: string | null;
}

export interface IoTAnalysisEntry {
  id: string;
  landId: string;
  timestamp: string;
  sensorReadings: SensorReading[];
  analysisResult: SensorAnalysisResult;
  currentRecommendation: {
    crop_name: string;
    season: string;
    days_since_planting: number;
  };
}

class IoTSensorAnalysisService {
  private readonly ANALYSIS_INTERVAL_DAYS = 3;
  private readonly STORAGE_KEY_PREFIX = 'iot_analysis_';

  /**
   * Get sensor readings for a specific land parcel
   */
  getSensorReadings(landId: string): SensorReading[] {
    const iotSetup = localStorage.getItem(`iot_setup_${landId}`);
    if (!iotSetup) return [];

    const setup = JSON.parse(iotSetup);
    if (!setup.sensorReadings) return [];

    const sensorNames: { [key: string]: string } = {
      'dht22': 'DHT22 (Temperature & Humidity)',
      'ds18b20': 'DS18B20 (Soil Temperature)',
      'soil_moisture': 'Capacitive Soil Moisture Sensor',
      'npk': 'NPK Sensor',
      'soil_ph': 'Soil pH Sensor',
      'bh1750': 'BH1750 Light Sensor',
      'rain': 'Rain Sensor',
      'water_level': 'Water Level Sensor',
      'water_flow': 'Water Flow Sensor',
      'mq135': 'MQ-135 Air Quality Sensor',
      'co2': 'CO₂ Sensor (MH-Z19B)',
    };

    const sensorUnits: { [key: string]: string } = {
      'dht22': '°C / %RH',
      'ds18b20': '°C',
      'soil_moisture': '%',
      'npk': 'ppm',
      'soil_ph': 'pH',
      'bh1750': 'lux',
      'rain': 'mm/h',
      'water_level': 'cm',
      'water_flow': 'L/min',
      'mq135': 'ppm',
      'co2': 'ppm',
    };

    return Object.entries(setup.sensorReadings).map(([sensorId, reading]: [string, any]) => ({
      sensorId,
      sensorName: sensorNames[sensorId] || sensorId,
      value: reading.value,
      timestamp: new Date(reading.timestamp),
      unit: sensorUnits[sensorId] || ''
    }));
  }

  /**
   * Check if it's time for a new analysis (every 3 days)
   */
  shouldRunAnalysis(landId: string): boolean {
    const lastAnalysis = this.getLatestAnalysis(landId);
    if (!lastAnalysis) return true;

    const timeSinceLastAnalysis = Date.now() - new Date(lastAnalysis.timestamp).getTime();
    const daysSinceLastAnalysis = timeSinceLastAnalysis / (1000 * 60 * 60 * 24);

    return daysSinceLastAnalysis >= this.ANALYSIS_INTERVAL_DAYS;
  }

  /**
   * Get all analysis entries for a land parcel
   */
  getAnalysisHistory(landId: string): IoTAnalysisEntry[] {
    const historyData = localStorage.getItem(this.STORAGE_KEY_PREFIX + landId);
    if (!historyData) return [];

    return JSON.parse(historyData);
  }

  /**
   * Get the latest analysis for a land parcel
   */
  getLatestAnalysis(landId: string): IoTAnalysisEntry | null {
    const history = this.getAnalysisHistory(landId);
    if (history.length === 0) return null;

    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  /**
   * Run sensor analysis using AI
   */
  async runSensorAnalysis(landId: string, manualTrigger = false): Promise<IoTAnalysisEntry> {
    const sensorReadings = this.getSensorReadings(landId);
    if (sensorReadings.length === 0) {
      throw new Error('No sensor readings available for analysis');
    }

    // Get land information
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const land = lands.find((l: any) => l.id === landId);
    if (!land) {
      throw new Error('Land information not found');
    }

    // Get current crop recommendation
    const currentCropData = localStorage.getItem('current_crop_timeline');
    let currentRecommendation = {
      crop_name: 'Rice',
      season: 'Kharif',
      days_since_planting: 45
    };

    if (currentCropData) {
      const cropData = JSON.parse(currentCropData);
      const plantingDate = new Date(cropData.plantingDate);
      const daysSincePlanting = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));
      
      currentRecommendation = {
        crop_name: cropData.crop || 'Rice',
        season: cropData.season || 'Kharif',
        days_since_planting: daysSincePlanting
      };
    }

    // Prepare sensor readings for AI
    const sensorReadingsJson = sensorReadings.map(reading => ({
      sensor: reading.sensorName,
      value: reading.value,
      unit: reading.unit,
      timestamp: reading.timestamp.toISOString()
    }));

    // Prepare AI prompt
    const systemPrompt = `You are an agricultural sensor data analyst for Fasal Munafa. You will receive raw IoT sensor readings for a specific farmer's land parcel, along with the AI's most recent crop/land recommendation. Assess whether current sensor conditions support or contradict that recommendation, and flag any concerning readings.

Respond ONLY with valid JSON, no markdown, no preamble, using this exact schema:
{
  "recommendation_still_valid": true or false,
  "confidence": number (0-100),
  "sensor_summary": "one sentence plain-language summary",
  "concerns": [
    {
      "sensor": "string, e.g. 'Soil pH Sensor'",
      "reading": "string, e.g. '5.1'",
      "issue": "string, e.g. 'Below optimal range for rice (6.0-7.0)'",
      "severity": "low" | "medium" | "high"
    }
  ],
  "suggested_adjustment": "string or null — brief corrective action if recommendation_still_valid is false"
}`;

    const userMessage = `Current AI crop recommendation: ${currentRecommendation.crop_name}, ${currentRecommendation.season}, planted ${currentRecommendation.days_since_planting} days ago

Sensor readings (most recent, taken ${new Date().toISOString()}):
${JSON.stringify(sensorReadingsJson, null, 2)}

Soil/crop context: ${land.state}, ${land.district}, soil type from lookup table

Evaluate whether these readings suit what ${currentRecommendation.crop_name} needs at this growth stage, and flag anything outside a healthy range.`;

    let analysisResult: SensorAnalysisResult;

    try {
      // Use the wallet agent method as it's the most general text processing method
      const response = await geminiService.processWalletAgent(systemPrompt, userMessage);
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from AI response');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Generate fallback analysis
      analysisResult = this.generateFallbackAnalysis(sensorReadings, currentRecommendation);
    }

    // Create analysis entry
    const analysisEntry: IoTAnalysisEntry = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      landId,
      timestamp: new Date().toISOString(),
      sensorReadings,
      analysisResult,
      currentRecommendation
    };

    // Save analysis
    this.saveAnalysis(analysisEntry);

    // Send high-severity notifications
    if (analysisResult.concerns.some(c => c.severity === 'high')) {
      this.sendHighSeverityNotification(landId, analysisResult);
    }

    return analysisEntry;
  }

  /**
   * Generate fallback analysis when AI services fail
   */
  private generateFallbackAnalysis(readings: SensorReading[], currentRec: any): SensorAnalysisResult {
    const concerns = [];

    // Check for common issues
    for (const reading of readings) {
      if (reading.sensorId === 'soil_ph') {
        const ph = parseFloat(reading.value);
        if (ph < 6.0 || ph > 7.0) {
          concerns.push({
            sensor: reading.sensorName,
            reading: reading.value,
            issue: `pH ${ph < 6.0 ? 'too acidic' : 'too alkaline'} for optimal ${currentRec.crop_name} growth`,
            severity: ph < 5.5 || ph > 7.5 ? 'high' : 'medium'
          });
        }
      }
      
      if (reading.sensorId === 'soil_moisture') {
        const moisture = parseFloat(reading.value.replace('%', ''));
        if (moisture < 30) {
          concerns.push({
            sensor: reading.sensorName,
            reading: reading.value,
            issue: 'Soil moisture too low, may cause water stress',
            severity: moisture < 20 ? 'high' : 'medium'
          });
        }
      }
    }

    return {
      recommendation_still_valid: concerns.length === 0,
      confidence: 75,
      sensor_summary: `${concerns.length} potential issues detected from ${readings.length} sensor readings`,
      concerns: concerns as any[],
      suggested_adjustment: concerns.length > 0 ? 'Address soil conditions and monitor water levels' : null
    };
  }

  /**
   * Save analysis entry to localStorage
   */
  private saveAnalysis(entry: IoTAnalysisEntry): void {
    const history = this.getAnalysisHistory(entry.landId);
    history.push(entry);

    // Keep only last 20 analyses
    const trimmedHistory = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    localStorage.setItem(this.STORAGE_KEY_PREFIX + entry.landId, JSON.stringify(trimmedHistory));
  }

  /**
   * Send notification for high-severity concerns
   */
  private sendHighSeverityNotification(landId: string, analysis: SensorAnalysisResult): void {
    const highSeverityConcerns = analysis.concerns.filter(c => c.severity === 'high');
    if (highSeverityConcerns.length === 0) return;

    // Add to notifications (existing system)
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    highSeverityConcerns.forEach(concern => {
      notifications.unshift({
        id: Date.now() + Math.random(),
        type: 'sensor_alert',
        message: `High priority: ${concern.issue}`,
        time: 'just now',
        unread: true,
        landId,
        sensorId: concern.sensor,
        severity: concern.severity
      });
    });

    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50))); // Keep last 50
  }

  /**
   * Manual trigger for analysis (demo purposes)
   */
  async runAnalysisNow(landId: string): Promise<IoTAnalysisEntry> {
    return this.runSensorAnalysis(landId, true);
  }

  /**
   * Get analysis summary for dashboard
   */
  getAnalysisSummary(landId: string): {
    hasActiveIoT: boolean;
    latestAnalysis: IoTAnalysisEntry | null;
    needsAttention: boolean;
    summaryText: string;
  } {
    const iotSetup = localStorage.getItem(`iot_setup_${landId}`);
    if (!iotSetup) {
      return {
        hasActiveIoT: false,
        latestAnalysis: null,
        needsAttention: false,
        summaryText: 'IoT sensors not configured'
      };
    }

    const setup = JSON.parse(iotSetup);
    if (!setup.enabledSensors || setup.enabledSensors.length === 0) {
      return {
        hasActiveIoT: false,
        latestAnalysis: null,
        needsAttention: false,
        summaryText: 'No sensors enabled'
      };
    }

    const latestAnalysis = this.getLatestAnalysis(landId);
    if (!latestAnalysis) {
      return {
        hasActiveIoT: true,
        latestAnalysis: null,
        needsAttention: false,
        summaryText: 'Awaiting first analysis'
      };
    }

    const needsAttention = !latestAnalysis.analysisResult.recommendation_still_valid ||
                          latestAnalysis.analysisResult.concerns.some(c => c.severity === 'high');

    return {
      hasActiveIoT: true,
      latestAnalysis,
      needsAttention,
      summaryText: latestAnalysis.analysisResult.sensor_summary
    };
  }
}

export const iotSensorAnalysisService = new IoTSensorAnalysisService();