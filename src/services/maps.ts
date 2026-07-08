interface MapCoordinate {
  lat: number;
  lng: number;
}

interface StaticMapOptions {
  center: MapCoordinate;
  zoom: number;
  size: string;
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  polygonPath?: MapCoordinate[];
}

class MapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY || '';
  }

  // Generate static map image from drawn polygon
  generateStaticMapFromPolygon(
    coordinates: MapCoordinate[],
    size: string = '640x640'
  ): string {
    if (!coordinates.length) {
      throw new Error('No coordinates provided');
    }

    // Calculate center point from polygon bounds
    const center = this.calculatePolygonCenter(coordinates);
    
    // Generate path string for polygon
    const pathString = coordinates.map(coord => `${coord.lat},${coord.lng}`).join('|');
    
    // Create static maps URL with polygon overlay
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${center.lat},${center.lng}`,
      zoom: '16',
      size: size,
      maptype: 'satellite',
      path: `color:0xff0000ff|weight:2|fillcolor:0xff000033|${pathString}`,
      key: this.apiKey
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Convert canvas to base64 for analysis
  async captureMapCanvas(canvasElement: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve) => {
      canvasElement.toBlob((blob) => {
        if (!blob) {
          resolve('');
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.9);
    });
  }

  // Calculate center point of polygon
  private calculatePolygonCenter(coordinates: MapCoordinate[]): MapCoordinate {
    if (coordinates.length === 0) {
      return { lat: 0, lng: 0 };
    }

    let latSum = 0;
    let lngSum = 0;

    coordinates.forEach(coord => {
      latSum += coord.lat;
      lngSum += coord.lng;
    });

    return {
      lat: latSum / coordinates.length,
      lng: lngSum / coordinates.length
    };
  }

  // Calculate polygon area in acres (approximate)
  calculatePolygonArea(coordinates: MapCoordinate[]): number {
    if (coordinates.length < 3) {
      return 0;
    }

    // Using shoelace formula for polygon area
    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }

    area = Math.abs(area) / 2;

    // Convert from square degrees to square meters (rough approximation)
    // 1 degree ≈ 111,320 meters at equator
    const areaInSquareMeters = area * 111320 * 111320;

    // Convert to acres (1 acre = 4047 square meters)
    return areaInSquareMeters / 4047;
  }

  // Generate bounds for polygon
  getPolygonBounds(coordinates: MapCoordinate[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    if (coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = coordinates[0].lat;
    let south = coordinates[0].lat;
    let east = coordinates[0].lng;
    let west = coordinates[0].lng;

    coordinates.forEach(coord => {
      north = Math.max(north, coord.lat);
      south = Math.min(south, coord.lat);
      east = Math.max(east, coord.lng);
      west = Math.min(west, coord.lng);
    });

    return { north, south, east, west };
  }

  // Create optimized zoom level for polygon
  getOptimalZoom(coordinates: MapCoordinate[]): number {
    const bounds = this.getPolygonBounds(coordinates);
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);

    // Zoom levels roughly based on coordinate span
    if (maxDiff > 0.1) return 10;
    if (maxDiff > 0.05) return 12;
    if (maxDiff > 0.01) return 14;
    if (maxDiff > 0.005) return 16;
    return 18;
  }
}

export const mapsService = new MapsService();