'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Wifi, WifiOff, CheckCircle, Zap, Settings, Thermometer, Droplets, FlaskConical, Sun, CloudRain, Gauge, Activity, Wind } from 'lucide-react';

// Sensor definitions
const sensors = [
  { id: 'dht22', name: 'DHT22 (Temperature & Humidity)', icon: Thermometer, unit: '°C / %RH' },
  { id: 'ds18b20', name: 'DS18B20 (Soil Temperature)', icon: Thermometer, unit: '°C' },
  { id: 'soil_moisture', name: 'Capacitive Soil Moisture Sensor', icon: Droplets, unit: '%' },
  { id: 'npk', name: 'NPK Sensor', icon: FlaskConical, unit: 'ppm' },
  { id: 'soil_ph', name: 'Soil pH Sensor', icon: FlaskConical, unit: 'pH' },
  { id: 'bh1750', name: 'BH1750 Light Sensor', icon: Sun, unit: 'lux' },
  { id: 'rain', name: 'Rain Sensor', icon: CloudRain, unit: 'mm/h' },
  { id: 'water_level', name: 'Water Level Sensor', icon: Gauge, unit: 'cm' },
  { id: 'water_flow', name: 'Water Flow Sensor', icon: Activity, unit: 'L/min' },
  { id: 'mq135', name: 'MQ-135 Air Quality Sensor', icon: Wind, unit: 'ppm' },
  { id: 'co2', name: 'CO₂ Sensor (MH-Z19B)', icon: Wind, unit: 'ppm' },
];

function IoTSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const landId = searchParams.get('landId');
  const [deviceId, setDeviceId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [enabledSensors, setEnabledSensors] = useState<Set<string>>(new Set());
  const [sensorReadings, setSensorReadings] = useState<{ [key: string]: { value: string; timestamp: Date } }>({});
  const [currentLand, setCurrentLand] = useState<any>(null);

  useEffect(() => {
    // Load land data
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const land = lands.find((l: any) => l.id === landId);
    if (land) {
      setCurrentLand(land);
    }

    // Load existing IoT setup if any
    const iotSetup = localStorage.getItem(`iot_setup_${landId}`);
    if (iotSetup) {
      const setup = JSON.parse(iotSetup);
      setDeviceId(setup.deviceId || '');
      setIsConnected(setup.isConnected || false);
      setEnabledSensors(new Set(setup.enabledSensors || []));
      setSensorReadings(setup.sensorReadings || {});
    }
  }, [landId]);

  const handleConnect = () => {
    if (!deviceId.trim()) return;
    
    setIsConnected(true);
    saveIoTSetup();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    saveIoTSetup();
  };

  const toggleSensor = (sensorId: string) => {
    const newEnabledSensors = new Set(enabledSensors);
    if (newEnabledSensors.has(sensorId)) {
      newEnabledSensors.delete(sensorId);
    } else {
      newEnabledSensors.add(sensorId);
    }
    setEnabledSensors(newEnabledSensors);
    saveIoTSetup();
  };

  const generateTestReading = (sensorId: string) => {
    const readings: { [key: string]: string } = {
      'dht22': `${(15 + Math.random() * 25).toFixed(1)}°C / ${(40 + Math.random() * 40).toFixed(0)}%RH`,
      'ds18b20': `${(18 + Math.random() * 22).toFixed(1)}°C`,
      'soil_moisture': `${(20 + Math.random() * 40).toFixed(0)}%`,
      'npk': `N:${(50 + Math.random() * 100).toFixed(0)} P:${(30 + Math.random() * 70).toFixed(0)} K:${(40 + Math.random() * 80).toFixed(0)}ppm`,
      'soil_ph': `${(5.5 + Math.random() * 2).toFixed(1)}`,
      'bh1750': `${(1000 + Math.random() * 9000).toFixed(0)} lux`,
      'rain': `${(Math.random() * 5).toFixed(1)} mm/h`,
      'water_level': `${(10 + Math.random() * 40).toFixed(0)} cm`,
      'water_flow': `${(0.5 + Math.random() * 3).toFixed(1)} L/min`,
      'mq135': `${(50 + Math.random() * 100).toFixed(0)} ppm`,
      'co2': `${(350 + Math.random() * 100).toFixed(0)} ppm`,
    };

    const newReadings = {
      ...sensorReadings,
      [sensorId]: {
        value: readings[sensorId],
        timestamp: new Date()
      }
    };
    
    setSensorReadings(newReadings);
    saveIoTSetup();
  };

  const saveIoTSetup = () => {
    const setup = {
      deviceId,
      isConnected,
      enabledSensors: Array.from(enabledSensors),
      sensorReadings,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`iot_setup_${landId}`, JSON.stringify(setup));
  };

  if (!currentLand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IoT Sensor Setup</h1>
            <p className="text-gray-600">
              Configure sensors for {currentLand.district}, {currentLand.state} ({currentLand.size || 5} acres)
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Raspberry Pi Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span>Connect Your Raspberry Pi</span>
              </CardTitle>
              <CardDescription>
                Enter your Raspberry Pi's IP address or device ID on the local network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <Input
                    placeholder="e.g., 192.168.1.100 or raspberry-pi-001"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    disabled={isConnected}
                    className="flex-1"
                  />
                  {!isConnected ? (
                    <Button
                      onClick={handleConnect}
                      disabled={!deviceId.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDisconnect}
                      variant="destructive"
                    >
                      <WifiOff className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  )}
                </div>
                
                {isConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-green-600"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Connected to device: {deviceId}</span>
                  </motion.div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Physical Setup Requirements</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Raspberry Pi 4 with GPIO/ADC connections</p>
                    <p>• Sensors wired to appropriate GPIO pins</p>
                    <p>• Pi running sensor data collection script</p>
                    <p>• Network connection to post readings to app's API</p>
                    <p className="text-xs text-blue-600 mt-2 italic">
                      Note: For demo purposes, any non-empty device ID is accepted as valid.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sensor Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                <span>Configure Sensors ({enabledSensors.size} of {sensors.length} enabled)</span>
              </CardTitle>
              <CardDescription>
                Enable sensors and generate test readings for demo purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensors.map((sensor) => {
                  const isEnabled = enabledSensors.has(sensor.id);
                  const reading = sensorReadings[sensor.id];
                  const IconComponent = sensor.icon;

                  return (
                    <div
                      key={sensor.id}
                      className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                        isEnabled
                          ? 'border-purple-200 bg-purple-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isEnabled ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            isEnabled ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm leading-tight">
                            {sensor.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">{sensor.unit}</p>
                          
                          {reading && (
                            <div className="mt-2 p-2 bg-white rounded border text-xs">
                              <p className="font-mono text-green-600">{reading.value}</p>
                              <p className="text-gray-400">
                                {reading.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          variant={isEnabled ? "default" : "outline"}
                          onClick={() => toggleSensor(sensor.id)}
                          className="flex-1 text-xs"
                        >
                          {isEnabled ? 'Enabled' : 'Enable'}
                        </Button>
                        
                        {isEnabled && isConnected && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateTestReading(sensor.id)}
                            className="flex-1 text-xs"
                          >
                            Test Reading
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Complete Setup */}
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              disabled={!isConnected || enabledSensors.size === 0}
            >
              Complete IoT Setup
              <CheckCircle className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IoTSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <IoTSetupContent />
    </Suspense>
  );
}