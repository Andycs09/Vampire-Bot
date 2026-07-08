'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User, Phone, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { geminiService } from '@/services/gemini';
import { governmentCasesService } from '@/services/governmentCases';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function AskAIPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I\'m your agricultural AI assistant. I have access to your land data and can help with farming questions. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationMessage, setEscalationMessage] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getLandContext = () => {
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    if (lands.length > 0) {
      const land = lands[0];
      return `Farmer's land: ${land.size || 5} acres in ${land.district}, ${land.state}. Irrigation: ${land.irrigationType || 'borewell'}.`;
    }
    return 'No land data available.';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = getLandContext();

      // Lightweight client-side keyword check to avoid non-farming queries
      const farmingKeywords = ['crop','fertil','weather','irrig','pest','soil','harvest','yield','farm','field','livestock','seed','sowing','fertilizer','pesticide','manure','weed','spray','plant','harvest','plough'];
      const lower = input.toLowerCase();
      const isFarming = farmingKeywords.some((k) => lower.includes(k));

      if (!isFarming) {
        const nonFarmReply: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: "Hey! I only help with farming topics — crops, soil, pests, irrigation, weather, and farm tasks. Ask me about those and I'll help in a friendly, casual way!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, nonFarmReply]);
        setIsLoading(false);
        return;
      }

      // System prompt to instruct the model: casual tone, farm-only answers, short
      const systemPrompt = `You are an expert, friendly agricultural assistant. Answer ONLY farm-related questions in a casual, empathetic tone. If the user's question is not about farming, politely refuse and suggest relevant topics. Keep answers short (2-3 sentences).`;

      const fullPrompt = `${systemPrompt}\n\nContext: ${context}\n\nFarmer's question: ${input}\n\nProvide a helpful, concise answer in 2-3 sentences.`;

      const response = await geminiService.processVoiceQuery(fullPrompt, 'en');

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'I apologize, I\'m having trouble responding right now. Would you like to speak with a human officer instead?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview(reader.result as string);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleEscalateToHuman = () => {
    if (!escalationMessage.trim()) return;

    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const lands = JSON.parse(localStorage.getItem('lands') || '[]');
    const primaryLand = Array.isArray(lands) ? lands[0] : null;

    const farmerProfile = {
      id: currentUser?.id || `farmer_${Date.now()}`,
      name: currentUser?.name || 'Farmer',
      phone: currentUser?.phone || '+91',
      village: currentUser?.village || primaryLand?.village || 'Unknown',
      district: currentUser?.district || primaryLand?.district || 'Unknown',
      state: currentUser?.state || primaryLand?.state || 'Unknown',
      userType: currentUser?.userType || 'landowner',
    };

    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (!registeredUsers.some((user: any) => user.id === farmerProfile.id)) {
      registeredUsers.push(farmerProfile);
      localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
    }

    const newCase = governmentCasesService.addCase({
      farmerId: farmerProfile.id,
      farmerName: farmerProfile.name,
      farmerPhone: farmerProfile.phone,
      farmerLocation: {
        village: farmerProfile.village,
        district: farmerProfile.district,
        state: farmerProfile.state,
        coordinates: primaryLand?.coordinates?.[0]
          ? {
              lat: primaryLand.coordinates[0].lat || 12.3,
              lng: primaryLand.coordinates[0].lng || 76.6,
            }
          : undefined,
      },
      cropType: primaryLand?.cropType || primaryLand?.crop || 'Mixed Crop',
      issueDescription: escalationMessage,
      imageUrl: attachmentPreview || undefined,
      caseType: 'farmer_reported',
      severity: escalationMessage.length > 120 ? 'high' : 'medium',
      status: 'pending',
      priority: escalationMessage.length > 120 ? 3 : 2,
    });

    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'ai',
      content: '✅ Your message has been sent to a government agricultural officer. They will review your case and respond soon.',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setShowEscalation(false);
    setEscalationMessage('');
    setAttachmentPreview(null);
    setAttachmentName('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('government-cases-updated'));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold">Ask AI</h1>
            <p className="text-xs text-gray-600">Powered by Gemini AI</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEscalation(true)}
          className="text-blue-600"
        >
          <Phone className="w-4 h-4 mr-2" />
          Talk to Human Officer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'user' ? 'bg-green-600' : 'bg-purple-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-600">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about crops, weather, fertilizers..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showEscalation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Contact Human Officer</h2>
              <p className="text-sm text-gray-600 mb-4">
                Describe your issue and a government agricultural officer will review it.
              </p>
              <textarea
                value={escalationMessage}
                onChange={(e) => setEscalationMessage(e.target.value)}
                placeholder="Describe your farming issue or question..."
                className="w-full border rounded-lg p-3 mb-4 min-h-30"
              />
              <label className="flex items-center gap-2 text-sm text-blue-600 mb-4 cursor-pointer">
                <Camera className="w-4 h-4" />
                <span>{attachmentName ? `Attached: ${attachmentName}` : 'Attach a crop or land photo (optional)'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
              {attachmentPreview && (
                <img src={attachmentPreview} alt="attachment preview" className="w-full h-36 object-cover rounded-lg mb-4" />
              )}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEscalation(false);
                    setEscalationMessage('');
                    setAttachmentPreview(null);
                    setAttachmentName('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEscalateToHuman}
                  disabled={!escalationMessage.trim()}
                  className="flex-1 bg-blue-600"
                >
                  Send to Officer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
