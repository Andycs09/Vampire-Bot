'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Droplets, Leaf, DollarSign, MessageSquare, ShoppingCart, Zap, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { landMonitoringService } from '@/services/landMonitoring';
import { walletService } from '@/services/wallet';

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'performance' | 'iot' | 'financial' | 'chat' | 'stock'>('performance');
  const [lands, setLands] = useState<any[]>([]);
  const [selectedLand, setSelectedLand] = useState<string>('');
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stockLevels, setStockLevels] = useState<any>({});
  const [iotAnalysisHistory, setIotAnalysisHistory] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadReportsData();

    const requestedTab = sessionStorage.getItem('voice_requested_report_tab');
    if (requestedTab) {
      setActiveTab(requestedTab as any);
      sessionStorage.removeItem('voice_requested_report_tab');
      sessionStorage.removeItem('voice_requested_report');
      return;
    }

    const requestedReport = sessionStorage.getItem('voice_requested_report');
    if (requestedReport) {
      const reportToTab: Record<string, 'performance' | 'financial' | 'chat' | 'stock'> = {
        profit: 'financial',
        health: 'performance',
        water: 'performance',
        general: 'performance'
      };

      setActiveTab(reportToTab[requestedReport] || 'performance');
      sessionStorage.removeItem('voice_requested_report');
    }
  }, []);

  const loadReportsData = () => {
    const storedLands = JSON.parse(localStorage.getItem('lands') || '[]');
    setLands(storedLands);

    if (storedLands.length > 0) {
      const firstLand = storedLands[0];
      setSelectedLand(firstLand.id);
      loadLandReports(firstLand.id);
    }

    // Load financial data
    const txns = walletService.getTransactions();
    setTransactions(txns);

    // Load stock levels
    const stock = walletService.getStockLevels();
    setStockLevels(stock);
  };

  const loadLandReports = (landId: string) => {
    // Load health history
    const historyKey = 'health_history';
    const allHistory = localStorage.getItem(historyKey);
    if (allHistory) {
      const history = JSON.parse(allHistory);
      const landHistory = history[landId] || [];
      setHealthHistory(landHistory);
    }

    // Load IoT analysis history
    const iotHistory = localStorage.getItem(`iot_analysis_${landId}`);
    if (iotHistory) {
      setIotAnalysisHistory(JSON.parse(iotHistory));
    } else {
      setIotAnalysisHistory([]);
    }
  };

  const handleLandChange = (landId: string) => {
    setSelectedLand(landId);
    loadLandReports(landId);
  };

  const handleRunAnalysis = async () => {
    if (!selectedLand) return;
    
    try {
      setIsAnalyzing(true);
      const { iotSensorAnalysisService } = await import('@/services/iotSensorAnalysis');
      await iotSensorAnalysisService.runAnalysisNow(selectedLand);
      
      // Reload IoT analysis history
      loadLandReports(selectedLand);
      
      alert('Sensor analysis completed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please ensure sensors have readings.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerateRecommendation = async () => {
    if (!selectedLand) return;
    
    try {
      // Navigate to analysis page to regenerate recommendation with sensor context
      router.push(`/analysis/${selectedLand}`);
    } catch (error) {
      console.error('Failed to regenerate recommendation:', error);
    }
  };

  // Calculate financial metrics
  const completedTransactions = transactions.filter(t => t.status.includes('Completed'));
  const totalExpenses = completedTransactions.reduce((sum, t) => sum + t.cost, 0);
  const categorizedExpenses = completedTransactions.reduce((acc: any, t) => {
    if (!acc[t.category]) acc[t.category] = 0;
    acc[t.category] += t.cost;
    return acc;
  }, {});

  const expenseData = Object.entries(categorizedExpenses).map(([category, amount]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    amount
  }));

  // Health score trend data
  const healthTrendData = healthHistory.map((h, idx) => ({
    point: `Point ${idx + 1}`,
    score: h.finalScore,
    date: new Date(h.timestamp).toLocaleDateString()
  }));

  // Check if current land has IoT setup
  const currentLandHasIoT = () => {
    if (!selectedLand) return false;
    const iotSetup = localStorage.getItem(`iot_setup_${selectedLand}`);
    if (!iotSetup) return false;
    const setup = JSON.parse(iotSetup);
    return setup.enabledSensors && setup.enabledSensors.length > 0;
  };

  const latestIotAnalysis = iotAnalysisHistory.length > 0 ? iotAnalysisHistory[0] : null;
  const needsRecommendationReview = latestIotAnalysis && !latestIotAnalysis.analysisResult.recommendation_still_valid;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="ml-4 text-xl font-bold">Reports & Analytics</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Land Selector */}
        {lands.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedLand}
              onChange={(e) => handleLandChange(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              {lands.map(land => (
                <option key={land.id} value={land.id}>
                  {land.district}, {land.state} - {land.size} acres
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'performance'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('iot')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'iot'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            IoT Sensor Analysis
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'financial'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Financial
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'stock'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Stock & Usage
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'chat'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Chat History
          </button>
        </div>

        {/* IoT Sensor Analysis Tab */}
        {activeTab === 'iot' && (
          <div className="space-y-6">
            {!currentLandHasIoT() ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">IoT Sensors Not Configured</h3>
                  <p className="text-gray-600 mb-6">
                    This land parcel is not using IoT sensor monitoring. 
                    Switch to IoT mode to enable sensor analysis.
                  </p>
                  <Button 
                    onClick={() => router.push(`/analysis/${selectedLand}`)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Switch to IoT Mode
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Recommendation Review Banner */}
                {needsRecommendationReview && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-900">Recommendation Review Required</h3>
                        <p className="text-orange-800 mt-1">
                          Your current crop recommendation may need review based on recent sensor data.
                        </p>
                        <div className="flex space-x-3 mt-4">
                          <Button
                            size="sm"
                            onClick={handleRegenerateRecommendation}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Regenerate Recommendation
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveTab('performance')}
                          >
                            View Current Analysis
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      <span>Sensor Analysis Controls</span>
                    </CardTitle>
                    <CardDescription>
                      Run analysis on your IoT sensor data every 3 days or manually
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {isAnalyzing ? 'Analyzing...' : 'Run Analysis Now'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/iot-setup?landId=${selectedLand}`)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Sensors
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Timeline</CardTitle>
                    <CardDescription>Historical sensor analysis results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {iotAnalysisHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No sensor analysis runs yet</p>
                        <p className="text-sm">Run your first analysis to see results here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {iotAnalysisHistory.map((analysis) => (
                          <div key={analysis.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {new Date(analysis.timestamp).toLocaleDateString()} - 
                                  {new Date(analysis.timestamp).toLocaleTimeString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {analysis.sensorReadings.length} sensor readings analyzed
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  analysis.analysisResult.recommendation_still_valid
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {analysis.analysisResult.recommendation_still_valid ? 'Valid' : 'Needs Review'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {analysis.analysisResult.confidence}% confidence
                                </span>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <p className="text-sm text-gray-800">
                                {analysis.analysisResult.sensor_summary}
                              </p>
                            </div>

                            {analysis.analysisResult.concerns.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-900">Concerns Detected:</h4>
                                {analysis.analysisResult.concerns.map((concern: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded border-l-4 text-sm ${
                                      concern.severity === 'high'
                                        ? 'border-red-500 bg-red-50 text-red-800'
                                        : concern.severity === 'medium'
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                                        : 'border-blue-500 bg-blue-50 text-blue-800'
                                    }`}
                                  >
                                    <p className="font-medium">
                                      {concern.sensor}: {concern.reading}
                                    </p>
                                    <p>{concern.issue}</p>
                                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium uppercase ${
                                      concern.severity === 'high' ? 'bg-red-200 text-red-800' :
                                      concern.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                      'bg-blue-200 text-blue-800'
                                    }`}>
                                      {concern.severity} Priority
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {analysis.analysisResult.suggested_adjustment && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <h4 className="font-medium text-blue-900">Suggested Action:</h4>
                                <p className="text-sm text-blue-800 mt-1">
                                  {analysis.analysisResult.suggested_adjustment}
                                </p>
                              </div>
                            )}

                            {analysis.analysisResult.concerns.length === 0 && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">All sensor readings within healthy ranges</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Health</p>
                      <p className="text-3xl font-bold text-green-600">
                        {healthHistory.length > 0 ? healthHistory[healthHistory.length - 1].finalScore : 94}
                      </p>
                    </div>
                    <Leaf className="w-12 h-12 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Productivity</p>
                      <p className="text-3xl font-bold text-blue-600">92%</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Water Efficiency</p>
                      <p className="text-3xl font-bold text-cyan-600">88%</p>
                    </div>
                    <Droplets className="w-12 h-12 text-cyan-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {healthHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Health Score Trend</CardTitle>
                  <CardDescription>Historical crop health performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={healthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="point" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(totalExpenses)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {completedTransactions.length} transactions
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Wallet Balance</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(walletService.getWallet().balance)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.slice(0, 10).map((txn) => (
                    <div key={txn.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{txn.item}</p>
                        <p className="text-xs text-gray-600">{txn.vendor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(txn.cost)}</p>
                        <p className="text-xs text-gray-500">{new Date(txn.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Stock Levels</CardTitle>
                <CardDescription>Farm inputs inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Seeds</p>
                    <p className="text-4xl font-bold text-green-700">{stockLevels.seeds || 15}</p>
                    <p className="text-sm text-gray-600 mt-1">kg</p>
                  </div>
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Pesticide</p>
                    <p className="text-4xl font-bold text-blue-700">{stockLevels.pesticide || 2.5}</p>
                    <p className="text-sm text-gray-600 mt-1">liters</p>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Fertilizer</p>
                    <p className="text-4xl font-bold text-purple-700">{stockLevels.fertilizer || 45}</p>
                    <p className="text-sm text-gray-600 mt-1">kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedTransactions.filter(t => t.category !== 'tool').map((txn) => (
                    <div key={txn.id} className="flex justify-between items-center p-3 border-l-4 border-green-500 bg-green-50">
                      <div>
                        <p className="font-medium text-gray-900">{txn.item}</p>
                        <p className="text-xs text-gray-600">{new Date(txn.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">{txn.quantity}</p>
                        <p className="text-xs text-gray-500">{txn.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat History Tab */}
        {activeTab === 'chat' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>AI Chat History</span>
              </CardTitle>
              <CardDescription>Full conversation history with AI assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No chat history yet</p>
                <Button onClick={() => router.push('/ask-ai')} className="bg-purple-600">
                  Start Chat with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
