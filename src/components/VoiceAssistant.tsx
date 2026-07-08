'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare,
  X,
  Languages
} from 'lucide-react';
import { voiceService } from '@/services/voice';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceAssistant({ isOpen, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsSupported(voiceService.isWebSpeechSupported());
  }, []);

  const startListening = async () => {
    if (!isSupported) {
      setError('Voice recognition is not supported in your browser');
      return;
    }

    setError('');
    setTranscript('');
    setResponse('');
    
    try {
      await voiceService.startListening(
        language,
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            processVoiceCommand(text);
          }
        },
        (error) => {
          setError(error);
          setIsListening(false);
        }
      );
      setIsListening(true);
    } catch (error) {
      setError('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const processVoiceCommand = async (text: string) => {
    setIsListening(false);
    
    try {
      const aiResponse = await voiceService.processVoiceCommand(text, language);
      setResponse(aiResponse);
      
      // Speak the response
      setIsSpeaking(true);
      await voiceService.speak(aiResponse, language);
      setIsSpeaking(false);
    } catch (error) {
      setError('Failed to process voice command');
      setIsSpeaking(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
    setTranscript('');
    setResponse('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Voice Assistant</h2>
                    <p className="text-sm text-gray-600">
                      {language === 'hi' ? 'हिंदी में पूछें' : 'Ask me anything about farming'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Language Toggle */}
              <div className="flex justify-center mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2"
                >
                  <Languages className="w-4 h-4" />
                  <span>{language === 'hi' ? 'हिंदी' : 'English'}</span>
                </Button>
              </div>

              {/* Voice Visualizer */}
              <div className="text-center mb-6">
                <motion.div
                  className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-colors ${
                    isListening 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                      : isSpeaking 
                        ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                        : 'bg-gradient-to-r from-gray-300 to-gray-400'
                  }`}
                  animate={isListening || isSpeaking ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 1, repeat: isListening || isSpeaking ? Infinity : 0 }}
                >
                  {isListening ? (
                    <Mic className="w-12 h-12 text-white" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-12 h-12 text-white" />
                  ) : (
                    <MicOff className="w-12 h-12 text-white" />
                  )}
                </motion.div>
                
                <p className="text-sm text-gray-600 mt-3">
                  {isListening 
                    ? (language === 'hi' ? 'सुन रहा हूँ...' : 'Listening...')
                    : isSpeaking 
                      ? (language === 'hi' ? 'बोल रहा हूँ...' : 'Speaking...')
                      : (language === 'hi' ? 'माइक बटन दबाएं' : 'Tap mic to speak')
                  }
                </p>
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    {language === 'hi' ? 'आपने कहा:' : 'You said:'}
                  </p>
                  <p className="text-blue-700">{transcript}</p>
                </div>
              )}

              {/* AI Response */}
              {response && (
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-green-800 font-medium mb-1">
                    {language === 'hi' ? 'AI सहायक:' : 'AI Assistant:'}
                  </p>
                  <p className="text-green-700">{response}</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-red-800 font-medium mb-1">Error:</p>
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!isSupported || isSpeaking}
                  className={`${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white px-8 py-3 rounded-full`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      {language === 'hi' ? 'रोकें' : 'Stop'}
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      {language === 'hi' ? 'बोलें' : 'Speak'}
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Questions */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-2">
                  {language === 'hi' ? 'उदाहरण प्रश्न:' : 'Sample questions:'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(language === 'hi' ? [
                    'मिट्टी कैसे सुधारें?',
                    'फसल की बीमारी का इलाज?',
                    'बारिश कब होगी?'
                  ] : [
                    'How to improve soil health?',
                    'Crop disease treatment?',
                    'Weather forecast?'
                  ]).map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-600 hover:text-green-600"
                      onClick={() => processVoiceCommand(question)}
                      disabled={isListening || isSpeaking}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Browser Support Warning */}
              {!isSupported && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {language === 'hi' 
                      ? 'आपका ब्राउज़र वॉइस रिकॉग्निशन को सपोर्ट नहीं करता। कृपया Chrome या Edge का उपयोग करें।'
                      : 'Your browser does not support voice recognition. Please use Chrome or Edge.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}