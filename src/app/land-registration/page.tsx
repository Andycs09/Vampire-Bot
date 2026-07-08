'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, MapPin, Square, Save, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LAND_UNIT_OPTIONS, convertLandUnit, type LandUnit } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import GoogleMapPicker to avoid SSR issues
const GoogleMapPicker = dynamic(() => import('@/components/GoogleMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Google Maps...</p>
      </div>
    </div>
  )
});

interface LandData {
  state: string;
  district: string;
  village: string;
  size: string;
  unit: LandUnit;
  coordinates: Array<{ lat: number; lng: number }>;
}

export default function LandRegistrationPage() {
  const [step, setStep] = useState<'details' | 'mapping'>('details');
  const [loading, setLoading] = useState(false);
  const [landData, setLandData] = useState<LandData>({
    state: '',
    district: '',
    village: '',
    size: '',
    unit: 'acres',
    coordinates: []
  });

  const router = useRouter();

  const handleSaveLand = async () => {
    setLoading(true);
    
    try {
      // Convert size to acres for standardization
      const sizeInAcres = convertLandUnit(parseFloat(landData.size), landData.unit, 'acres');
      
      const landRecord = {
        id: `land_${Date.now()}`,
        userId: 'current_user', // In real app, get from auth context
        ...landData,
        size: sizeInAcres,
        unit: 'acres' as const,
        createdAt: new Date()
      };

      // Store in localStorage for demo
      const existingLands = JSON.parse(localStorage.getItem('lands') || '[]');
      existingLands.push(landRecord);
      localStorage.setItem('lands', JSON.stringify(existingLands));
      
      // Redirect to AI analysis
      router.push(`/analysis/${landRecord.id}`);
    } catch (error) {
      console.error('Error saving land:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <Leaf className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Land Registration</h1>
          </motion.div>
          
          <p className="text-gray-600">
            Register your agricultural land to get personalized AI recommendations
          </p>

          {/* Step indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-4">
              <div className={`flex items-center space-x-2 ${step === 'details' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="font-medium">Land Details</span>
              </div>
              <div className="flex items-center">
                <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
              </div>
              <div className={`flex items-center space-x-2 ${step === 'mapping' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="font-medium">Map Boundaries</span>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                {step === 'details' ? (
                  <>
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span>Land Information</span>
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5 text-green-600" />
                    <span>Mark Your Land Boundaries</span>
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {step === 'details' 
                  ? 'Provide basic information about your agricultural land'
                  : 'Use the map to draw your land boundaries accurately'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === 'details' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <Input
                          placeholder="e.g., Karnataka"
                          value={landData.state}
                          onChange={(e) => setLandData({ ...landData, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                        <Input
                          placeholder="e.g., Mysuru"
                          value={landData.district}
                          onChange={(e) => setLandData({ ...landData, district: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Village</label>
                        <Input
                          placeholder="e.g., Mandya"
                          value={landData.village}
                          onChange={(e) => setLandData({ ...landData, village: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Land Size</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                        <Input
                          type="number"
                          placeholder="e.g., 5"
                          value={landData.size}
                          onChange={(e) => setLandData({ ...landData, size: e.target.value })}
                          step="0.1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                        <select
                          value={landData.unit}
                          onChange={(e) => setLandData({ ...landData, unit: e.target.value as any })}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          {LAND_UNIT_OPTIONS.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label} - {unit.regions}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {landData.size && landData.unit !== 'acres' && (
                      <p className="text-sm text-gray-600 mt-2">
                        Equivalent: {convertLandUnit(parseFloat(landData.size), landData.unit, 'acres').toFixed(2)} acres
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <GoogleMapPicker
                    onCoordinatesChange={(coords) => setLandData({ ...landData, coordinates: coords })}
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep('details')}
                  disabled={step === 'details'}
                >
                  Back
                </Button>

                {step === 'details' ? (
                  <Button
                    onClick={() => setStep('mapping')}
                    disabled={!landData.state || !landData.district || !landData.village || !landData.size}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    Next: Map Boundaries
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveLand}
                    disabled={landData.coordinates.length < 3 || loading}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save & Analyze Land'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}