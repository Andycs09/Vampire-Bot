'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Globe, Bell, User, Info, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/services/language';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsPage() {
  const router = useRouter();
  const { t, currentLang, changeLanguage } = useTranslation();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    changeLanguage(langCode);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
            <h1 className="ml-4 text-xl font-bold">{t.settings}</h1>
          </div>
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t.success}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>{t.language}</span>
              </CardTitle>
              <CardDescription>{t.selectLanguage}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      currentLang === lang.code
                        ? 'border-green-600 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{lang.flag}</span>
                      {currentLang === lang.code && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{lang.nativeName}</p>
                      <p className="text-xs text-gray-600">{lang.name}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {t.info}
                </h4>
                <p className="text-sm text-blue-800">
                  Changing the language will update all text throughout the application immediately.
                  Your preference will be saved automatically.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Other Settings Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-purple-600" />
                <span>{t.notifications}</span>
              </CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Weather Alerts</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Crop Health Updates</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Market Price Changes</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">AI Recommendations</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-green-600" />
                <span>{t.profile}</span>
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {typeof window !== 'undefined' ? 
                      JSON.parse(localStorage.getItem('user') || '{}').name || 'Farmer' 
                      : 'Farmer'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium">Land Owner</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium">
                    {SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.nativeName}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-gray-600" />
                <span>{t.about}</span>
              </CardTitle>
              <CardDescription>Fasal Munafa - Smart Agriculture Platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Last Updated:</strong> July 2026</p>
                <p className="mt-4">
                  Fasal Munafa is an AI-powered agricultural management platform designed to help
                  farmers make informed decisions, optimize crop yields, and maximize profits.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
