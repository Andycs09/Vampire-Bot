interface LocationData {
  lat: number;
  lng: number;
  state?: string;
  district?: string;
  village?: string;
}

class GeolocationService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY || '';
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null); // Return null instead of rejecting for better UX
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<LocationData> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=en`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.warn('No geocoding results found, using fallback location');
        // Return a fallback location for India
        return {
          lat,
          lng,
          state: 'Karnataka',
          district: 'Bengaluru Urban',
          village: 'Bengaluru'
        };
      }

      // Extract location components
      const result = data.results[0];
      const components = result.address_components || [];

      let state = '';
      let district = '';
      let village = '';

      components.forEach((component: any) => {
        const types = component.types || [];

        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('administrative_area_level_2')) {
          district = component.long_name;
        } else if (
          types.includes('locality') || 
          types.includes('administrative_area_level_3') ||
          types.includes('sublocality')
        ) {
          village = component.long_name;
        }
      });

      return {
        lat,
        lng,
        state: state || 'Karnataka',
        district: district || 'Bengaluru Urban', 
        village: village || 'Bengaluru'
      };

    } catch (error) {
      console.warn('Reverse geocoding error, using fallback:', error);
      // Return fallback coordinates with default Indian location
      return { 
        lat, 
        lng, 
        state: 'Karnataka', 
        district: 'Bengaluru Urban', 
        village: 'Bengaluru'
      };
    }
  }

  async getLocationWithAddress(): Promise<LocationData | null> {
    try {
      const coords = await this.getCurrentLocation();
      if (!coords) {
        // Return fallback location if geolocation fails
        return {
          lat: 12.9716,
          lng: 77.5946,
          state: 'Karnataka',
          district: 'Bengaluru Urban',
          village: 'Bengaluru'
        };
      }

      const location = await this.reverseGeocode(coords.lat, coords.lng);
      return location;
    } catch (error) {
      console.warn('Error getting location with address, using fallback:', error);
      return {
        lat: 12.9716,
        lng: 77.5946,
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        village: 'Bengaluru'
      };
    }
  }

  // State-wise land size hints (typical farm sizes in different states)
  getTypicalLandSize(state: string): string {
    const landSizeHints: Record<string, string> = {
      'Punjab': 'Typical land size: 3-5 acres',
      'Haryana': 'Typical land size: 2-4 acres',
      'Uttar Pradesh': 'Typical land size: 1-3 acres',
      'Bihar': 'Typical land size: 1-2 acres',
      'Maharashtra': 'Typical land size: 2-4 acres',
      'Karnataka': 'Typical land size: 2-5 acres',
      'Andhra Pradesh': 'Typical land size: 2-4 acres',
      'Telangana': 'Typical land size: 2-4 acres',
      'Tamil Nadu': 'Typical land size: 1-3 acres',
      'Gujarat': 'Typical land size: 3-6 acres',
      'Rajasthan': 'Typical land size: 4-8 acres',
      'Madhya Pradesh': 'Typical land size: 3-6 acres',
      'Chhattisgarh': 'Typical land size: 2-4 acres',
      'Jharkhand': 'Typical land size: 1-3 acres',
      'Odisha': 'Typical land size: 1-3 acres',
      'West Bengal': 'Typical land size: 1-2 acres',
      'Assam': 'Typical land size: 1-2 acres',
      'Kerala': 'Typical land size: 0.5-2 acres',
      'Himachal Pradesh': 'Typical land size: 1-3 acres'
    };

    return landSizeHints[state] || 'Typical land size varies by region';
  }
}

export const geolocationService = new GeolocationService();