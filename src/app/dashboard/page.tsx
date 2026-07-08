'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { 
  Leaf, 
  TrendingUp, 
  Droplets, 
  Camera, 
  Mic,
  Bell,
  Sun,
  Cloud,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Calendar,
  MessageSquare,
  Plus,
  Settings,
  LogOut,
  Info,
  Zap,
  Grid3x3,
  Users
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { landMonitoringService, type CropHealthAnalysis } from '@/services/landMonitoring';
import { geminiService } from '@/services/gemini';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { voiceAssistantService } from '@/services/voiceAssistant';
import { voiceActionExecutor } from '@/services/voiceActionExecutor';

// Import sensor definitions for IoT readings display
import { Thermometer, FlaskConical, CloudRain, Gauge, Activity, Wind } from 'lucide-react';

// Sensor definitions for IoT readings
const sensors = [
  { id: 'dht22', name: 'DHT22 (Temperature & Humidity)', icon: Thermometer },
  { id: 'ds18b20', name: 'DS18B20 (Soil Temperature)', icon: Thermometer },
  { id: 'soil_moisture', name: 'Capacitive Soil Moisture Sensor', icon: Droplets },
  { id: 'npk', name: 'NPK Sensor', icon: FlaskConical },
  { id: 'soil_ph', name: 'Soil pH Sensor', icon: FlaskConical },
  { id: 'bh1750', name: 'BH1750 Light Sensor', icon: Sun },
  { id: 'rain', name: 'Rain Sensor', icon: CloudRain },
  { id: 'water_level', name: 'Water Level Sensor', icon: Gauge },
  { id: 'water_flow', name: 'Water Flow Sensor', icon: Activity },
  { id: 'mq135', name: 'MQ-135 Air Quality Sensor', icon: Wind },
  { id: 'co2', name: 'CO₂ Sensor (MH-Z19B)', icon: Wind },
];

