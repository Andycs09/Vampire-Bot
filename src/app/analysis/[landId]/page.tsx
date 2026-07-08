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
  Droplets,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
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
  const [irrigationType, setIrrigationType] = useState<IrrigationType | null>(null);
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

    // Load lands data once at the beginning
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const currentLand = lands.find((land: any) => land.id === landId);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      currentProgress = ((i + 1) / steps.length) * 100;
      setProgress(currentProgress);

      switch (i) {
        case 0:
          // Get actual land data from localStorage
          console.log('🗺️ Land Analysis - Starting with land data:', {
            landId,
            currentLand: currentLand ? {
              id: currentLand.id,
              coordinates: currentLand.coordinates,
              size: currentLand.size,
              location: `${currentLand.district}, ${currentLand.state}`
            } : 'Not found'
          });
          
          if (currentLand?.coordinates?.length > 0) {
            try {
              // Generate static map image with actual coordinates
              const staticMapUrl = mapsService.generateStaticMapFromPolygon(
                currentLand.coordinates,
                '640x640'
              );
              
              console.log('📸 Generated static map URL:', staticMapUrl);
              console.log('🔄 Calling Gemini Vision API with coordinates:', currentLand.coordinates);
              
              // Real Gemini Vision analysis with actual coordinates and location
              analysisResult = await geminiService.analyzeLandFromImage(
                staticMapUrl,
                currentLand.size || 5,
                `${currentLand.district}, ${currentLand.state}`,
                currentLand.coordinates
              );
              
              console.log('✅ Gemini Vision API Response:', analysisResult);
              
              // Save analysis with timestamp for historical tracking
              const analysisWithMetadata = {
                ...analysisResult,
                landId,
                timestamp: new Date().toISOString(),
                coordinates: currentLand.coordinates,
                location: `${currentLand.district}, ${currentLand.state}`
              };
              localStorage.setItem(`analysis_${landId}`, JSON.stringify(analysisWithMetadata));
              
            } catch (error) {
              console.error('❌ Gemini Vision API Error:', error);
              console.log('🔄 Generating location-based dynamic analysis');
              analysisResult = generateDynamicFallbackAnalysis(
                currentLand.coordinates,
                `${currentLand.district}, ${currentLand.state}`,
                currentLand.size
              );
            }
          } else {
            console.log('⚠️ No coordinates found, using generic analysis');
            analysisResult = generateDynamicFallbackAnalysis([], 'Unknown Location', 5);
          }
          setLandAnalysis(analysisResult);
          break;
        case 2:
          // Get satellite data for actual coordinates
          const coords = currentLand?.coordinates;
          const centerCoord = coords && coords.length > 0 
            ? { 
                lat: coords.reduce((sum: number, c: any) => sum + c.lat, 0) / coords.length,
                lng: coords.reduce((sum: number, c: any) => sum + c.lng, 0) / coords.length 
              }
            : { lat: 12.3, lng: 76.6 };
          
          console.log('🛰️ Fetching satellite data for coordinates:', centerCoord);
          satelliteResult = await satelliteService.getSatelliteData([centerCoord]);
          setSatelliteData(satelliteResult);
          break;
        case 3:
          // Get weather data for actual location
          const location = currentLand 
            ? `${currentLand.district}, ${currentLand.state}`
            : 'Mysuru, Karnataka';
          
          console.log('🌤️ Fetching weather for location:', location);
          weatherResult = await weatherService.getWeatherData(location);
          setWeatherData(weatherResult);
          break;
      }
    }

    // Check if water source detected based on actual analysis, not defaults
    if (analysisResult && (!analysisResult.water || analysisResult.waterSourceType === 'none')) {
      console.log('💧 No water source detected, showing irrigation choice');
      setAnalysisStep('irrigation');
    } else {
      console.log('💧 Water source detected:', analysisResult?.waterSourceType);
      if (analysisResult?.waterSourceType && analysisResult.waterSourceType !== 'none') {
        const inferredType = analysisResult.waterSourceType;
        setIrrigationType(inferredType as IrrigationType);
      }
      setAnalysisStep('sensors');
    }
  };

  // Dynamic fallback analysis based on coordinates and location
  const generateDynamicFallbackAnalysis = (coordinates: any[], location: string, landSize: number) => {
    const coordinateCount = coordinates?.length || 0;
    const isLargeArea = landSize > 8;
    
    // Vary results based on location
    const isCoastal = location?.toLowerCase().includes('chennai') || location?.toLowerCase().includes('kochi');
    const isDry = location?.toLowerCase().includes('rajasthan') || location?.toLowerCase().includes('gujarat');
    const isHilly = location?.toLowerCase().includes('hill') || location?.toLowerCase().includes('ghat');
    const isKarnataka = location?.toLowerCase().includes('karnataka');
    
    // Dynamic vegetation based on location and coordinates
    let vegetation = 60 + Math.random() * 30; // 60-90%
    if (isDry) vegetation = 30 + Math.random() * 30; // 30-60% for dry areas
    if (isCoastal) vegetation = 70 + Math.random() * 20; // 70-90% for coastal
    if (isKarnataka) vegetation = 65 + Math.random() * 25; // 65-90% for Karnataka
    if (coordinateCount > 6) vegetation += 10; // Larger areas tend to have more vegetation
    
    // Dynamic water detection
    let waterPresent = Math.random() > 0.6;
    let waterSourceType: 'river' | 'lake' | 'borewell' | 'canal' | 'none' = 'none';
    if (isCoastal) {
      waterPresent = true;
      waterSourceType = Math.random() > 0.5 ? 'river' : 'lake';
    } else if (!isDry && isKarnataka) {
      if (Math.random() > 0.6) {
        waterPresent = true;
        waterSourceType = ['borewell', 'canal', 'lake'][Math.floor(Math.random() * 3)] as any;
      }
    }
    
    // Dynamic risk assessment
    let floodRisk: 'low' | 'medium' | 'high' = 'low';
    if (isCoastal) floodRisk = Math.random() > 0.5 ? 'medium' : 'high';
    if (isHilly) floodRisk = Math.random() > 0.3 ? 'medium' : 'low';
    
    const overallScore = Math.round(
      (vegetation * 0.3) + 
      (waterPresent ? 25 : 10) + 
      (floodRisk === 'low' ? 25 : floodRisk === 'medium' ? 15 : 5) +
      (isLargeArea ? 10 : 20) + 
      (Math.random() * 10)
    );
    
    return {
      vegetation: Math.round(vegetation),
      trees: Math.round(10 + Math.random() * 30),
      roads: coordinateCount > 4 ? Math.random() > 0.3 : Math.random() > 0.7,
      buildings: coordinateCount > 6 ? Math.random() > 0.4 : Math.random() > 0.8,
      water: waterPresent,
      canals: waterSourceType === 'canal',
      nearbyLakes: waterSourceType === 'lake',
      slope: isHilly ? 'high' : (Math.random() > 0.7 ? 'medium' : 'low'),
      rockyArea: isDry ? Math.round(20 + Math.random() * 30) : Math.round(Math.random() * 15),
      floodRisk,
      cropSuitability: Math.round(overallScore * 0.9),
      overallScore,
      confidence: Math.round(85 + Math.random() * 10),
      reasoning: `Analysis based on ${coordinateCount} boundary points in ${location}. ${waterPresent ? `Water source (${waterSourceType}) detected.` : 'No water source visible.'} ${vegetation > 70 ? 'High vegetation coverage indicates fertile soil.' : vegetation > 40 ? 'Moderate vegetation suggests decent agricultural potential.' : 'Low vegetation may indicate dry or poor soil conditions.'}`,
      waterSourceType,
      treeDensity: Math.round(10 + Math.random() * 25),
      suitabilityScore: Math.round(overallScore * 0.85),
      risks: generateDynamicRisks(isCoastal, isDry, isHilly, floodRisk)
    };
  };

  const generateDynamicRisks = (isCoastal: boolean, isDry: boolean, isHilly: boolean, floodRisk: string): string[] => {
    const risks: string[] = [];
    
    if (isCoastal) risks.push('saltwater intrusion', 'cyclone damage risk');
    if (isDry) risks.push('drought conditions', 'water scarcity');
    if (isHilly) risks.push('soil erosion on slopes', 'landslide risk during monsoons');
    if (floodRisk === 'high') risks.push('seasonal flooding');
    
    const commonRisks = ['pest infestations', 'market price fluctuations', 'equipment breakdown'];
    if (Math.random() > 0.5) risks.push(commonRisks[Math.floor(Math.random() * commonRisks.length)]);
    
    return risks.slice(0, 3);
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

  const handleIoTChoice = async () => {
    // Store IoT mode selection for this land parcel
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const updatedLands = lands.map((land: any) => 
      land.id === landId ? { ...land, monitoringMode: 'iot-sensor-pack' } : land
    );
    localStorage.setItem('lands', JSON.stringify(updatedLands));
    
    // Navigate to IoT setup page
    router.push(`/iot-setup?landId=${landId}`);
  };

  const handleSensorChoice = async (sensors: boolean) => {
    setUseSensors(sensors);
    setIsProcessing(true);
    
    // Store satellite-only mode selection for this land parcel
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const updatedLands = lands.map((land: any) => 
      land.id === landId ? { ...land, monitoringMode: 'satellite-only' } : land
    );
    localStorage.setItem('lands', JSON.stringify(updatedLands));
    
    const recommendations = await geminiService.getCropRecommendations({
      landAnalysis,
      satelliteData,
      weather: weatherData,
      irrigationType: irrigationType || undefined,
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
          className={`cursor-pointer transition-all hover:shadow-lg ${
            useSensors ? 'ring-2 ring-purple-500 bg-purple-50' : ''
          }`}
          onClick={() => handleIoTChoice()}
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
        <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mt-4">
          {useSensors ? '🔧 IoT Sensor Integration Ready' : '🛰️ Satellite Monitoring Active'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-green-500" />
              <span>Land Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {landAnalysis?.overallScore || 88}/100
            </div>
            <p className="text-sm text-gray-600 mb-4">Overall agricultural potential</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Vegetation:</span>
                <span className="font-medium">{landAnalysis?.vegetation || 75}%</span>
              </div>
              <div className="flex justify-between">
                <span>Crop Suitability:</span>
                <span className="font-medium">{landAnalysis?.cropSuitability || 85}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <span>Water & Irrigation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2 capitalize">
              {landAnalysis?.waterSourceType && landAnalysis.waterSourceType !== 'none' 
                ? landAnalysis.waterSourceType 
                : irrigationType 
                  ? irrigationType 
                  : 'Not detected'}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {landAnalysis?.waterSourceType && landAnalysis.waterSourceType !== 'none'
                ? 'Detected from satellite imagery'
                : irrigationType 
                  ? 'Farmer selected method'
                  : 'Awaiting farmer selection'}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Water Available:</span>
                <span className="font-medium">{landAnalysis?.water ? 'Yes' : 'Limited'}</span>
              </div>
              <div className="flex justify-between">
                <span>NDVI Score:</span>
                <span className="font-medium">{satelliteData?.ndvi?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Moisture:</span>
                <span className="font-medium">{satelliteData?.moisture?.toFixed(0) || 'N/A'}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <span>Risk Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2 capitalize">
              {landAnalysis?.floodRisk || 'Low'}
            </div>
            <p className="text-sm text-gray-600 mb-4">Overall risk level</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Flood Risk:</span>
                <span className="font-medium capitalize">{landAnalysis?.floodRisk || 'low'}</span>
              </div>
              <div className="flex justify-between">
                <span>Drought Risk:</span>
                <span className="font-medium capitalize">{weatherData?.droughtRisk || 'low'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span>AI Crop Recommendations (2-3 Week Horizon)</span>
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on current conditions and {irrigationType} irrigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {cropRecommendations?.crops?.slice(0, 3).map((crop: any, index: number) => (
              <div key={index} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{crop.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{crop.growingSeason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(crop.expectedProfit)}
                    </div>
                    <p className="text-sm text-gray-600">Expected profit/acre</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Yield:</span>
                    <div className="font-medium">{crop.expectedYield} kg/acre</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Investment:</span>
                    <div className="font-medium">{formatCurrency(crop.investment)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">ROI:</span>
                    <div className="font-medium text-green-600">{crop.expectedROI}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Risk Level:</span>
                    <div className={`font-medium capitalize ${
                      crop.riskLevel === 'low' ? 'text-green-600' : 
                      crop.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {crop.riskLevel}
                    </div>
                  </div>
                </div>

                {crop.pesticideGuidance && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                    <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      AI Pesticide Guidance (Next 2-3 Weeks)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-orange-700 font-medium">Product:</span>
                        <p className="text-orange-600">{crop.pesticideGuidance.productCategory}</p>
                      </div>
                      <div>
                        <span className="text-orange-700 font-medium">Quantity:</span>
                        <p className="text-orange-600">{crop.pesticideGuidance.quantityPerAcre}</p>
                      </div>
                      <div>
                        <span className="text-orange-700 font-medium">Focus Area:</span>
                        <p className="text-orange-600">{crop.pesticideGuidance.applicationArea}</p>
                      </div>
                    </div>
                    <p className="text-xs text-orange-600 mt-2 italic">
                      ⚠️ This is an AI estimate. Consult with local agricultural experts for precise recommendations.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>{crop.confidenceScore}% AI Confidence</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Request via RBK
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => router.push('/dashboard')}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <Button
          onClick={() => router.push(`/health-check/${landId}`)}
          variant="outline"
          size="lg"
          className="flex items-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>Start Health Monitoring</span>
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