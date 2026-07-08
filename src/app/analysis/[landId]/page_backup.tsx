'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Leaf, 
  Brain, 
  Satellite, 
  TrendingUp, 
  MapPin, 
  Droplets,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Zap,
  Camera
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { geminiService } from '@/services/gemini';
import { satelliteService } from '@/services/satellite';
import { weatherService } from '@/services/weather';
import { mapsService } from '@/services/maps';
import { formatCurrency } from '@/lib/utils';

type AnalysisStep = 'analyzing' | 'irrigation' | 'sensors' | 'complete';
type IrrigationType = 'borewell' | 'canal' | 'rain-fed' | 'other';

export default function AnalysisPage() {
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('analyzing');
  const [landAnalysis, setLandAnalysis] = useState<any>(null);
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [cropRecommendations, setCropRecommendations] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('borewell');
  const [useSensors, setUseSensors] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const params = useParams();
  const landId = params.landId as string;

  useEffect(() => {
    performAnalysis();
  }, []);

  const performAnalysis = async () => {
    const steps = [
      { name: 'Capturing land imagery...', duration: 2000 },
      { name: 'Analyzing with Gemini Vision AI...', duration: 2500 },
      { name: 'Processing soil conditions...', duration: 1500 },
      { name: 'Evaluating water resources...', duration: 1800 },
      { name: 'Fetching weather data...', duration: 1200 },
    ];

    let currentProgress = 0;
    let analysisResult: any = null;
    let satelliteResult: any = null;
    let weatherResult: any = null;

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      currentProgress = ((i + 1) / steps.length) * 100;
      setProgress(currentProgress);

      switch (i) {
        case 0:
          const lands = JSON.parse(localStorage.getItem('lands') || '[]');
          const currentLand = lands.find((land: any) => land.id === landId);
          
          if (currentLand?.coordinates?.length > 0) {
            const staticMapUrl = mapsService.generateStaticMapFromPolygon(
              currentLand.coordinates,
              '640x640'
            );
            
            analysisResult = await geminiService.analyzeLandFromImage(
              staticMapUrl,
              currentLand.size || 5,
              `${currentLand.state}, ${currentLand.district}`
            );
          } else {
            analysisResult = await geminiService.analyzeLandFromImage(
              'mock_static_map', 5, 'Karnataka, Mysuru'
            );
          }
          setLandAnalysis(analysisResult);
          break;
        case 2:
          satelliteResult = await satelliteService.getSatelliteData([{ lat: 12.3, lng: 76.6 }]);
          setSatelliteData(satelliteResult);
          break;
        case 3:
          weatherResult = await weatherService.getWeatherData('Mysuru, Karnataka');
          setWeatherData(weatherResult);
          break;
      }
    }

    if (!analysisResult?.water && analysisResult?.waterSourceType === 'none') {
      setAnalysisStep('irrigation');
    } else {
      setAnalysisStep('sensors');
    }
  };

  const handleIrrigationChoice = async (type: IrrigationType) => {
    setIrrigationType(type);
    setIsProcessing(true);
    
    const updatedAnalysis = { ...landAnalysis, irrigationType: type };
    setLandAnalysis(updatedAnalysis);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
    setAnalysisStep('sensors');
  };

  const handleSensorChoice = async (sensors: boolean) => {
    setUseSensors(sensors);
    setIsProcessing(true);
    
    const recommendations = await geminiService.getCropRecommendations({
      landAnalysis,
      satelliteData,
      weather: weatherData,
      irrigationType,
    });
    setCropRecommendations(recommendations);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setAnalysisStep('complete');
  };

  const AnalysisProgress = () => (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-24 h-24 mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center"
      >
        <Brain className="w-12 h-12 text-white animate-pulse" />
      </motion.div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Analysis in Progress</h1>
        <p className="text-gray-600">Our AI is analyzing your land using satellite data and weather patterns</p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Analyzing...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );

  const IrrigationChoice = () => (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mb-6">
          <Droplets className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Water Source Not Detected</h1>
        <p className="text-gray-600 mb-8">Please tell us how you currently irrigate your land</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {[
          { type: 'borewell' as IrrigationType, label: 'Borewell', icon: '🕳️', description: 'Underground water extraction' },
          { type: 'canal' as IrrigationType, label: 'Canal', icon: '🌊', description: 'Irrigation canal system' },
          { type: 'rain-fed' as IrrigationType, label: 'Rain-fed', icon: '🌧️', description: 'Depends on rainfall only' },
          { type: 'other' as IrrigationType, label: 'Other', icon: '💧', description: 'River, pond, or other source' }
        ].map((option) => (
          <Card 
            key={option.type}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              irrigationType === option.type ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleIrrigationChoice(option.type)}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">{option.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{option.label}</h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center space-x-3 mt-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Processing irrigation information...</span>
        </div>
      )}
    </div>
  );

  const SensorChoice = () => (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mb-6">
          <Settings className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Monitoring Method</h1>
        <p className="text-gray-600 mb-8">Select how you'd like to monitor your crop health</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            !useSensors ? 'ring-2 ring-green-500 bg-green-50' : ''
          }`}
          onClick={() => handleSensorChoice(false)}
        >
          <CardHeader>
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Satellite className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-center">Satellite + Weather Only</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Use satellite data and weather monitoring for crop recommendations</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Real-time satellite imaging</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Weather pattern analysis</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No additional hardware needed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg relative ${
            useSensors ? 'ring-2 ring-purple-500 bg-purple-50' : ''
          }`}
          onClick={() => handleSensorChoice(true)}
        >
          <CardHeader>
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-center">IoT Sensor Pack</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Advanced monitoring with on-ground IoT sensors</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4 text-purple-500" />
                <span>Soil moisture sensors</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4 text-purple-500" />
                <span>Temperature monitoring</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4 text-purple-500" />
                <span>pH level detection</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
              Coming Soon
            </div>
          </CardContent>
        </Card>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center space-x-3 mt-8">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Generating personalized recommendations...</span>
        </div>
      )}
    </div>
  );

  const AnalysisResults = () => (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center space-x-3 mb-4"
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900">Analysis Complete!</h1>
        </motion.div>
        <p className="text-gray-600">Here's what our AI discovered about your land</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Crop Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cropRecommendations?.crops?.slice(0, 3).map((crop: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold">{crop.name}</h3>
                <p className="text-green-600 font-bold">{formatCurrency(crop.expectedProfit)}/acre</p>
                <p className="text-sm text-gray-600">{crop.reasoning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => router.push('/dashboard')}
          className="bg-gradient-to-r from-green-600 to-blue-600"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <Button
          onClick={() => router.push(`/health-check/${landId}`)}
          variant="outline"
        >
          <Camera className="w-5 h-5 mr-2" />
          Health Monitoring
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {analysisStep === 'analyzing' && <AnalysisProgress />}
        {analysisStep === 'irrigation' && <IrrigationChoice />}
        {analysisStep === 'sensors' && <SensorChoice />}
        {analysisStep === 'complete' && <AnalysisResults />}
      </div>
    </div>
  );
}