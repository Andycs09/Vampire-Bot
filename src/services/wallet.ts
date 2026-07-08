import { geminiService } from './gemini';

interface Wallet {
  balance: number;
  aiPurchaseLimit: number;
}

interface Transaction {
  id: string;
  item: string;
  category: 'seeds' | 'pesticide' | 'fertilizer' | 'tool';
  vendor: string;
  quantity: string;
  cost: number;
  status: string;
  timestamp: string;
  reasoning?: string;
}

interface Vendor {
  id: string;
  name: string;
  location: string;
  products: {
    name: string;
    quantity: string;
    price: number;
    category: 'seeds' | 'pesticide' | 'fertilizer' | 'tool';
  }[];
}

interface AIRecommendation {
  needs_purchase: boolean;
  purchases: {
    item: string;
    category: 'seeds' | 'pesticide' | 'fertilizer' | 'tool';
    vendor: string;
    quantity: string;
    cost_inr: number;
    reasoning: string;
  }[];
  summary: string;
}

class WalletService {
  private walletKey = 'farmer_wallet';
  private transactionsKey = 'wallet_transactions';
  private vendorsKey = 'marketplace_vendors';
  private stockKey = 'farm_stock_levels';

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (typeof window === 'undefined') return;

    // Initialize wallet
    if (!localStorage.getItem(this.walletKey)) {
      const initialWallet: Wallet = {
        balance: 15000,
        aiPurchaseLimit: 2000
      };
      localStorage.setItem(this.walletKey, JSON.stringify(initialWallet));
    }

