'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, ArrowLeft, CheckCircle, AlertTriangle, XCircle, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { geminiService } from '@/services/gemini';

export default function HealthCheckPage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('📷 File selected:', file);
    if (file) {
      console.log('📷 File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('📷 Image loaded, base64 length:', result?.length);
        console.log('📷 Base64 preview:', result?.substring(0, 100));
        setImagePreview(result);
        setResult(null);
      };
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('⚠️ No file selected');
    }
  };

  const analyzeImage = async () => {
    if (!imagePreview) {
      console.error('❌ No image preview available');
      return;
    }

    console.log('🔬 Starting analysis...');
    setIsAnalyzing(true);
    try {
      // Convert base64 to clean format for API
      const base64Clean = imagePreview.split(',')[1];
      console.log('🔬 Base64 clean length:', base64Clean?.length);
      console.log('🔬 Base64 clean preview:', base64Clean?.substring(0, 50));
      
      console.log('📤 Calling Gemini service...');
      const analysis = await geminiService.analyzeCropHealthDetailed(base64Clean);
      console.log('✅ Analysis result:', analysis);
      setResult(analysis);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      const fallbackResult = {
        cropHealth: 75,
        disease: 'Analysis unavailable - using fallback',
        waterStress: 'Medium',
        nitrogenDeficiency: 'Unknown',
        pestAttack: 'Unknown',
        weedCoverage: 'Unknown',
        leafColor: 'Unable to determine',
        verdict: 'Needs Attention'
      };
      console.log('🔄 Using fallback result:', fallbackResult);
      setResult(fallbackResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdict = () => {
    if (!result) return null;
    
    if (result.cropHealth >= 85) {
      return { status: 'Good', color: 'green', icon: CheckCircle };
    } else if (result.cropHealth >= 65) {
      return { status: 'Needs Attention', color: 'yellow', icon: AlertTriangle };
    } else {
      return { status: 'Critical', color: 'red', icon: XCircle };
    }
  };

  const verdict = getVerdict();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="ml-4 text-xl font-bold">Quick Health Check</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-green-600" />
              <span>Upload Crop Photo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Take or upload a photo of your crop</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="crop-image-input"
                  />
                  <Button type="button" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Photo
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <div>
                <img
                  src={imagePreview}
                  alt="Crop"
                  className="w-full rounded-lg mb-4"
                />
                
                {!result && (
                  <Button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Health'}
                  </Button>
                )}

                {result && verdict && (
                  <div className="space-y-4 mt-4">
                    {/* Verdict */}
                    <div className={`p-6 rounded-lg border-2 ${
                      verdict.color === 'green' ? 'bg-green-50 border-green-200' :
                      verdict.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-center mb-4">
                        <verdict.icon className={`w-16 h-16 ${
                          verdict.color === 'green' ? 'text-green-600' :
                          verdict.color === 'yellow' ? 'text-yellow-600' :
                          'text-red-600'
                        }`} />
                      </div>
                      <h2 className={`text-3xl font-bold text-center mb-2 ${
                        verdict.color === 'green' ? 'text-green-900' :
                        verdict.color === 'yellow' ? 'text-yellow-900' :
                        'text-red-900'
                      }`}>
                        {verdict.status}
                      </h2>
                      <p className="text-center text-gray-700">
                        Crop Health: {result.cropHealth}/100
                      </p>
                    </div>

                    {/* Issues Detected */}
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Disease:</span>
                          <span>{result.disease}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Water Stress:</span>
                          <span>{result.waterStress}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Nitrogen Deficiency:</span>
                          <span>{result.nitrogenDeficiency}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Pest Attack:</span>
                          <span>{result.pestAttack}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Weed Coverage:</span>
                          <span>{result.weedCoverage}</span>
                        </div>
                        {result.leafColor && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Leaf Color:</span>
                            <span>{result.leafColor}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Treatment Area */}
                    {(result.disease !== 'None detected' || result.pestAttack !== 'None visible') && (
                      <Card className="bg-blue-50">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-blue-900 mb-2">Treatment Focus:</h3>
                          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                            {result.disease !== 'None detected' && (
                              <li>Focus on diseased leaves and stems</li>
                            )}
                            {result.pestAttack !== 'None visible' && (
                              <li>Check undersides of leaves for pests</li>
                            )}
                            {result.dryPatches !== 'None' && (
                              <li>Address dry patches with irrigation</li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImagePreview(null);
                          setResult(null);
                        }}
                        className="flex-1"
                      >
                        Check Another
                      </Button>
                      <Button
                        onClick={() => router.push('/dashboard')}
                        className="flex-1 bg-green-600"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for Best Results:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Take photos in good natural light</li>
            <li>• Focus on affected areas (leaves, stems, soil)</li>
            <li>• Include multiple angles if possible</li>
            <li>• Avoid blurry or dark images</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
