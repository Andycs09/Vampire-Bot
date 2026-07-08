'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, User, MapPin, Users, ArrowRight, ArrowLeft, MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { geolocationService } from '@/services/geolocation';
import { LAND_UNIT_OPTIONS, type LandUnit } from '@/lib/utils';

interface UserData {
  name: string;
  age: string;
  phone: string;
  language: 'hindi' | 'english' | 'kannada' | 'telugu' | 'tamil';
  state: string;
  district: string;
  village: string;
  userType: 'landowner' | 'tenant' | 'government';
  landSize?: string;
  landUnit?: LandUnit;
  hourlyRate?: string;
  cropSpecialization?: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    age: '',
    phone: '',
    language: 'english',
    state: '',
    district: '',
    village: '',
    userType: 'landowner'
  });
  
  const router = useRouter();

  const cropSpecializations = [
    'Rice farming',
    'Wheat cultivation',
    'Cotton farming',
    'Sugarcane cultivation',
    'Vegetable farming',
    'Fruit orchards',
    'Dairy farming',
    'Organic farming',
    'Mixed farming',
    'Pulses cultivation'
  ];

  const states = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana', 
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 
    'Uttar Pradesh', 'West Bengal'
  ];

  const languages = [
    { code: 'english', name: 'English' },
    { code: 'hindi', name: 'हिंदी (Hindi)' },
    { code: 'kannada', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'telugu', name: 'తెలుగు (Telugu)' },
    { code: 'tamil', name: 'தমিழ் (Tamil)' }
  ];

  const userTypes = [
    { value: 'landowner', label: 'Landowner', description: 'I own agricultural land' },
    { value: 'tenant', label: 'Tenant Farmer', description: 'I farm on rented/leased land' },
    { value: 'government', label: 'Government Officer', description: 'Agricultural extension officer' }
  ];

  useEffect(() => {
    setMounted(true);
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (phoneNumber) {
      setUserData(prev => ({ ...prev, phone: phoneNumber }));
    }
    
    requestLocationAccess();
  }, []);

  const requestLocationAccess = async () => {
    setLocationLoading(true);
    try {
      const location = await geolocationService.getLocationWithAddress();
      if (location) {
        setUserData(prev => ({
          ...prev,
          state: location.state || '',
          district: location.district || '',
          village: location.village || ''
        }));
      }
    } catch (error) {
      console.error('Location access denied or failed:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const user = await authService.createUserProfile({
        name: userData.name,
        age: parseInt(userData.age),
        phone: userData.phone,
        language: userData.language,
        state: userData.state,
        district: userData.district,
        village: userData.village,
        userType: userData.userType
      });

      localStorage.setItem('user', JSON.stringify(user));
      
      if (userData.userType === 'government') {
        router.push('/government/dashboard');
      } else if (userData.userType === 'tenant') {
        router.push('/tenant-dashboard');
      } else {
        router.push('/land-registration');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (!mounted) return false;
    
    switch (step) {
      case 1:
        return !!(userData.name && userData.age && userData.phone && userData.language);
      case 2:
        return !!userData.userType;
      case 3:
        if (userData.userType === 'landowner') {
          return !!(userData.landSize && userData.landUnit);
        } else if (userData.userType === 'tenant') {
          return !!(userData.hourlyRate && userData.cropSpecialization);
        }
        return true;
      case 4:
        return !!(userData.state && userData.district && userData.village);
      default:
        return false;
    }
  };

  const SimpleSelect = ({ children, value, onValueChange, placeholder }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
  }) => {
    return (
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    );
  };

  const SimpleSelectItem = ({ children, value }: { children: React.ReactNode; value: string }) => {
    return <option value={value}>{children}</option>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {!mounted ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center space-x-3 mb-4"
            >
              <Leaf className="w-10 h-10 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Welcome to Fasal Munafa</h1>
            </motion.div>
            
            <p className="text-gray-600">
              Let's set up your profile to get personalized AI recommendations
            </p>

            <div className="flex justify-center mt-8">
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i <= step ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
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
                  {step === 1 && (
                    <>
                      <User className="w-5 h-5 text-blue-600" />
                      <span>Personal Information</span>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>User Type</span>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      {userData.userType === 'landowner' && <Leaf className="w-5 h-5 text-green-600" />}
                      {userData.userType === 'tenant' && <Users className="w-5 h-5 text-blue-600" />}
                      {userData.userType === 'government' && <MapPin className="w-5 h-5 text-purple-600" />}
                      <span>
                        {userData.userType === 'landowner' && 'Land Details'}
                        {userData.userType === 'tenant' && 'Service Details'}
                        {userData.userType === 'government' && 'Ready to Continue'}
                      </span>
                    </>
                  )}
                  {step === 4 && (
                    <>
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <span>Location Details</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Tell us about yourself'}
                  {step === 2 && 'How do you use agricultural services?'}
                  {step === 3 && userData.userType === 'landowner' && 'Tell us about your land'}
                  {step === 3 && userData.userType === 'tenant' && 'Your farming expertise'}
                  {step === 3 && userData.userType === 'government' && 'Profile setup complete'}
                  {step === 4 && 'Where are you located?'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        placeholder="Enter your full name"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age *
                      </label>
                      <Input
                        type="number"
                        placeholder="Age"
                        value={userData.age}
                        onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                        min="18"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={userData.phone}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Phone number verified ✓
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Language *
                      </label>
                      <SimpleSelect
                        value={userData.language}
                        onValueChange={(value) => setUserData({ ...userData, language: value as any })}
                        placeholder="Select language"
                      >
                        {languages.map((lang) => (
                          <SimpleSelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SimpleSelectItem>
                        ))}
                      </SimpleSelect>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    {userTypes.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => setUserData({ ...userData, userType: type.value as any })}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          userData.userType === type.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{type.label}</h3>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            userData.userType === type.value
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {userData.userType === type.value && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step === 3 && userData.userType === 'landowner' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Land Size *
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter land size"
                          value={userData.landSize || ''}
                          onChange={(e) => setUserData({ ...userData, landSize: e.target.value })}
                          min="0"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit *
                        </label>
                        <SimpleSelect
                          value={userData.landUnit || ''}
                          onValueChange={(value) => setUserData({ ...userData, landUnit: value as any })}
                          placeholder="Select unit"
                        >
                          {LAND_UNIT_OPTIONS.map((unit) => (
                            <SimpleSelectItem key={unit.value} value={unit.value}>
                              {unit.label} - {unit.regions}
                            </SimpleSelectItem>
                          ))}
                        </SimpleSelect>
                      </div>
                    </div>

                    {userData.state && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          💡 {geolocationService.getTypicalLandSize(userData.state)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && userData.userType === 'tenant' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate (₹) *
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter your hourly rate"
                        value={userData.hourlyRate || ''}
                        onChange={(e) => setUserData({ ...userData, hourlyRate: e.target.value })}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Crop Specialization *
                      </label>
                      <SimpleSelect
                        value={userData.cropSpecialization || ''}
                        onValueChange={(value) => setUserData({ ...userData, cropSpecialization: value })}
                        placeholder="Select specialization"
                      >
                        {cropSpecializations.map((crop) => (
                          <SimpleSelectItem key={crop} value={crop}>
                            {crop}
                          </SimpleSelectItem>
                        ))}
                      </SimpleSelect>
                    </div>
                  </div>
                )}

                {step === 3 && userData.userType === 'government' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Government Profile Ready
                    </h3>
                    <p className="text-gray-600">
                      You'll have access to farmer management and agricultural oversight tools.
                    </p>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-gray-700">
                        Location Information
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestLocationAccess}
                        disabled={locationLoading}
                        className="flex items-center space-x-2"
                      >
                        <MapIcon className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
                        <span>{locationLoading ? 'Getting Location...' : 'Auto-fill Location'}</span>
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <SimpleSelect
                          value={userData.state}
                          onValueChange={(value) => setUserData({ ...userData, state: value, district: '', village: '' })}
                          placeholder="Select your state"
                        >
                          {states.map((state) => (
                            <SimpleSelectItem key={state} value={state}>
                              {state}
                            </SimpleSelectItem>
                          ))}
                        </SimpleSelect>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District *
                        </label>
                        <Input
                          placeholder="Enter your district"
                          value={userData.district}
                          onChange={(e) => setUserData({ ...userData, district: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Village/Town *
                        </label>
                        <Input
                          placeholder="Enter your village/town"
                          value={userData.village}
                          onChange={(e) => setUserData({ ...userData, village: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid() || loading}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex items-center space-x-2"
                  >
                    <span>{step === 4 ? (loading ? 'Creating Profile...' : 'Complete Setup') : 'Next'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}