const mockTenants = [
  {
    id: 'tenant_001',
    name: 'Ravi Sharma',
    experience: 6,
    location: 'Mandya, Karnataka',
    hourlyRate: 220,
    specialty: 'Rice cultivation, irrigation management',
    rating: 4.8,
    availability: true,
  },
  {
    id: 'tenant_002',
    name: 'Sangeeta Reddy',
    experience: 4,
    location: 'Kurnool, Andhra Pradesh',
    hourlyRate: 180,
    specialty: 'Organic vegetable farming, pest control',
    rating: 4.6,
    availability: true,
  },
  {
    id: 'tenant_003',
    name: 'Anil Patel',
    experience: 8,
    location: 'Ahmedabad, Gujarat',
    hourlyRate: 240,
    specialty: 'Soil health, fertigation planning',
    rating: 4.9,
    availability: false,
  },
  {
    id: 'tenant_004',
    name: 'Meena Devi',
    experience: 5,
    location: 'Nagpur, Maharashtra',
    hourlyRate: 210,
    specialty: 'Cotton and vegetable crop care',
    rating: 4.7,
    availability: true,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { t, currentLang, changeLanguage } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [lands, setLands] = useState<any[]>([]);
  const [ndviData, setNdviData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'weather', message: 'Rain expected in 2 days - prepare drainage', time: '2 hours ago', unread: true },
    { id: 2, type: 'health', message: 'Photo reminder: Check crop health', time: '1 day ago', unread: true },
    { id: 3, type: 'market', message: 'Rice prices increased by 8%', time: '2 days ago', unread: false }
  ]);

  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [cropHealthScore, setCropHealthScore] = useState(94);
  const [productivityScore, setProductivityScore] = useState(92);
  const [waterEfficiency, setWaterEfficiency] = useState(88);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [cropTimeline, setCropTimeline] = useState<any[]>([]);
  const [plantingDate, setPlantingDate] = useState('2026-06-06');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantMessage, setTenantMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
    
    // Initialize voice assistant
    setVoiceSupported(voiceAssistantService.isSpeechSupported());
    voiceActionExecutor.setRouter(router);
  }, [router]);

  const loadDashboardData = async () => {
    // Load user data
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load tenant profiles from registered users or fallback to sample tenants
    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const registeredTenants = registeredUsers
      .filter((item: any) => item.userType === 'tenant')
      .map((tenant: any) => ({
        id: tenant.id || `tenant_${Date.now()}`,
        name: tenant.name || 'Tenant Farmer',
        experience: tenant.experience || 3,
        location: `${tenant.village || 'Village'}, ${tenant.district || 'District'}`,
        hourlyRate: tenant.hourlyRate || 200,
        specialty: tenant.cropSpecialization || tenant.specialty || 'General farming',
        rating: tenant.rating || 4.5,
        availability: tenant.availability !== false,
      }));
    setTenants(registeredTenants.length > 0 ? registeredTenants : mockTenants);

    // Load lands with actual coordinates and analysis data
    const storedLands = localStorage.getItem('lands');
    if (storedLands) {
      const parsedLands = JSON.parse(storedLands);
      setLands(parsedLands);
      
      if (parsedLands.length > 0) {
        const firstLand = parsedLands[0];
        
        // Calculate real scores using weighted formulas
        const avgNDVI = landMonitoringService.getAverageNDVI(firstLand.id) || 75;
        const weatherScore = landMonitoringService.getWeatherScore();
        const soilQuality = landMonitoringService.getSoilQuality(
          firstLand.state || 'Karnataka',
          firstLand.district || 'Mysuru'
        );

        // Mock Gemini analysis result for health calculation
        const mockGeminiHealth: CropHealthAnalysis = {
          cropHealth: Math.round(80 + Math.random() * 15),
          confidence: 90,
          disease: 'None detected',
          growthStage: 'Vegetative',
          waterStress: 'Low' as const,
          nitrogenDeficiency: 'None' as const,
          weedCoverage: '5%',
          leafColor: 'Healthy green',
          pestAttack: 'None visible',
          plantDensity: 'Good',
          lodging: 'None',
          dryPatches: 'None'
        };

        // Calculate weighted scores
        const healthScore = landMonitoringService.calculateCropHealthScore(
          mockGeminiHealth,
          weatherScore,
          avgNDVI,
          firstLand.id
        );

        const productivity = landMonitoringService.calculateProductivityScore(
          85, // historical yield score
          weatherScore,
          avgNDVI,
          soilQuality,
          70 // water availability
        );

        const waterEff = landMonitoringService.calculateWaterEfficiency(
          65, // rainfall score
          avgNDVI, // moisture proxy
          'rice',
          firstLand.irrigationType || 'borewell'
        );

        setCropHealthScore(healthScore.finalScore);
        setProductivityScore(productivity.finalScore);
        setWaterEfficiency(waterEff.finalScore);

        // Generate grounded AI recommendations with actual land data
        try {
          // Get land records for recent photos
          const landRecords = landMonitoringService.getLandRecords(firstLand.id);
          
          const recommendations = await geminiService.generateAIRecommendations({
            cropHealth: healthScore.finalScore,
            weatherData: { temperature: { max: 35 }, humidity: 65, rainfall: 10 },
            growthStage: 'Vegetative',
            landNutrition: {
              soilType: firstLand.soilType || 'clay-loam',
              vegetation: firstLand.analysis?.vegetation || 65,
              moisture: firstLand.analysis?.moisture || 70,
              location: `${firstLand.district}, ${firstLand.state}`,
              size: firstLand.size,
              waterSource: firstLand.irrigationType,
              productivity: productivity.finalScore,
              waterEfficiency: waterEff.finalScore
            },
            marketRates: {}
          });
          setAiRecommendations(recommendations);
        } catch (error) {
          console.error('Failed to load AI recommendations:', error);
        }

        // Generate crop timeline from accepted recommendation or default
        try {
          // Check if farmer accepted a crop recommendation
          const acceptedCropData = localStorage.getItem('current_crop_timeline');
          let cropName = 'Rice';
          let cropPlantingDate = plantingDate;
          
          if (acceptedCropData) {
            const acceptedCrop = JSON.parse(acceptedCropData);
            cropName = acceptedCrop.crop;
            cropPlantingDate = acceptedCrop.plantingDate;
            console.log('📅 Using accepted crop for timeline:', acceptedCrop);
          }
          
          const timeline = await geminiService.generateCropTimeline(
            cropPlantingDate,
            cropName,
            { forecast: 'Partly cloudy, rain in 2 days' }
          );
          setCropTimeline(timeline);
        } catch (error) {
          console.error('Failed to load crop timeline:', error);
        }
      }
      
      // Generate real NDVI data based on actual analysis
      const realNDVIData = generateRealNDVIData(parsedLands, {});
      setNdviData(realNDVIData);
    } else {
      setNdviData([]);
    }
  };

  // Mock data for charts
  const profitData = [
    { month: 'Jan', profit: 25000, expenses: 15000 },
    { month: 'Feb', profit: 32000, expenses: 18000 },
    { month: 'Mar', profit: 28000, expenses: 16000 },
    { month: 'Apr', profit: 45000, expenses: 25000 },
    { month: 'May', profit: 52000, expenses: 28000 },
    { month: 'Jun', profit: 38000, expenses: 22000 }
  ];

  const generateRealNDVIData = (lands: any[], analysisData: { [key: string]: any }) => {
    if (lands.length === 0) return [];

    // If we have analysis data, use real NDVI values
    if (Object.keys(analysisData).length > 0) {
      const ndviPoints: any[] = [];

      // For each land with analysis, add its NDVI point
      lands.forEach(land => {
        const analysis = analysisData[land.id];
        if (analysis && analysis.vegetation !== undefined) {
          // Calculate NDVI from vegetation percentage (rough approximation)
          const ndvi = (analysis.vegetation / 100) * 0.8 + 0.2; // Scale to 0.2-1.0 range

          ndviPoints.push({
            date: analysis.timestamp ? new Date(analysis.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
            ndvi: parseFloat(ndvi.toFixed(2)),
            landName: `${land.district || 'Land'} - ${land.size || 5}ac`,
            landId: land.id
          });
        }
      });

      // If we have multiple points, sort by date
      if (ndviPoints.length > 0) {
        console.log('📈 Generated real NDVI data from analysis:', ndviPoints);
        return ndviPoints;
      }
    }

    // Fallback: show single current point if no analysis data yet
    return [
      {
        date: 'Current',
        ndvi: 0.75,
        landName: 'Awaiting analysis',
        landId: null
      }
    ];
  };

  if (!mounted) {
    return null;
  }

  const handleVoiceAssistant = async () => {
    if (!voiceSupported) {
      alert(t.voiceNotSupported);
      return;
    }

    if (voiceListening) {
      voiceAssistantService.stopListening();
      setVoiceListening(false);
      return;
    }

    setVoiceListening(true);

    try {
      await voiceAssistantService.startListening(
        async (transcript: string) => {
          console.log('🎤 Voice transcript:', transcript);
          setVoiceListening(false);

          try {
            // Process the command with Cohere/Gemini
            const action = await voiceAssistantService.processVoiceCommand(transcript);
            console.log('🎯 Voice action:', action);

            // Execute the action
            const result = await voiceActionExecutor.executeVoiceAction(action);
            console.log('✅ Action result:', result);

            // Speak the response
            const spokenResponse = result.spokenResponse || action.spoken_response;
            if (spokenResponse) {
              await voiceAssistantService.speak(spokenResponse);
            }

            // Show visual feedback
            if (result.success && result.message) {
              // Show toast or alert with success message
              setTimeout(() => {
                alert(`🎤 ${result.message}`);
              }, 100);
            }

          } catch (error) {
            console.error('Voice command processing failed:', error);
            await voiceAssistantService.speak(t.somethingWentWrong);
          }
        },
        async (error: string) => {
          console.error('Voice recognition error:', error);
          setVoiceListening(false);
          if (error === 'no-speech') {
            return;
          }
          await voiceAssistantService.speak(t.sorryCouldNotUnderstand);
        }
      );
    } catch (error) {
      console.error('Failed to start voice assistant:', error);
      setVoiceListening(false);
      await voiceAssistantService.speak(t.voiceNotSupported);
    }
  };

  const processVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Navigation commands
    if (lowerCommand.includes('dashboard') || lowerCommand.includes('home') || lowerCommand.includes('डैशबोर्ड')) {
      speakResponse('Opening dashboard');
      router.push('/dashboard');
    }
    else if (lowerCommand.includes('finance') || lowerCommand.includes('wallet') || lowerCommand.includes('वित्त') || lowerCommand.includes('बटुआ')) {
      speakResponse('Opening finance center');
      router.push('/finance');
    }
    else if (lowerCommand.includes('land record') || lowerCommand.includes('भूमि') || lowerCommand.includes('records')) {
      speakResponse('Opening land records');
      router.push('/land-records');
    }
    else if (lowerCommand.includes('health check') || lowerCommand.includes('health') || lowerCommand.includes('स्वास्थ्य')) {
      speakResponse('Opening crop health check');
      router.push('/health-check');
    }
    else if (lowerCommand.includes('report') || lowerCommand.includes('रिपोर्ट')) {
      speakResponse('Opening reports');
      router.push('/reports');
    }
    else if (lowerCommand.includes('setting') || lowerCommand.includes('सेटिंग')) {
      speakResponse('Opening settings');
      router.push('/settings');
    }
    // Language change commands
    else if (lowerCommand.includes('switch to hindi') || lowerCommand.includes('हिंदी में') || lowerCommand.includes('hindi')) {
      changeLanguage('hi');
      speakResponse('भाषा हिंदी में बदल गई', 'hi-IN');
    }
    else if (lowerCommand.includes('switch to english') || lowerCommand.includes('english') || lowerCommand.includes('अंग्रेजी')) {
      changeLanguage('en');
      speakResponse('Language changed to English', 'en-IN');
    }
    else if (lowerCommand.includes('switch to kannada') || lowerCommand.includes('kannada') || lowerCommand.includes('ಕನ್ನಡ')) {
      changeLanguage('kn');
      speakResponse('ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ', 'kn-IN');
    }
    // Information requests
    else if (lowerCommand.includes('crop health') || lowerCommand.includes('health score') || lowerCommand.includes('फसल स्वास्थ्य')) {
      speakResponse(`Your crop health score is ${cropHealthScore} out of 100. ${cropHealthScore > 85 ? 'Excellent condition' : 'Needs attention'}.`);
    }
    else if (lowerCommand.includes('productivity') || lowerCommand.includes('उत्पादकता')) {
      speakResponse(`Land productivity is ${productivityScore} percent. ${productivityScore > 85 ? 'Very good' : 'Can be improved'}.`);
    }
    else if (lowerCommand.includes('water') || lowerCommand.includes('जल')) {
      speakResponse(`Water efficiency is ${waterEfficiency} percent.`);
    }
    else if (lowerCommand.includes('weather') || lowerCommand.includes('मौसम')) {
      speakResponse('Weather forecast: Partly cloudy with chances of rain in 2 days. Temperature around 28 degrees.');
    }
    else {
      // Send to Gemini for intelligent response
      try {
        const response = await geminiService.processVoiceCommand(command, {
          cropHealth: cropHealthScore,
          productivity: productivityScore,
          waterEfficiency,
          currentLang
        });
        speakResponse(response);
      } catch (error) {
        speakResponse('I can help you navigate to dashboard, finance center, land records, health check, reports, or settings. You can also ask about crop health, productivity, or water efficiency.');
      }
    }
  };

  const speakResponse = (text: string, langCode?: string) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode || (currentLang === 'hi' ? 'hi-IN' : 
                                   currentLang === 'kn' ? 'kn-IN' :
                                   'en-IN');
    utterance.rate = 0.9;
    utterance.pitch = 1;
    synth.speak(utterance);
    
    // Also show as alert for visual feedback
    setTimeout(() => {
      alert(`🎤 ${text}`);
    }, 100);
  };

  const StatCard = ({ icon, title, value, change, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {change && (
              <div className={`flex items-center text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {change > 0 ? '+' : ''}{change}%
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const WeatherCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          <span>{t.weatherForecast}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{t.today}</p>
              <p className="text-sm text-gray-600">{t.partlyCloudy}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">28°C - 35°C</p>
              <p className="text-sm text-blue-600">65% {t.humidity}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            {[t.tomorrow, t.day3, t.day4].map((day, index) => (
              <div key={`day-${index}`} className="p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">{day}</p>
                <Cloud className="w-4 h-4 mx-auto my-1 text-gray-500" />
                <p className="text-sm font-medium">30°/26°</p>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center text-blue-800">
              <Droplets className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{t.rainAlert}</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {t.chanceOfRain60} {t.prepareDrainageSystems}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CropHealthCard = () => {
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setSelectedFiles(files);
    };

    const handleAnalyze = async () => {
      if (selectedFiles.length === 0) return;
      
      setIsAnalyzing(true);
      try {
        const { firebaseStorageService } = await import('@/services/firebase-storage');
        
        // Upload first photo to Firebase and get URL
        const firstFile = selectedFiles[0];
        let photoUrl = '';
        
        try {
          if (lands.length > 0) {
            const uploadResult = await firebaseStorageService.uploadPhoto(firstFile, lands[0].id);
            photoUrl = uploadResult.url;
            console.log('✅ Photo uploaded to Firebase:', photoUrl);
          }
        } catch (uploadError) {
          console.warn('⚠️ Firebase upload failed, continuing with base64:', uploadError);
        }
        
        // Convert to base64 for Gemini analysis
        const base64 = await firebaseStorageService.fileToBase64(firstFile);
        
        // Analyze with Gemini
        const analysis = await geminiService.analyzeCropHealthDetailed(base64);
        
        setAnalysisResult(analysis);
        
        // Save to land records if photo was uploaded
        if (photoUrl && lands.length > 0) {
          const records = landMonitoringService.getLandRecords(lands[0].id);
          records.photos.push({
            url: photoUrl,
            timestamp: new Date().toISOString()
          });
          landMonitoringService.updateLandRecords(lands[0].id, records);
        }
        
      } catch (error) {
        console.error('Analysis failed:', error);
        alert('Analysis failed. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-green-500" />
              <span>Crop Health Monitor</span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowPhotoUpload(true)}
              className="bg-green-600"
            >
              <Camera className="w-4 h-4 mr-1" />
              {t.uploadPhotos}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analysisResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{t.fieldA}</p>
                    <p className="text-sm text-green-700">{t.uploadPhotosForAnalysis}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">{t.photoUploadTips}</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• {t.photoTip1}</li>
                  <li>• {t.photoTip2}</li>
                  <li>• {t.photoTip3}</li>
                  <li>• {t.photoTip4}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg border-2 ${
                analysisResult.cropHealth >= 85 ? 'bg-green-50 border-green-200' :
                analysisResult.cropHealth >= 65 ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{t.healthScore}: {analysisResult.cropHealth}/100</p>
                  {analysisResult.cropHealth >= 85 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm">{t.disease}: {analysisResult.disease}</p>
                <p className="text-sm">{t.waterStress}: {analysisResult.waterStress}</p>
              </div>
              
              {(analysisResult.disease !== 'None detected' || analysisResult.pestAttack !== 'None visible') && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="font-semibold text-red-900 mb-1">⚠️ Treatment Needed</p>
                  <p className="text-sm text-red-800">
                    {analysisResult.disease !== 'None detected' && `Treat disease: ${analysisResult.disease}`}
                    {analysisResult.pestAttack !== 'None visible' && ` • Control pests: ${analysisResult.pestAttack}`}
                  </p>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAnalysisResult(null);
                  setSelectedFiles([]);
                }}
                className="w-full"
              >
                {t.analyzeAgain}
              </Button>
            </div>
          )}
        </CardContent>

        {/* Photo Upload Modal */}
        {showPhotoUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Upload Crop Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} photo(s) selected`
                      : 'Take or upload 3-4 photos'}
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    Choose Photos
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPhotoUpload(false);
                      setSelectedFiles([]);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPhotoUpload(false);
                      handleAnalyze();
                    }}
                    disabled={selectedFiles.length === 0 || isAnalyzing}
                    className="flex-1 bg-green-600"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Card>
    );
  };

  const LiveSensorReadingsCard = () => {
    // Find IoT-enabled land with sensor readings
    let iotLand = null;
    let iotSetup = null;
    
    for (const land of lands) {
      const setupData = localStorage.getItem(`iot_setup_${land.id}`);
      if (setupData) {
        const setup = JSON.parse(setupData);
        if (setup.enabledSensors?.length > 0) {
          iotLand = land;
          iotSetup = setup;
          break;
        }
      }
    }

    if (!iotLand || !iotSetup) return null;

    const handleRunAnalysis = async () => {
      try {
        setIsProcessing(true);
        const { iotSensorAnalysisService } = await import('@/services/iotSensorAnalysis');
        await iotSensorAnalysisService.runAnalysisNow(iotLand.id);
        alert('Sensor analysis completed! Check the Reports page for results.');
      } catch (error) {
        console.error('Sensor analysis failed:', error);
        alert('Analysis failed. Please ensure sensors have readings.');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <span>Live Sensor Readings</span>
          </CardTitle>
          <CardDescription>
            {iotLand.district}, {iotLand.state} - {iotSetup.enabledSensors.length} sensors active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(iotSetup.sensorReadings || {}).map(([sensorId, reading]: [string, any]) => {
              const sensor = sensors.find(s => s.id === sensorId);
              if (!sensor) return null;

              return (
                <div key={sensorId} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <sensor.icon className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {sensor.name.split(' (')[0]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-700">{reading.value}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(reading.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(iotSetup.sensorReadings || {}).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No sensor readings yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/iot-setup?landId=${iotLand.id}`)}
                  className="mt-2"
                >
                  Configure Sensors
                </Button>
              </div>
            )}

            {Object.keys(iotSetup.sensorReadings || {}).length > 0 && (
              <div className="pt-3 border-t">
                <Button
                  size="sm"
                  onClick={handleRunAnalysis}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? 'Analyzing...' : 'Run Sensor Analysis Now'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const RecommendationsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          <span>{t.aiRecommendations}</span>
        </CardTitle>
        <CardDescription>{t.basedOnCropHealth}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {aiRecommendations.length > 0 ? (
            aiRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 border-l-4 ${
                  rec.urgency === 'high'
                    ? 'border-red-500 bg-red-50'
                    : rec.urgency === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`font-medium ${
                      rec.urgency === 'high'
                        ? 'text-red-900'
                        : rec.urgency === 'medium'
                        ? 'text-yellow-900'
                        : 'text-green-900'
                    }`}
                  >
                    {rec.action}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                      rec.urgency === 'high'
                        ? 'bg-red-200 text-red-800'
                        : rec.urgency === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {rec.urgency}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    rec.urgency === 'high'
                      ? 'text-red-800'
                      : rec.urgency === 'medium'
                      ? 'text-yellow-800'
                      : 'text-green-800'
                  } mb-1`}
                >
                  {rec.reason}
                </p>
                <p className="text-xs text-gray-600">⏰ {rec.timing}</p>
              </div>
            ))
          ) : (
            <div className="p-3 border-l-4 border-purple-500 bg-purple-50">
              <h4 className="font-medium text-purple-900">Loading recommendations...</h4>
              <p className="text-sm text-purple-800 mt-1">
                AI is analyzing your crop conditions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Leaf className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">{t.appName}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Token Usage Bar */}
              <div className="hidden md:block">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-gray-600">{t.aiTokens}</p>
                    <p className="text-sm font-semibold">1,240 / 5,000 {t.usedToday}</p>
                  </div>
                </div>
              </div>
              
              {/* Voice Assistant Button */}
              <Button
                variant={voiceListening ? "default" : "outline"}
                onClick={handleVoiceAssistant}
                disabled={!voiceSupported}
                className={voiceListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}
                title={voiceSupported ? (voiceListening ? t.listening : t.voiceAssistant) : t.voiceNotSupported}
              >
                <Mic className="w-4 h-4 mr-2" />
                {voiceListening ? t.listening : t.voiceAssistant}
              </Button>
              
              {/* Notifications */}
              <div className="relative">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => n.unread) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </Button>
              </div>
              
              {/* Language Selector */}
              <LanguageSelector />
              
              <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => router.push('/auth/login')}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t.welcomeBack}, {user?.name || t.farmer}! 🌾
            </h1>
            <p className="text-gray-600">
              {t.today}, {t.july6th2026}
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/finance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.finance}</p>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{t.wallet} & {t.orders}</div>
                  <div className="flex items-center text-sm text-blue-600 mt-2">
                    <span>{t.clickToManage} →</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-500">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-600">{t.landProductivity}</p>
                    <button
                      onClick={() => setShowScoreBreakdown(showScoreBreakdown === 'productivity' ? null : 'productivity')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{productivityScore}%</div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +5%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              {showScoreBreakdown === 'productivity' && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
                  <p className="font-semibold text-blue-900">{t.scoreBreakdown}:</p>
                  <p>• Historical Yield: 30%</p>
                  <p>• {t.weather}: 20%</p>
                  <p>• Satellite NDVI: 20%</p>
                  <p>• Soil Quality: 20%</p>
                  <p>• Water Availability: 10%</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-600">{t.waterEfficiency}</p>
                    <button
                      onClick={() => setShowScoreBreakdown(showScoreBreakdown === 'water' ? null : 'water')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{waterEfficiency}%</div>
                  <div className="flex items-center text-sm text-red-600">
                    <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                    -2%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-cyan-500">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
              </div>
              {showScoreBreakdown === 'water' && (
                <div className="mt-4 p-3 bg-cyan-50 rounded text-xs">
                  <p className="font-semibold text-cyan-900">{t.scoreBreakdown}:</p>
                  <p>• {t.rainfall}: 30%</p>
                  <p>• Satellite Moisture: 30%</p>
                  <p>• Crop Type: 20%</p>
                  <p>• Irrigation Method: 20%</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-600">{t.cropHealth}</p>
                    <button
                      onClick={() => setShowScoreBreakdown(showScoreBreakdown === 'health' ? null : 'health')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{cropHealthScore}/100</div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +3%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-600">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
              </div>
              {showScoreBreakdown === 'health' && (
                <div className="mt-4 p-3 bg-green-50 rounded text-xs">
                  <p className="font-semibold text-green-900">{t.scoreBreakdown}:</p>
                  <p>• Gemini Image Analysis: 40%</p>
                  <p>• {t.weather}: 20%</p>
                  <p>• Satellite NDVI: 20%</p>
                  <p>• Previous Reports: 20%</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profit Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span>{t.profitAnalytics}</span>
                </CardTitle>
                <CardDescription>{t.monthlyProfitVsExpenses}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="profit" fill="#10b981" name="Profit" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Crop Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <span>{t.cropTimeline}</span>
                </CardTitle>
                <CardDescription>
                  {t.plantedOn} {new Date(plantingDate).toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : currentLang === 'kn' ? 'kn-IN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cropTimeline.length > 0 ? (
                    cropTimeline.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-green-700">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900">{item.action}</p>
                            <span className="text-xs text-gray-500">{item.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{item.reason}</p>
                          {item.weatherImpact && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center">
                              <Cloud className="w-3 h-3 mr-1" />
                              {item.weatherImpact}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{t.loadingCropTimeline}...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <WeatherCard />
            <CropHealthCard />
            {/* Live Sensor Readings - Only for IoT mode parcels */}
            {lands.some(land => {
              const iotSetup = localStorage.getItem(`iot_setup_${land.id}`);
              return iotSetup && JSON.parse(iotSetup).enabledSensors?.length > 0;
            }) && <LiveSensorReadingsCard />}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Lands Section */}
          {lands.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="w-5 h-5 text-green-500" />
                  <span>{t.myAgriculturalLands}</span>
                </CardTitle>
                <CardDescription>{t.locationsAndStatus}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lands.map((land) => {
                    const analysis = localStorage.getItem(`analysis_${land.id}`);
                    const analysisData = analysis ? JSON.parse(analysis) : null;
                    
                    return (
                      <div key={land.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {land.district || 'Unknown District'}
                            </h4>
                            <p className="text-sm text-gray-600">{land.state || 'Unknown State'}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            {land.size || 5} acres
                          </span>
                        </div>
                        
                        {land.coordinates && land.coordinates.length > 0 && (
                          <div className="text-xs text-gray-500 mb-2">
                            📍 {land.coordinates.length} {t.boundaryPoints}
                            <br />
                            {land.coordinates[0]?.lat?.toFixed(4)}, {land.coordinates[0]?.lng?.toFixed(4)}
                          </div>
                        )}
                        
                        {analysisData && (
                          <div className="mt-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t.healthScore}:</span>
                              <span className="font-medium text-green-600">{analysisData.overallScore || 'N/A'}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t.vegetation}:</span>
                              <span className="font-medium">{analysisData.vegetation || 'N/A'}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t.waterSource}:</span>
                              <span className="font-medium capitalize">
                                {analysisData.waterSourceType || t.none}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {!analysisData && (
                          <p className="text-sm text-gray-500 mt-3">{t.analysisPending}...</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          <RecommendationsCard />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                <span>{t.quickActions}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => router.push('/health-check')}
                >
                  <Camera className="w-6 h-6" />
                  <span>Health Check</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => router.push('/ask-ai')}
                >
                  <MessageSquare className="w-6 h-6" />
                  <span>Ask AI</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => setShowTenantModal(true)}
                >
                  <Users className="w-6 h-6" />
                  <span>Hire Tenant</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => router.push('/schedule-tasks')}
                >
                  <Calendar className="w-6 h-6" />
                  <span>Schedule Task</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => router.push('/reports')}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>View Reports</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => router.push('/land-records')}
                >
                  <Grid3x3 className="w-6 h-6" />
                  <span>Land Records</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => {
                    if (lands.length > 0) {
                      router.push(`/analysis/${lands[0].id}`);
                    }
                  }}
                >
                  <Leaf className="w-6 h-6" />
                  <span>Run Analysis</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showTenantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Hire a Tenant</h2>
                <p className="text-sm text-gray-600">Choose a tenant profile and send a hiring request.</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-900"
                onClick={() => setShowTenantModal(false)}
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {tenantMessage && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                  {tenantMessage}
                </div>
              )}
              {tenants.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                          <p className="text-sm text-gray-500">{tenant.location}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tenant.availability ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {tenant.availability ? 'Available' : 'Busy'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><strong>Experience:</strong> {tenant.experience} years</p>
                        <p><strong>Specialty:</strong> {tenant.specialty}</p>
                        <p><strong>Rate:</strong> ₹{tenant.hourlyRate}/hr</p>
                        <p><strong>Rating:</strong> {tenant.rating} ⭐</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          disabled={!tenant.availability}
                          onClick={() => {
                            if (!tenant.availability) return;
                            setTenantMessage(`Message sent to ${tenant.name}. They will contact you soon.`);
                            setShowTenantModal(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Hire
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tenant profiles are available right now.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}