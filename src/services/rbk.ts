import { voiceService } from './voice';

interface RbkPurchaseRequest {
  farmerId: string;
  cropName: string;
  quantity: number;
  estimatedCost: number;
  landId: string;
  requestType: 'seeds' | 'fertilizer' | 'pesticide' | 'equipment';
}

interface Wallet {
  userId: string;
  balance: number;
  transactions: Array<{
    id: string;
    date: Date;
    amount: number;
    description: string;
    type: 'credit' | 'debit';
    category: string;
  }>;
}

class RbkService {
  // Get current wallet balance
  getWalletBalance(userId: string): Wallet {
    const walletData = localStorage.getItem(`wallet_${userId}`);
    
    if (walletData) {
      return JSON.parse(walletData);
    }

    // Create new wallet with demo balance
    const newWallet: Wallet = {
      userId,
      balance: 50000, // Demo balance of ₹50,000
      transactions: [
        {
          id: 'init_1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          amount: 50000,
          description: 'Initial wallet balance',
          type: 'credit',
          category: 'system'
        }
      ]
    };

    this.saveWallet(newWallet);
    return newWallet;
  }

  // Save wallet data
  private saveWallet(wallet: Wallet): void {
    localStorage.setItem(`wallet_${wallet.userId}`, JSON.stringify(wallet));
  }

  // Process RBK purchase with voice confirmation
  async processPurchaseWithVoiceConfirmation(
    request: RbkPurchaseRequest,
    language: 'en' | 'hi' = 'en'
  ): Promise<{ success: boolean; message: string; escalationId?: string }> {
    try {
      const wallet = this.getWalletBalance(request.farmerId);

      // Check sufficient balance
      if (wallet.balance < request.estimatedCost) {
        return {
          success: false,
          message: language === 'hi' 
            ? 'पर्याप्त राशि नहीं है। कृपया अपना बैलेंस चेक करें।'
            : 'Insufficient balance. Please check your wallet.'
        };
      }

      // Voice confirmation prompt
      const confirmationPrompt = language === 'hi'
        ? `क्या आप ${request.cropName} के लिए ₹${request.estimatedCost} का ऑर्डर देना चाहते हैं? कृपया हाँ या ना कहें।`
        : `Do you want to place an order for ${request.cropName} worth ₹${request.estimatedCost}? Please say yes or no.`;

      // Speak the confirmation prompt
      await voiceService.speak(confirmationPrompt, language);

      // Get voice confirmation
      const isConfirmed = await voiceService.getVoiceConfirmation(confirmationPrompt, language);

      if (!isConfirmed) {
        return {
          success: false,
          message: language === 'hi' 
            ? 'ऑर्डर रद्द कर दिया गया।'
            : 'Order cancelled by user.'
        };
      }

      // Process the purchase
      const escalationId = await this.createRbkEscalation(request);
      
      // Deduct amount from wallet
      await this.deductFromWallet(request.farmerId, request.estimatedCost, request.cropName);

      // Confirmation message
      const successMessage = language === 'hi'
        ? `आपका ऑर्डर सफलतापूर्वक दे दिया गया है। ऑर्डर नंबर: ${escalationId.slice(-6)}`
        : `Your order has been placed successfully. Order ID: ${escalationId.slice(-6)}`;

      await voiceService.speak(successMessage, language);

      return {
        success: true,
        message: successMessage,
        escalationId
      };

    } catch (error) {
      console.error('Error processing RBK purchase:', error);
      
      const errorMessage = language === 'hi'
        ? 'ऑर्डर प्रोसेस करने में समस्या हुई। कृपया दोबारा कोशिश करें।'
        : 'Error processing order. Please try again.';

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Create RBK escalation record
  private async createRbkEscalation(request: RbkPurchaseRequest): Promise<string> {
    const escalation = {
      id: `rbk_${Date.now()}`,
      farmerId: request.farmerId,
      landId: request.landId,
      cropName: request.cropName,
      quantity: request.quantity,
      estimatedCost: request.estimatedCost,
      requestType: request.requestType,
      status: 'pending' as const,
      requestDate: new Date(),
      approvalDate: null,
      notes: `Voice-confirmed purchase request for ${request.cropName}`,
      deliveryAddress: 'Farmer registered address',
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    };

    // Store in localStorage for demo
    const escalations = JSON.parse(localStorage.getItem('rbkEscalations') || '[]');
    escalations.push(escalation);
    localStorage.setItem('rbkEscalations', JSON.stringify(escalations));

    return escalation.id;
  }

  // Deduct amount from wallet
  private async deductFromWallet(userId: string, amount: number, description: string): Promise<void> {
    const wallet = this.getWalletBalance(userId);
    
    wallet.balance -= amount;
    wallet.transactions.push({
      id: `txn_${Date.now()}`,
      date: new Date(),
      amount: -amount,
      description: `Purchase: ${description}`,
      type: 'debit',
      category: 'rbk_purchase'
    });

    this.saveWallet(wallet);
  }

  // Get all RBK escalations for a farmer
  getRbkEscalations(farmerId: string): any[] {
    const escalations = JSON.parse(localStorage.getItem('rbkEscalations') || '[]');
    return escalations.filter((e: any) => e.farmerId === farmerId);
  }

  // Quick purchase without voice confirmation (for testing)
  async quickPurchase(request: RbkPurchaseRequest): Promise<{ success: boolean; message: string; escalationId?: string }> {
    try {
      const wallet = this.getWalletBalance(request.farmerId);

      if (wallet.balance < request.estimatedCost) {
        return {
          success: false,
          message: 'Insufficient wallet balance'
        };
      }

      const escalationId = await this.createRbkEscalation(request);
      await this.deductFromWallet(request.farmerId, request.estimatedCost, request.cropName);

      return {
        success: true,
        message: `Order placed successfully. Order ID: ${escalationId.slice(-6)}`,
        escalationId
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error processing order'
      };
    }
  }

  // Add funds to wallet (for demo purposes)
  addFunds(userId: string, amount: number, description: string = 'Added funds'): void {
    const wallet = this.getWalletBalance(userId);
    
    wallet.balance += amount;
    wallet.transactions.push({
      id: `txn_${Date.now()}`,
      date: new Date(),
      amount: amount,
      description,
      type: 'credit',
      category: 'funding'
    });

    this.saveWallet(wallet);
  }

  // Get spending categories for analytics
  getSpendingCategories(userId: string): { [category: string]: number } {
    const wallet = this.getWalletBalance(userId);
    const categories: { [key: string]: number } = {};

    wallet.transactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
      });

    return categories;
  }
}

export const rbkService = new RbkService();