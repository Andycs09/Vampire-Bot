'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Camera, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Upload,
  Brain,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { geminiService } from '@/services/gemini';
import { governmentCasesService } from '@/services/governmentCases';

interface SamplePhoto {
  id: string;
  day: number;
  imageUrl: string;
  description: string;
  cropType: string;
}

export default function HealthCheckPage() {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [samplePhotos] = useState<SamplePhoto[]>([
    {
      id: 'sample_1',
      day: 1,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
      description: 'Early seedling stage - healthy green leaves',
      cropType: 'rice'
    },
    {
      id: 'sample_15',
      day: 15,
      imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=300&fit=crop',
      description: 'Growing stage - some yellowing visible on lower leaves',
      cropType: 'rice'
    },
    {
      id: 'sample_30',
      day: 30,
      imageUrl: 'https://images.unsplash.com/photo-1500461185406-e2ae77dbaac3?w=400&h=300&fit=crop',
      description: 'Mature stage - brown spots on leaves indicating possible disease',
      cropType: 'rice'
    }
  ]);

  const router = useRouter();
  const params = useParams();
  const landId = params.landId as string;

  const handlePhotoAnalysis = async (photo: SamplePhoto) => {
    setAnalyzing(true);
    setDiagnosis(null);

    try {
      // Use real Gemini Vision API for health analysis
      const result = await geminiService.analyzeCropHealth(photo.imageUrl);
      setDiagnosis(result);

      // Auto-create government escalation if needed
      if (result.confidence < 70 || result.severity === 'high' || result.requiresHumanReview) {
        await createGovernmentEscalation(result, photo);
      }

    } catch (error) {
      console.error('Error analyzing photo:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const createGovernmentEscalation = async (diagnosis: any, photo: SamplePhoto) => {
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const primaryLand = Array.isArray(lands) ? lands.find((item: any) => item.id === landId) || lands[0] : null;

    governmentCasesService.addCase({
      farmerId: currentUser?.id || `farmer_${Date.now()}`,
      farmerName: currentUser?.name || 'Current Farmer',
      farmerPhone: currentUser?.phone || '+91',
      farmerLocation: {
        village: currentUser?.village || primaryLand?.village || 'Unknown',
        district: currentUser?.district || primaryLand?.district || 'Unknown',
        state: currentUser?.state || primaryLand?.state || 'Unknown',
        coordinates: primaryLand?.coordinates?.[0]
          ? {
              lat: primaryLand.coordinates[0].lat || 12.3,
              lng: primaryLand.coordinates[0].lng || 76.6,
            }
          : undefined,
      },
      landId,
      cropType: primaryLand?.cropType || primaryLand?.crop || photo.cropType || 'Mixed Crop',
      issueDescription: `Day ${photo.day} crop health issue detected: ${diagnosis.reasoning}`,
      imageUrl: photo.imageUrl,
      aiDiagnosis: {
        disease: diagnosis.diagnosis,
        confidence: diagnosis.confidence,
        recommendation: diagnosis.medicine || 'Expert review required',
      },
      caseType: 'ai_flagged',
      severity: diagnosis.severity || 'medium',
      status: 'pending',
      priority: diagnosis.confidence < 70 || diagnosis.severity === 'high' ? 3 : 2,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('government-cases-updated'));
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crop Health Monitoring</h1>
            <p className="text-gray-600">AI-powered health analysis with sample progression photos</p>
          </div>
        </div>

        {/* Sample Photos Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>Health Check Progression</span>
            </CardTitle>
            <CardDescription>
              Select a day to analyze crop health with our AI system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {samplePhotos.map((photo) => (
                <Card 
                  key={photo.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedDay === photo.day ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedDay(photo.day)}
                >
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={photo.imageUrl}
                        alt={`Day ${photo.day} crop health`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-semibold">
                        Day {photo.day}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">Day {photo.day} Health Check</h3>
                    <p className="text-sm text-gray-600 mb-4">{photo.description}</p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhotoAnalysis(photo);
                      }}
                      disabled={analyzing}
                    >
                      {analyzing && selectedDay === photo.day ? (
                        <>
                          <Brain className="w-4 h-4 mr-2 animate-pulse" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          AI Health Check
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {diagnosis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <span>AI Health Diagnosis</span>
                  {diagnosis.requiresHumanReview && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                      Expert Review Requested
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Diagnosis Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      {diagnosis.diagnosis === 'healthy' ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      )}
                      <div>
                        <p className="font-semibold capitalize">{diagnosis.diagnosis.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">Primary Issue</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        diagnosis.confidence >= 80 ? 'bg-green-500' : 
                        diagnosis.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {diagnosis.confidence}%
                      </div>
                      <div>
                        <p className="font-semibold">AI Confidence</p>
                        <p className="text-sm text-gray-600">Analysis Certainty</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold capitalize ${
                        diagnosis.severity === 'low' ? 'bg-green-500' : 
                        diagnosis.severity === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {diagnosis.severity[0]}
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{diagnosis.severity} Severity</p>
                        <p className="text-sm text-gray-600">Urgency Level</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Detailed Analysis */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    AI Analysis Details
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{diagnosis.reasoning}</p>
                </div>

                {/* Treatment Recommendation */}
                {diagnosis.medicine && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Recommended Treatment</h3>
                    <p className="text-blue-700 font-medium">{diagnosis.medicine}</p>
                    {diagnosis.dosage && (
                      <p className="text-blue-600 text-sm mt-1">Dosage: {diagnosis.dosage}</p>
                    )}
                  </div>
                )}

                {/* Government Escalation Notice */}
                {diagnosis.requiresHumanReview && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Government Expert Review Requested
                    </h3>
                    <p className="text-red-700 text-sm">
                      This case has been automatically escalated to agricultural experts due to {
                        diagnosis.confidence < 70 ? 'low AI confidence' : 'high severity'
                      }. You will be contacted within 24 hours.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      View Case Status
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setDiagnosis(null)} variant="outline">
                    Analyze Another Photo
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/government/dashboard')}
                    variant="outline"
                  >
                    Contact Extension Officer
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="bg-linear-to-r from-green-600 to-blue-600"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Upload Custom Photo Option */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-gray-500" />
              <span>Upload Your Own Photo</span>
            </CardTitle>
            <CardDescription>
              Take a photo of your crops for personalized AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Drag and drop your crop photo here, or click to browse</p>
              <Button variant="outline">
                Choose Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}