'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  TrendingUp, 
  ShoppingCart, 
  Calculator,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Bot,
  ArrowLeft,
  Store,
  Clock,
  IndianRupee
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { walletService } from '@/services/wallet';

type TabType = 'wallet' | 'transactions' | 'calculator' | 'marketplace' | 'inventory';

export default function FinancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [aiPurchaseLimit, setAiPurchaseLimit] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState<string | null>(null);
  const [inventoryFocus, setInventoryFocus] = useState('');

  // Wallet operations
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newLimit, setNewLimit] = useState('');

  // Calculator state
  const [calcInputs, setCalcInputs] = useState({
    maxBudget: '',
    sowingDate: '',
    harvestDate: '',
    expectedYield: '',
    quantitySold: '',
    salePrice: '',
    pesticideUsed: '',
    fertilizerUsed: '',
    seedsUsed: '',
    pesticideStock: '',
    fertilizerStock: '',
    seedsStock: ''
  });

  useEffect(() => {
    loadFinanceData();

    const requestedTab = sessionStorage.getItem('voice_requested_finance_tab');
    if (requestedTab) {
      setActiveTab(requestedTab as TabType);
      sessionStorage.removeItem('voice_requested_finance_tab');
    }

    const requestedCrop = sessionStorage.getItem('voice_requested_crop');
    if (requestedCrop) {
      setInventoryFocus(requestedCrop.toLowerCase());
      sessionStorage.removeItem('voice_requested_crop');
    }
  }, []);

  const loadFinanceData = () => {
    const wallet = walletService.getWallet();
    setWalletBalance(wallet.balance);
    setAiPurchaseLimit(wallet.aiPurchaseLimit);
    setNewLimit(wallet.aiPurchaseLimit.toString());

    const txns = walletService.getTransactions();
    setTransactions(txns);

    const vendorList = walletService.getVendors();
    setVendors(vendorList);
  };

  const handleAddMoney = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      walletService.addMoney(amount);
      setWalletBalance(prev => prev + amount);
      setAddAmount('');
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= walletBalance) {
      walletService.withdraw(amount);
      setWalletBalance(prev => prev - amount);
      setWithdrawAmount('');
    }
  };

  const handleSetLimit = () => {
    const limit = parseFloat(newLimit);
    if (limit >= 0) {
      walletService.setAIPurchaseLimit(limit);
      setAiPurchaseLimit(limit);
    }
  };

  const handleApproveAI = (transactionId: string) => {
    if (isProcessingTransaction) return;
    setIsProcessingTransaction(transactionId);
    
    try {
      const result = walletService.approveTransaction(transactionId, 'ai');
      if (result.success) {
        setWalletBalance(result.newBalance);
        loadFinanceData();
        alert(`Transaction approved! New balance: ${formatCurrency(result.newBalance)}`);
      } else {
        alert(result.message || 'Transaction failed');
      }
    } finally {
      setIsProcessingTransaction(null);
    }
  };

  const handleApproveHuman = (transactionId: string) => {
    if (isProcessingTransaction) return;
    setIsProcessingTransaction(transactionId);
    
    try {
      const result = walletService.approveTransaction(transactionId, 'human');
      if (result.success) {
        setWalletBalance(result.newBalance);
        loadFinanceData();
        alert(`Transaction approved! New balance: ${formatCurrency(result.newBalance)}`);
      } else {
        alert(result.message || 'Transaction failed');
      }
    } finally {
      setIsProcessingTransaction(null);
    }
  };

  const handleCancelTransaction = (transactionId: string) => {
    if (isProcessingTransaction) return;
    setIsProcessingTransaction(transactionId);
    
    try {
      walletService.cancelTransaction(transactionId);
      loadFinanceData();
      alert('Transaction cancelled');
    } finally {
      setIsProcessingTransaction(null);
    }
  };

  const handleOrder = (vendor: any, product: any) => {
    const result = walletService.createManualOrder(vendor.name, product.name, product.price);
    if (result.success) {
      setWalletBalance(result.newBalance);
      loadFinanceData();
      alert(`Order placed successfully! New balance: ${formatCurrency(result.newBalance)}`);
    } else {
      alert(result.message);
    }
  };

  const handleRunAIAgent = async () => {
    setIsRunningAI(true);
    try {
      const result = await walletService.runAIWalletAgent();
      setWalletBalance(result.newBalance);
      loadFinanceData();
      alert(result.summary || 'AI wallet review completed!');
    } catch (error) {
      console.error('AI Agent error:', error);
      alert('AI agent failed. Please try again.');
    } finally {
      setIsRunningAI(false);
    }
  };

  const calculateFarmingMetrics = () => {
    const maxBudget = parseFloat(calcInputs.maxBudget) || 0;
    const expectedYield = parseFloat(calcInputs.expectedYield) || 0;
    const quantitySold = parseFloat(calcInputs.quantitySold) || 0;
    const salePrice = parseFloat(calcInputs.salePrice) || 0;
    const pesticideUsed = parseFloat(calcInputs.pesticideUsed) || 0;
    const fertilizerUsed = parseFloat(calcInputs.fertilizerUsed) || 0;
    const seedsUsed = parseFloat(calcInputs.seedsUsed) || 0;

    // Estimate costs (rough approximation)
    const pesticideCost = pesticideUsed * 450; // ₹450 per L
    const fertilizerCost = fertilizerUsed * 24; // ₹24 per kg
    const seedsCost = seedsUsed * 80; // ₹80 per kg
    const totalExpense = Math.min(pesticideCost + fertilizerCost + seedsCost, maxBudget);

    const totalRevenue = quantitySold * salePrice;
    const estimatedProfit = (expectedYield * salePrice) - totalExpense;
    const actualProfit = totalRevenue - totalExpense;

    return {
      totalExpense,
      totalRevenue,
      estimatedProfit,
      actualProfit
    };
  };

  const metrics = calculateFarmingMetrics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Finance Center</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(walletBalance)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'wallet'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            Wallet
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'transactions'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'calculator'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="w-4 h-4 inline mr-2" />
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'marketplace'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4 inline mr-2" />
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'inventory'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4 inline mr-2" />
            Inventory
          </button>
        </div>

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    <span>Wallet Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-4">
                    {formatCurrency(walletBalance)}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Add Money</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Amount in ₹"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                        />
                        <Button onClick={handleAddMoney} className="bg-green-600">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Withdraw Money</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Amount in ₹"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <Button onClick={handleWithdraw} variant="outline">
                          <Minus className="w-4 h-4 mr-1" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <span>AI Wallet Agent</span>
                  </CardTitle>
                  <CardDescription>Configure AI auto-purchase limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>AI Auto-Purchase Limit (per transaction)</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Amount in ₹"
                        value={newLimit}
                        onChange={(e) => setNewLimit(e.target.value)}
                      />
                      <Button onClick={handleSetLimit} variant="outline">
                        Set
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Current limit: <span className="font-semibold">{formatCurrency(aiPurchaseLimit)}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleRunAIAgent}
                      disabled={isRunningAI}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      {isRunningAI ? 'Running AI Review...' : 'Run AI Wallet Review'}
                    </Button>
                    <p className="text-xs text-gray-600 mt-2">
                      AI will check stock levels and recommend purchases within your limit
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All wallet transactions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No transactions yet</p>
                  ) : (
                    transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{txn.item}</h4>
                            <p className="text-sm text-gray-600">{txn.vendor}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(txn.cost)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(txn.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              txn.status.includes('Completed') || txn.status.includes('AI Approved')
                                ? 'bg-green-100 text-green-800'
                                : txn.status.includes('Cancelled')
                                ? 'bg-red-100 text-red-800'
                                : txn.status.includes('Pending')
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {txn.status}
                          </span>

                          {(txn.status.includes('Pending') || txn.status.includes('AI Recommended')) && 
                           !txn.status.includes('Completed') && 
                           !txn.status.includes('Cancelled') && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveAI(txn.id)}
                                disabled={isProcessingTransaction === txn.id}
                                className="text-purple-600"
                              >
                                <Bot className="w-3 h-3 mr-1" />
                                {isProcessingTransaction === txn.id ? 'Processing...' : 'Approve (AI)'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApproveHuman(txn.id)}
                                disabled={isProcessingTransaction === txn.id}
                                className="bg-green-600"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {isProcessingTransaction === txn.id ? 'Processing...' : 'Approve (Human)'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelTransaction(txn.id)}
                                disabled={isProcessingTransaction === txn.id}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>

                        {txn.reasoning && (
                          <p className="text-xs text-gray-600 mt-2 italic">{txn.reasoning}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <Card>
            <CardHeader>
              <CardTitle>Farming Calculator</CardTitle>
              <CardDescription>Calculate expenses, revenue, and profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Inputs</h3>
                  
                  <div>
                    <Label>Max Input Budget (₹)</Label>
                    <Input
                      type="number"
                      value={calcInputs.maxBudget}
                      onChange={(e) => setCalcInputs({...calcInputs, maxBudget: e.target.value})}
                      placeholder="e.g. 25000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sowing Date</Label>
                      <Input
                        type="date"
                        value={calcInputs.sowingDate}
                        onChange={(e) => setCalcInputs({...calcInputs, sowingDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Harvest Date</Label>
                      <Input
                        type="date"
                        value={calcInputs.harvestDate}
                        onChange={(e) => setCalcInputs({...calcInputs, harvestDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expected Yield (kg)</Label>
                      <Input
                        type="number"
                        value={calcInputs.expectedYield}
                        onChange={(e) => setCalcInputs({...calcInputs, expectedYield: e.target.value})}
                        placeholder="e.g. 2500"
                      />
                    </div>
                    <div>
                      <Label>Quantity Sold (kg)</Label>
                      <Input
                        type="number"
                        value={calcInputs.quantitySold}
                        onChange={(e) => setCalcInputs({...calcInputs, quantitySold: e.target.value})}
                        placeholder="e.g. 2000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Sale Price per kg (₹)</Label>
                    <Input
                      type="number"
                      value={calcInputs.salePrice}
                      onChange={(e) => setCalcInputs({...calcInputs, salePrice: e.target.value})}
                      placeholder="e.g. 18"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Input Usage & Stock</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Pesticide Used (L)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={calcInputs.pesticideUsed}
                          onChange={(e) => setCalcInputs({...calcInputs, pesticideUsed: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Pesticide Stock (L)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={calcInputs.pesticideStock}
                          onChange={(e) => setCalcInputs({...calcInputs, pesticideStock: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Fertilizer Used (kg)</Label>
                        <Input
                          type="number"
                          value={calcInputs.fertilizerUsed}
                          onChange={(e) => setCalcInputs({...calcInputs, fertilizerUsed: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Fertilizer Stock (kg)</Label>
                        <Input
                          type="number"
                          value={calcInputs.fertilizerStock}
                          onChange={(e) => setCalcInputs({...calcInputs, fertilizerStock: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Seeds Used (kg)</Label>
                        <Input
                          type="number"
                          value={calcInputs.seedsUsed}
                          onChange={(e) => setCalcInputs({...calcInputs, seedsUsed: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Seeds Stock (kg)</Label>
                        <Input
                          type="number"
                          value={calcInputs.seedsStock}
                          onChange={(e) => setCalcInputs({...calcInputs, seedsStock: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outputs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Computed Results</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Expense</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(metrics.totalExpense)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(metrics.totalRevenue)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Estimated Profit (Expected Yield)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(metrics.estimatedProfit)}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-green-700 font-medium">Actual Profit (After Selling)</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(metrics.actualProfit)}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Revenue - Expenses = Profit
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Crop Inventory</h2>
              <p className="text-gray-600">Track harvested crops and calculate profits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Inventory Items */}
              <Card className={inventoryFocus.includes('rice') ? 'ring-2 ring-green-500' : ''}>
                <CardHeader>
                  <CardTitle>Rice (BPT 5204)</CardTitle>
                  <CardDescription>Kharif Season 2025</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span className="font-semibold">250 kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Production Cost:</span>
                      <span className="text-red-600 font-semibold">{formatCurrency(15000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Price:</span>
                      <span className="text-green-600 font-semibold">₹18/kg</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Est. Revenue:</span>
                      <span className="font-bold">{formatCurrency(4500)}</span>
                    </div>
                    <Button size="sm" className="w-full">Mark as Sold</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className={inventoryFocus.includes('wheat') ? 'ring-2 ring-green-500' : ''}>
                <CardHeader>
                  <CardTitle>Wheat (HD 2967)</CardTitle>
                  <CardDescription>Rabi Season 2024-25</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span className="font-semibold">180 kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Production Cost:</span>
                      <span className="text-red-600 font-semibold">{formatCurrency(12000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Price:</span>
                      <span className="text-green-600 font-semibold">₹22/kg</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Est. Revenue:</span>
                      <span className="font-bold">{formatCurrency(3960)}</span>
                    </div>
                    <Button size="sm" className="w-full bg-green-600">Mark as Sold</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-6 text-center">
                  <Plus className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 mb-4">Add New Harvest</p>
                  <Button variant="outline">Add Crop</Button>
                </CardContent>
              </Card>
            </div>

            {/* Labor & Expenses Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Production Expenses Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Labor Costs</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ravi Kumar - 15 days × ₹300</span>
                        <span>{formatCurrency(4500)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Suresh - 12 days × ₹280</span>
                        <span>{formatCurrency(3360)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Total Labor:</span>
                        <span>{formatCurrency(7860)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Input Costs</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Seeds & Fertilizer</span>
                        <span>{formatCurrency(8200)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pesticides</span>
                        <span>{formatCurrency(2800)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage & Transport</span>
                        <span>{formatCurrency(1500)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Total Inputs:</span>
                        <span>{formatCurrency(12500)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Marketplace</h2>
              <p className="text-gray-600">Order farm inputs from trusted vendors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <CardDescription className="text-sm">{vendor.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vendor.products.map((product: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCurrency(product.price)}</p>
                            <Button
                              size="sm"
                              onClick={() => handleOrder(vendor, product)}
                              className="mt-1"
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Order
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
