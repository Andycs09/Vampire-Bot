'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  phoneNumber?: string;
  isLoading?: boolean;
}

export function OtpModal({ isOpen, onClose, onSubmit, phoneNumber, isLoading = false }: OtpModalProps) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    setOtp(newDigits.join(''));

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onSubmit(otp);
    }
  };

  const handleDemoFill = () => {
    const demoOtp = ['1', '2', '3', '4', '5', '6'];
    setOtpDigits(demoOtp);
    setOtp('123456');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
          <CardTitle className="text-center">{t.enterOtp}</CardTitle>
          <CardDescription className="text-center">
            {t.weSentCode} {phoneNumber || 'your phone number'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Fields */}
            <div className="flex justify-center space-x-2">
              {otpDigits.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 focus:border-green-500"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Demo Helper */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">For demo, use: 123456</p>
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-sm text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Fill Demo OTP
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={otp.length !== 6 || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>

            {/* Resend Option */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                Didn't receive code? Resend
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}