'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Users, 
  Award,
  ChevronRight,
  Play,
  CheckCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Leaf className="w-8 h-8 text-green-500" />,
      title: "AI Crop Analysis",
      description: "Advanced AI analyzes your land and recommends the most profitable crops"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-500" />,
      title: "Profit Maximization", 
      description: "Data-driven recommendations to increase your agricultural profits by up to 40%"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-500" />,
      title: "Disease Detection",
      description: "Early detection of crop diseases using AI-powered image analysis"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-orange-500" />,
      title: "Voice Assistant",
      description: "Ask questions in Hindi, English, Kannada, Telugu, or Tamil"
    }
  ];

  const benefits = [
    "Increase crop yield by 25-40%",
    "Reduce input costs through precision farming",
    "Get real-time weather and market updates", 
    "Access government schemes and subsidies",
    "Connect with agricultural experts"
  ];

  const testimonials = [
    {
      name: "राज कुमार",
      location: "हरियाणा",
      text: "Fasal Munafa ने मेरी खेती को बदल दिया। अब मैं सही फसल चुनता हूँ और अधिक मुनाफा कमाता हूँ।",
      rating: 5
    },
    {
      name: "Anand Reddy",
      location: "Andhra Pradesh", 
      text: "The AI recommendations helped me switch to sugarcane and doubled my profits this season.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-200/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Fasal Munafa
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-green-600 font-medium transition-colors">How it Works</a>
              <a href="#testimonials" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Testimonials</a>
              <Link href="/auth/login">
                <Button className="shadow-lg hover:shadow-xl pulse-green">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/30 to-cyan-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  🚀 Now Powered by Google AI
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  AI-Powered
                  <span className="gradient-text block"> Agricultural </span>
                  Advisor
                </h1>
                <p className="text-xl text-gray-700 leading-relaxed max-w-2xl">
                  Stop guessing which crops to grow. Our advanced AI analyzes your land, weather patterns, and market data to recommend the most profitable crops and maximize your farming success.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 shadow-2xl hover:shadow-green-500/25">
                    Start Your AI Journey
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 border-2 hover:shadow-lg">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">10K+</div>
                  <div className="text-sm text-gray-600 font-medium">Happy Farmers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">40%</div>
                  <div className="text-sm text-gray-600 font-medium">Profit Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">95%</div>
                  <div className="text-sm text-gray-600 font-medium">AI Accuracy</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-blue-500 rounded-3xl p-8 shadow-2xl hover-lift">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg">AI Recommendation</h3>
                    <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      <span className="text-sm font-semibold">95% Confidence</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover-lift">
                      <span className="font-semibold text-gray-900">🌾 Rice</span>
                      <span className="text-green-600 font-bold text-lg">₹45,000 profit/acre</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover-lift">
                      <span className="font-semibold text-gray-900">🌿 Sugarcane</span>
                      <span className="text-blue-600 font-bold text-lg">₹80,000 profit/acre</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-sm text-gray-600">Recommended planting season: Kharif 2026</div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            The Problem We Solve
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Small and marginal farmers lose billions every year by making crop decisions based on tradition instead of data. 
            They lack access to soil analysis, weather trends, market prices, and agricultural expertise - leading to crop 
            failures and reduced profits.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-6">
                ✨ Powered by Advanced AI
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Powerful AI Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our cutting-edge AI technology provides comprehensive agricultural insights to help you make data-driven decisions that maximize profits
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 card-hover relative overflow-hidden">
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 group-hover:from-green-50/50 to-blue-50/0 group-hover:to-blue-50/30 transition-all duration-300 rounded-2xl"></div>
                  
                  <div className="relative">
                    <div className="mb-6 p-3 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-green-100 group-hover:to-emerald-100 rounded-xl w-fit transition-all duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Fasal Munafa Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Register Your Land",
                description: "Use Google Maps to mark your land boundaries and provide basic information"
              },
              {
                step: "2", 
                title: "AI Analysis",
                description: "Our AI analyzes satellite data, soil conditions, weather patterns, and market trends"
              },
              {
                step: "3",
                title: "Get Recommendations",
                description: "Receive personalized crop recommendations with profit predictions and farming plans"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Transform Your Farming
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of farmers who have increased their profits with AI-powered insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Maximize Your Profits?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of farmers using AI to make smarter agricultural decisions
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              Start Your AI Journey Today
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="w-8 h-8 text-green-500" />
                <span className="text-xl font-bold">Fasal Munafa</span>
              </div>
              <p className="text-gray-400">
                AI-powered agricultural advisor helping farmers maximize profits through data-driven decisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Crop Recommendations</li>
                <li>Disease Detection</li>
                <li>Weather Insights</li>
                <li>Market Analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>User Guide</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <p>Email: support@fasalmunafa.com</p>
                <p>Phone: +91 98765 43210</p>
                <p>Address: Google Cloud Campus, Bengaluru</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Fasal Munafa. Built with Google Cloud. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}