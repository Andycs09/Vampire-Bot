/**
 * Service to manage monitoring modes for land parcels
 */

export type MonitoringMode = 'satellite-only' | 'iot-sensor-pack';

class MonitoringModeService {
  /**
   * Get monitoring mode for a specific land parcel
   */
  getMonitoringMode(landId: string): MonitoringMode {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const land = lands.find((l: any) => l.id === landId);
    
    if (land && land.monitoringMode) {
      return land.monitoringMode as MonitoringMode;
    }

    // Check if IoT setup exists (backward compatibility)
    const iotSetup = localStorage.getItem(`iot_setup_${landId}`);
    if (iotSetup) {
      const setup = JSON.parse(iotSetup);
      if (setup.enabledSensors && setup.enabledSensors.length > 0) {
        // Update land record to reflect IoT mode
        this.setMonitoringMode(landId, 'iot-sensor-pack');
        return 'iot-sensor-pack';
      }
    }

    // Default to satellite-only
    return 'satellite-only';
  }

  /**
   * Set monitoring mode for a specific land parcel
   */
  setMonitoringMode(landId: string, mode: MonitoringMode): void {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const updatedLands = lands.map((land: any) => 
      land.id === landId ? { ...land, monitoringMode: mode } : land
    );
    localStorage.setItem('lands', JSON.stringify(updatedLands));
  }

  /**
   * Check if a land parcel is using IoT sensors
   */
  isIoTMode(landId: string): boolean {
    return this.getMonitoringMode(landId) === 'iot-sensor-pack';
  }

  /**
   * Check if a land parcel is using satellite-only mode
   */
  isSatelliteOnlyMode(landId: string): boolean {
    return this.getMonitoringMode(landId) === 'satellite-only';
  }

  /**
   * Get all lands by monitoring mode
   */
  getLandsByMode(mode: MonitoringMode): any[] {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    return lands.filter((land: any) => this.getMonitoringMode(land.id) === mode);
  }

  /**
   * Get monitoring mode statistics
   */
  getMonitoringStats(): {
    total: number;
    satelliteOnly: number;
    iotSensorPack: number;
  } {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const stats = {
      total: lands.length,
      satelliteOnly: 0,
      iotSensorPack: 0
    };

    lands.forEach((land: any) => {
      const mode = this.getMonitoringMode(land.id);
      if (mode === 'satellite-only') {
        stats.satelliteOnly++;
      } else if (mode === 'iot-sensor-pack') {
        stats.iotSensorPack++;
      }
    });

    return stats;
  }

  /**
   * Check if IoT features should be visible for a land parcel
   */
  shouldShowIoTFeatures(landId: string): boolean {
    return this.isIoTMode(landId);
  }

  /**
   * Check if there are any IoT-enabled lands
   */
  hasIoTLands(): boolean {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    return lands.some((land: any) => this.isIoTMode(land.id));
  }
}

export const monitoringModeService = new MonitoringModeService();