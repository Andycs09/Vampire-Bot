import { WeatherData } from '@/types';

class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || '';
  }

  async getWeatherData(location: string): Promise<WeatherData> {
    try {
      // Extract city name from location string (e.g., "Mysuru, Karnataka" -> "Mysuru")
      const cityName = location.split(',')[0].trim();
      
      // Fetch current weather
      const weatherResponse = await fetch(
        `${this.baseUrl}/weather?q=${cityName},IN&appid=${this.apiKey}&units=metric`
      );
      
      if (!weatherResponse.ok) {
        console.warn('Weather API failed, using mock data');
        return this.mockWeatherData(location);
      }
      
      const weatherData = await weatherResponse.json();
      
      // Fetch forecast
      const forecastResponse = await fetch(
        `${this.baseUrl}/forecast?q=${cityName},IN&appid=${this.apiKey}&units=metric`
      );
      
      const forecastData = forecastResponse.ok 
        ? await forecastResponse.json()
        : null;

      // Process forecast data (get one per day)
      const forecast = forecastData 
        ? this.processForecast(forecastData.list)
        : this.mockForecast();

      const temperature = {
        min: weatherData.main.temp_min,
        max: weatherData.main.temp_max
      };

      const heatStress = this.calculateHeatStress(temperature.max, weatherData.main.humidity);
      const droughtRisk = this.calculateDroughtRisk(0, temperature.max); // Rainfall from forecast

      return {
        location,
        temperature,
        humidity: weatherData.main.humidity,
        rainfall: weatherData.rain?.['1h'] || 0,
        wind: weatherData.wind.speed,
        heatStress,
        droughtRisk,
        forecast,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return this.mockWeatherData(location);
    }
  }

  private processForecast(forecastList: any[]): WeatherData['forecast'] {
    // Group by date and get one forecast per day
    const dailyForecasts: { [key: string]: any } = {};
    
    forecastList.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = item;
      }
    });

    return Object.values(dailyForecasts).slice(0, 7).map((item: any) => ({
      date: item.dt_txt.split(' ')[0],
      temperature: {
        min: item.main.temp_min,
        max: item.main.temp_max
      },
      rainfall: item.rain?.['3h'] || 0,
      conditions: item.weather[0].main.toLowerCase()
    }));
  }

  private mockForecast(): WeatherData['forecast'] {
    const currentDate = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + index + 1);
      
      return {
        date: date.toISOString().split('T')[0],
        temperature: {
          min: 22 + Math.random() * 5,
          max: 32 + Math.random() * 8
        },
        rainfall: Math.random() * 20,
        conditions: ['sunny', 'partly_cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)]
      };
    });
  }

  private mockWeatherData(location: string): WeatherData {
    const currentDate = new Date();
    const forecast = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + index + 1);
      
      return {
        date: date.toISOString().split('T')[0],
        temperature: {
          min: 22 + Math.random() * 5,
          max: 32 + Math.random() * 8
        },
        rainfall: Math.random() * 20,
        conditions: ['sunny', 'partly_cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)]
      };
    });

    return {
      location,
      temperature: {
        min: 24,
        max: 35
      },
      humidity: 65,
      rainfall: 12.5,
      wind: 8.2,
      heatStress: 'medium',
      droughtRisk: 'low',
      forecast,
      lastUpdated: new Date()
    };
  }

  async getWeatherAlerts(location: string): Promise<Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    validUntil: Date;
  }>> {
    // Mock weather alerts
    return [
      {
        type: 'rainfall',
        severity: 'medium',
        message: 'Heavy rainfall expected in the next 48 hours. Ensure proper drainage.',
        validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  calculateHeatStress(temperature: number, humidity: number): 'low' | 'medium' | 'high' {
    const heatIndex = temperature + (0.5 * humidity);
    
    if (heatIndex > 45) return 'high';
    if (heatIndex > 35) return 'medium';
    return 'low';
  }

  calculateDroughtRisk(rainfall: number, temperature: number): 'low' | 'medium' | 'high' {
    const droughtIndex = (temperature / 10) - (rainfall / 5);
    
    if (droughtIndex > 4) return 'high';
    if (droughtIndex > 2) return 'medium';
    return 'low';
  }
}

export const weatherService = new WeatherService();