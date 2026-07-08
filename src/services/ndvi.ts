interface NDVIDataPoint {
  date: string;
  ndvi: number;
  timestamp: number;
}

interface NDVITrendData {
  landId: string;
  coordinates: Array<{ lat: number; lng: number }>;
  currentNdvi: number;
  trend: NDVIDataPoint[];
  hasHistoricalData: boolean;
  lastUpdated: Date;
}

class NDVIService {
  private storageKey = 'ndvi_historical_data';

  // Get NDVI trend for a specific land parcel
  getNDVITrend(landId: string, coordinates: Array<{ lat: number; lng: number }>): NDVITrendData {
    const storedData = this.getStoredNDVIData();
    const landData = storedData[landId];

    // Generate current NDVI based on coordinates (simulate satellite reading)
    const currentNdvi = this.generateCurrentNDVI(coordinates);

    if (landData && landData.trend.length > 0) {
      // Has historical data - return trend
      return {
        landId,
        coordinates,
        currentNdvi,
        trend: landData.trend,
        hasHistoricalData: true,
        lastUpdated: new Date()
      };
    } else {
      // No historical data - create initial data point
      const initialDataPoint: NDVIDataPoint = {
        date: new Date().toISOString().split('T')[0],
        ndvi: currentNdvi,
        timestamp: Date.now()
      };

      // Store this as the first reading
      this.storeNDVIReading(landId, coordinates, currentNdvi);

      return {
        landId,
        coordinates,
        currentNdvi,
        trend: [initialDataPoint],
        hasHistoricalData: false,
        lastUpdated: new Date()
      };
    }
  }

  // Store a new NDVI reading for a land parcel
  storeNDVIReading(landId: string, coordinates: Array<{ lat: number; lng: number }>, ndvi: number): void {
    const storedData = this.getStoredNDVIData();
    
    if (!storedData[landId]) {
      storedData[landId] = {
        coordinates,
        trend: []
      };
    }

    // Add new data point
    const newDataPoint: NDVIDataPoint = {
      date: new Date().toISOString().split('T')[0],
      ndvi,
      timestamp: Date.now()
    };

    // Avoid duplicate entries for the same day
    const existingIndex = storedData[landId].trend.findIndex(
      (point: NDVIDataPoint) => point.date === newDataPoint.date
    );

    if (existingIndex >= 0) {
      // Update existing entry for today
      storedData[landId].trend[existingIndex] = newDataPoint;
    } else {
      // Add new entry
      storedData[landId].trend.push(newDataPoint);
    }

    // Keep only last 12 months of data
    const twelveMonthsAgo = Date.now() - (12 * 30 * 24 * 60 * 60 * 1000);
    storedData[landId].trend = storedData[landId].trend.filter(
      (point: NDVIDataPoint) => point.timestamp > twelveMonthsAgo
    );

    // Sort by date
    storedData[landId].trend.sort((a: NDVIDataPoint, b: NDVIDataPoint) => a.timestamp - b.timestamp);

    // Save to localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(storedData));
  }

  // Generate mock historical NDVI data for demonstration
  generateMockHistoricalData(landId: string, coordinates: Array<{ lat: number; lng: number }>, months: number = 6): void {
    const mockTrend: NDVIDataPoint[] = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      // Simulate seasonal NDVI variation
      const monthlyVariation = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.15;
      const baseNDVI = 0.65 + monthlyVariation;
      
      // Add some realistic noise
      const noise = (Math.random() - 0.5) * 0.1;
      const ndvi = Math.max(0.2, Math.min(0.95, baseNDVI + noise));

      mockTrend.push({
        date: date.toISOString().split('T')[0],
        ndvi: Math.round(ndvi * 100) / 100, // Round to 2 decimals
        timestamp: date.getTime()
      });
    }

    // Store this mock data
    const storedData = this.getStoredNDVIData();
    storedData[landId] = {
      coordinates,
      trend: mockTrend
    };
    localStorage.setItem(this.storageKey, JSON.stringify(storedData));
  }

  private getStoredNDVIData(): any {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading stored NDVI data:', error);
      return {};
    }
  }

  private generateCurrentNDVI(coordinates: Array<{ lat: number; lng: number }>): number {
    if (coordinates.length === 0) {
      return 0.65; // Default moderate vegetation
    }

    // Generate NDVI based on location (simulate)
    const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
    const avgLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;

    // Simple location-based NDVI simulation
    const latitudeFactor = (avgLat - 10) / 20; // Normalize around India's latitude
    const longitudeFactor = (avgLng - 75) / 20; // Normalize around India's longitude
    
    // Base NDVI with location influence
    let baseNdvi = 0.7 + (latitudeFactor * 0.1) + (longitudeFactor * 0.05);
    
    // Add seasonal variation (current month)
    const currentMonth = new Date().getMonth();
    const seasonalVariation = Math.sin((currentMonth / 12) * 2 * Math.PI) * 0.15;
    baseNdvi += seasonalVariation;

    // Add some randomness
    const randomVariation = (Math.random() - 0.5) * 0.1;
    baseNdvi += randomVariation;

    // Clamp between realistic NDVI values
    return Math.max(0.2, Math.min(0.95, Math.round(baseNdvi * 100) / 100));
  }

  // Get NDVI category description
  getNDVICategory(ndvi: number): {
    category: string;
    color: string;
    description: string;
  } {
    if (ndvi >= 0.8) {
      return {
        category: 'Excellent',
        color: 'green-600',
        description: 'Very healthy vegetation, optimal growing conditions'
      };
    } else if (ndvi >= 0.6) {
      return {
        category: 'Good',
        color: 'green-500',
        description: 'Healthy vegetation, good agricultural potential'
      };
    } else if (ndvi >= 0.4) {
      return {
        category: 'Moderate',
        color: 'yellow-500',
        description: 'Moderate vegetation, may need attention'
      };
    } else if (ndvi >= 0.2) {
      return {
        category: 'Poor',
        color: 'orange-500',
        description: 'Sparse vegetation, intervention recommended'
      };
    } else {
      return {
        category: 'Very Poor',
        color: 'red-500',
        description: 'Minimal vegetation, immediate action required'
      };
    }
  }
}

export const ndviService = new NDVIService();