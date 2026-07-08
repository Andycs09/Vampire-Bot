'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Phone, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OtpModal } from '@/components/OtpModal';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate sending OTP
      console.log(`Sending OTP to +91${phoneNumber}`);
      
      // Show OTP modal instead of prompt
      setTimeout(() => {
        setLoading(false);
        setShowOtpModal(true);
      }, 1000); // Simulate API delay

    } catch (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    setOtpLoading(true);
    
    try {
      // Verify OTP (demo accepts 123456)
      if (otp === '123456') {
        // Store phone number and redirect to onboarding
        localStorage.setItem('phoneNumber', phoneNumber);
        localStorage.setItem('isAuthenticated', 'true');
        
        setTimeout(() => {
          setOtpLoading(false);
          setShowOtpModal(false);
          router.push('/onboarding');
        }, 1500); // Simulate verification delay
      } else {
        setOtpLoading(false);
        setError('Invalid OTP. Please use 123456 for demo.');
      }
    } catch (error) {
      setOtpLoading(false);
      setError('OTP verification failed. Please try again.');
    }
  };

  const handleOtpClose = () => {
    if (!otpLoading) {
      setShowOtpModal(false);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Fasal Munafa</h1>
          </motion.div>
          
          <p className="text-gray-600">
            Your AI-powered agricultural advisor
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <span>Get Started</span>
              </CardTitle>
              <CardDescription>
                Enter your phone number to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-3 border-2 border-r-0 border-gray-200 bg-gray-50 rounded-l-lg">
                      <span className="text-gray-700 font-semibold">+91</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setPhoneNumber(value);
                          setError('');
                        }
                      }}
                      className="rounded-l-none"
                      maxLength={10}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && phoneNumber.length === 10) {
                          handleLogin();
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    We'll send an OTP to verify your number (demo: use 123456)
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                  disabled={loading || phoneNumber.length !== 10}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending OTP...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2" />
            Your data is secure and encrypted
          </div>
        </motion.div>
      </div>

      {/* OTP Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={handleOtpClose}
        onSubmit={handleOtpSubmit}
        phoneNumber={`+91${phoneNumber}`}
        isLoading={otpLoading}
      />
    </div>
  );
}