    // Initialize transactions with seed data
    if (!localStorage.getItem(this.transactionsKey)) {
      const seedTransactions: Transaction[] = [
        {
          id: '1',
          item: 'DAP Fertilizer 50kg',
          category: 'fertilizer',
          vendor: 'Krishna Agro Store',
          quantity: '50kg',
          cost: 1200,
          status: 'Completed — Manual Order',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          item: 'Stem borer pesticide',
          category: 'pesticide',
          vendor: 'Rythu Seva Kendra',
          quantity: '300ml',
          cost: 450,
          status: 'Completed — AI Approved',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          reasoning: 'Stock running low, needed for current crop cycle'
        },
        {
          id: '3',
          item: 'Urea Fertilizer 25kg',
          category: 'fertilizer',
          vendor: 'Farmer\'s Choice Store',
          quantity: '25kg',
          cost: 600,
          status: 'Pending Approval',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          item: 'Rice Seeds (BPT 5204)',
          category: 'seeds',
          vendor: 'Seed Corporation',
          quantity: '20kg',
          cost: 1600,
          status: 'Completed — Human Approved',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          item: 'NPK Complex 50kg',
          category: 'fertilizer',
          vendor: 'Krishna Agro Store',
          quantity: '50kg',
          cost: 1400,
          status: 'Completed — Manual Order',
          timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          item: 'Leaf folder control',
          category: 'pesticide',
          vendor: 'Rythu Seva Kendra',
          quantity: '500ml',
          cost: 650,
          status: 'Completed — AI Approved',
          timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          reasoning: 'Preventive measure for leaf folder infestation during monsoon'
        },
        {
          id: '7',
          item: 'Hand Spray Pump',
          category: 'tool',
          vendor: 'Farmer\'s Choice Store',
          quantity: '1 unit',
          cost: 850,
          status: 'Completed — Human Approved',
          timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '8',
          item: 'Organic Compost',
          category: 'fertilizer',
          vendor: 'Agri Tech Supplies',
          quantity: '100kg',
          cost: 800,
          status: 'Completed — Manual Order',
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '9',
          item: 'Bio-pesticide',
          category: 'pesticide',
          vendor: 'Agri Tech Supplies',
          quantity: '1L',
          cost: 950,
          status: 'Completed — AI Approved',
          timestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          reasoning: 'Eco-friendly pest control recommended for organic farming practices'
        },
        {
          id: '10',
          item: 'Fungicide spray',
          category: 'pesticide',
          vendor: 'Rythu Seva Kendra',
          quantity: '250ml',
          cost: 380,
          status: 'Cancelled',
          timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '11',
          item: 'Wheat Seeds (HD 2967)',
          category: 'seeds',
          vendor: 'Seed Corporation',
          quantity: '25kg',
          cost: 2000,
          status: 'AI Recommended — Over Limit',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          reasoning: 'Season preparation for winter sowing, exceeds daily limit'
        },
        {
          id: '12',
          item: 'Weeding Tool Set',
          category: 'tool',
          vendor: 'Farmer\'s Choice Store',
          quantity: '1 set',
          cost: 1200,
          status: 'Completed — Human Approved',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      localStorage.setItem(this.transactionsKey, JSON.stringify(seedTransactions));
    }

    // Initialize vendors
    if (!localStorage.getItem(this.vendorsKey)) {
      const vendors: Vendor[] = [
        {
          id: 'v1',
          name: 'Krishna Agro Store',
          location: 'Mysuru, Karnataka',
          products: [
            { name: 'DAP Fertilizer', quantity: '50kg', price: 1200, category: 'fertilizer' },
            { name: 'Urea Fertilizer', quantity: '25kg', price: 600, category: 'fertilizer' },
            { name: 'NPK Complex', quantity: '50kg', price: 1400, category: 'fertilizer' }
          ]
        },
        {
          id: 'v2',
          name: 'Rythu Seva Kendra',
          location: 'Bangalore, Karnataka',
          products: [
            { name: 'Stem borer pesticide', quantity: '300ml', price: 450, category: 'pesticide' },
            { name: 'Leaf folder control', quantity: '500ml', price: 650, category: 'pesticide' },
            { name: 'Fungicide spray', quantity: '250ml', price: 380, category: 'pesticide' }
          ]
        },
        {
          id: 'v3',
          name: 'Seed Corporation',
          location: 'Mysuru, Karnataka',
          products: [
            { name: 'Rice Seeds (BPT 5204)', quantity: '20kg', price: 1600, category: 'seeds' },
            { name: 'Wheat Seeds (HD 2967)', quantity: '25kg', price: 2000, category: 'seeds' },
            { name: 'Cotton Seeds (Bt)', quantity: '5kg', price: 2500, category: 'seeds' }
          ]
        },
        {
          id: 'v4',
          name: 'Farmer\'s Choice Store',
          location: 'Mandya, Karnataka',
          products: [
            { name: 'Hand Spray Pump', quantity: '1 unit', price: 850, category: 'tool' },
            { name: 'Garden Spade', quantity: '1 unit', price: 450, category: 'tool' },
            { name: 'Weeding Tool Set', quantity: '1 set', price: 1200, category: 'tool' }
          ]
        },
        {
          id: 'v5',
          name: 'Agri Tech Supplies',
          location: 'Bangalore, Karnataka',
          products: [
            { name: 'Organic Compost', quantity: '100kg', price: 800, category: 'fertilizer' },
            { name: 'Bio-pesticide', quantity: '1L', price: 950, category: 'pesticide' }
          ]
        }
      ];
      localStorage.setItem(this.vendorsKey, JSON.stringify(vendors));
    }

    // Initialize stock levels
    if (!localStorage.getItem(this.stockKey)) {
      const stockLevels = {
        seeds: 15, // kg
        pesticide: 2.5, // L
        fertilizer: 45 // kg
      };
      localStorage.setItem(this.stockKey, JSON.stringify(stockLevels));
    }
  }

  getWallet(): Wallet {
    const data = localStorage.getItem(this.walletKey);
    return data ? JSON.parse(data) : { balance: 0, aiPurchaseLimit: 0 };
  }

  addMoney(amount: number): void {
    const wallet = this.getWallet();
    wallet.balance += amount;
    localStorage.setItem(this.walletKey, JSON.stringify(wallet));
  }

  withdraw(amount: number): boolean {
    const wallet = this.getWallet();
    if (amount > wallet.balance) return false;
    wallet.balance -= amount;
    localStorage.setItem(this.walletKey, JSON.stringify(wallet));
    return true;
  }

  setAIPurchaseLimit(limit: number): void {
    const wallet = this.getWallet();
    wallet.aiPurchaseLimit = limit;
    localStorage.setItem(this.walletKey, JSON.stringify(wallet));
  }

  getTransactions(): Transaction[] {
    const data = localStorage.getItem(this.transactionsKey);
    return data ? JSON.parse(data) : [];
  }

  getVendors(): Vendor[] {
    const data = localStorage.getItem(this.vendorsKey);
    return data ? JSON.parse(data) : [];
  }

  getStockLevels() {
    const data = localStorage.getItem(this.stockKey);
    return data ? JSON.parse(data) : { seeds: 0, pesticide: 0, fertilizer: 0 };
  }

  createTransaction(
    item: string,
    category: 'seeds' | 'pesticide' | 'fertilizer' | 'tool',
    vendor: string,
    quantity: string,
    cost: number,
    status: string,
    reasoning?: string
  ): Transaction {
    const transaction: Transaction = {
      id: Date.now().toString(),
      item,
      category,
      vendor,
      quantity,
      cost,
      status,
      timestamp: new Date().toISOString(),
      reasoning
    };

    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    localStorage.setItem(this.transactionsKey, JSON.stringify(transactions));

    return transaction;
  }

  approveTransaction(transactionId: string, approvalType: 'ai' | 'human'): { success: boolean; newBalance: number; message?: string } {
    const wallet = this.getWallet();
    const transactions = this.getTransactions();
    const txnIndex = transactions.findIndex(t => t.id === transactionId);

    if (txnIndex === -1) {
      return { success: false, newBalance: wallet.balance, message: 'Transaction not found' };
    }

    const txn = transactions[txnIndex];
    
    // Check if already processed
    if (txn.status.includes('Completed') || txn.status.includes('Cancelled')) {
      return { success: false, newBalance: wallet.balance, message: 'Transaction already processed' };
    }

    if (txn.cost > wallet.balance) {
      return { success: false, newBalance: wallet.balance, message: 'Insufficient balance' };
    }

    // Deduct balance
    wallet.balance -= txn.cost;
    localStorage.setItem(this.walletKey, JSON.stringify(wallet));

    // Update transaction status
    txn.status = approvalType === 'ai' ? 'Completed — AI Approved' : 'Completed — Human Approved';
    transactions[txnIndex] = txn;
    localStorage.setItem(this.transactionsKey, JSON.stringify(transactions));

    return { success: true, newBalance: wallet.balance };
  }

  cancelTransaction(transactionId: string): void {
    const transactions = this.getTransactions();
    const txnIndex = transactions.findIndex(t => t.id === transactionId);

    if (txnIndex !== -1) {
      // Only cancel if not already processed
      if (!transactions[txnIndex].status.includes('Completed') && !transactions[txnIndex].status.includes('Cancelled')) {
        transactions[txnIndex].status = 'Cancelled';
        localStorage.setItem(this.transactionsKey, JSON.stringify(transactions));
      }
    }
  }

  createManualOrder(vendorName: string, productName: string, price: number): { success: boolean; newBalance: number; message?: string } {
    const wallet = this.getWallet();

    if (price > wallet.balance) {
      return { success: false, newBalance: wallet.balance, message: 'Insufficient balance' };
    }

    // Deduct balance
    wallet.balance -= price;
    localStorage.setItem(this.walletKey, JSON.stringify(wallet));

    // Create transaction
    this.createTransaction(
      productName,
      'tool', // default category for manual orders
      vendorName,
      '1 unit',
      price,
      'Completed — Manual Order'
    );

    return { success: true, newBalance: wallet.balance };
  }

  async runAIWalletAgent(): Promise<{ newBalance: number; summary: string }> {
    const wallet = this.getWallet();
    const stockLevels = this.getStockLevels();
    const vendors = this.getVendors();

    // Get current crop info (mock for now)
    const cropName = 'Rice';
    const daysSincePlanting = 45;

    // Build vendor list for prompt
    const vendorList = vendors.map(v => ({
      name: v.name,
      products: v.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        category: p.category
      }))
    }));

    const userMessage = `Current wallet balance: ₹${wallet.balance}
Auto-purchase limit per transaction: ₹${wallet.aiPurchaseLimit}
Current stock levels:
  - Seeds: ${stockLevels.seeds} kg
  - Pesticide: ${stockLevels.pesticide} L
  - Fertilizer: ${stockLevels.fertilizer} kg
Crop currently growing: ${cropName}, planted ${daysSincePlanting} days ago
Available mock vendors:
${JSON.stringify(vendorList, null, 2)}

Evaluate whether any input is running low relative to what a ${cropName} crop at ${daysSincePlanting} days typically needs, and recommend purchase(s) accordingly. Only recommend items from the vendor list provided.`;

    console.log('🤖 AI Wallet Agent - Running analysis...');
    console.log('📊 Stock levels:', stockLevels);
    console.log('💰 Wallet balance:', wallet.balance);
    console.log('🎯 AI purchase limit:', wallet.aiPurchaseLimit);

    try {
      // Call AI service (Gemini first, then Cohere fallback)
      const recommendation = await this.callAIProcurementAgent(userMessage);

      console.log('✅ AI Recommendation:', recommendation);

      if (!recommendation.needs_purchase) {
        return {
          newBalance: wallet.balance,
          summary: recommendation.summary || 'All stock levels are sufficient.'
        };
      }

      let newBalance = wallet.balance;
      let processedCount = 0;

      // Process each recommended purchase
      for (const purchase of recommendation.purchases) {
        console.log(`📦 Processing purchase: ${purchase.item} for ₹${purchase.cost_inr}`);

        if (purchase.cost_inr <= wallet.aiPurchaseLimit) {
          // Within limit - auto-approve
          if (purchase.cost_inr <= newBalance) {
            newBalance -= purchase.cost_inr;
            this.createTransaction(
              purchase.item,
              purchase.category,
              purchase.vendor,
              purchase.quantity,
              purchase.cost_inr,
              'Completed — AI Approved',
              purchase.reasoning
            );
            processedCount++;
            console.log(`✅ Auto-approved: ${purchase.item}`);
          } else {
            console.log(`⚠️ Insufficient balance for: ${purchase.item}`);
          }
        } else {
          // Over limit - create pending transaction
          this.createTransaction(
            purchase.item,
            purchase.category,
            purchase.vendor,
            purchase.quantity,
            purchase.cost_inr,
            'AI Recommended — Over Limit',
            purchase.reasoning
          );
          console.log(`⚠️ Over limit, pending approval: ${purchase.item}`);
        }
      }

      // Update wallet balance
      const walletData = this.getWallet();
      walletData.balance = newBalance;
      localStorage.setItem(this.walletKey, JSON.stringify(walletData));

      const summaryMessage = processedCount > 0
        ? `${recommendation.summary} ${processedCount} purchase(s) auto-approved.`
        : recommendation.summary;

      return {
        newBalance,
        summary: summaryMessage
      };

    } catch (error) {
      console.error('❌ AI Wallet Agent error:', error);
      throw error;
    }
  }

  private async callAIProcurementAgent(userMessage: string): Promise<AIRecommendation> {
    const systemPrompt = `You are an agricultural procurement assistant for a farmer using the Fasal Munafa app. You manage a mock wallet on the farmer's behalf. Decide whether any farm inputs (seeds, pesticide, fertilizer, tools) need reordering based on current stock levels, and if so, select a specific mock vendor and quantity, respecting the farmer's spending limit.

Respond ONLY with valid JSON, no preamble, no markdown, no explanation outside the JSON. Use this exact schema:

{
  "needs_purchase": true or false,
  "purchases": [
    {
      "item": "string, e.g. 'Stem borer pesticide'",
      "category": "seeds" | "pesticide" | "fertilizer" | "tool",
      "vendor": "string, choose from the vendor list provided",
      "quantity": "string, e.g. '300ml' or '50kg'",
      "cost_inr": number,
      "reasoning": "one sentence, why this purchase is needed now"
    }
  ],
  "summary": "one sentence overall summary for the farmer"
}

If nothing needs to be purchased, return needs_purchase: false, an empty purchases array, and a summary explaining stock is sufficient.`;

    try {
      // Try Gemini first
      const result = await geminiService.processWalletAgent(systemPrompt, userMessage);
      return this.parseAIResponse(result);
    } catch (error) {
      console.error('❌ Gemini failed, using fallback logic:', error);
      
      // Fallback: simple rule-based logic
      return this.generateFallbackRecommendation();
    }
  }

  private parseAIResponse(response: string): AIRecommendation {
    try {
      // Clean response
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      
      // Try to extract JSON if embedded
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : cleaned;
      
      const parsed = JSON.parse(jsonText);
      
      return {
        needs_purchase: parsed.needs_purchase || false,
        purchases: parsed.purchases || [],
        summary: parsed.summary || 'Analysis completed'
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private generateFallbackRecommendation(): AIRecommendation {
    const stockLevels = this.getStockLevels();
    const purchases: any[] = [];

    // Simple rules: if stock is below threshold, recommend purchase
    if (stockLevels.pesticide < 3) {
      purchases.push({
        item: 'Stem borer pesticide',
        category: 'pesticide',
        vendor: 'Rythu Seva Kendra',
        quantity: '300ml',
        cost_inr: 450,
        reasoning: 'Pesticide stock running low, needed for pest control'
      });
    }

    if (stockLevels.fertilizer < 50) {
      purchases.push({
        item: 'DAP Fertilizer',
        category: 'fertilizer',
        vendor: 'Krishna Agro Store',
        quantity: '50kg',
        cost_inr: 1200,
        reasoning: 'Fertilizer stock below recommended level for current growth stage'
      });
    }

    if (stockLevels.seeds < 20) {
      purchases.push({
        item: 'Rice Seeds (BPT 5204)',
        category: 'seeds',
        vendor: 'Seed Corporation',
        quantity: '20kg',
        cost_inr: 1600,
        reasoning: 'Seed stock low, recommend replenishing for next season'
      });
    }

    return {
      needs_purchase: purchases.length > 0,
      purchases,
      summary: purchases.length > 0
        ? `${purchases.length} items need restocking based on current levels`
        : 'All stock levels are sufficient for current crop cycle'
    };
  }
}

export const walletService = new WalletService();
