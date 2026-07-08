# Finance System - AI Wallet Agent & Marketplace

Complete finance management system with wallet, transactions, farming calculator, marketplace, and AI procurement agent.

## Features Implemented

### 1. Finance Page (`/finance`)
Accessible by clicking the "Finance Center" card on the dashboard (replaced "Total Profit This Season").

**Four Main Tabs:**
- 💰 Wallet
- 📜 Transactions
- 🧮 Calculator
- 🏪 Marketplace

---

## A. WALLET TAB

### Current Balance Display
- Shows wallet balance in ₹ (INR)
- Initial mock balance: ₹15,000

### Operations
**Add Money**
- Input amount
- Click "Add" to increase balance
- No real banking integration - mock only

**Withdraw Money**
- Input amount
- Click "Withdraw" to decrease balance
- Validates sufficient balance

**AI Auto-Purchase Limit**
- Settable per-transaction limit (default: ₹2,000)
- AI cannot auto-approve purchases exceeding this limit
- Input new limit and click "Set" to update

### AI Wallet Agent
**"Run AI Wallet Review" Button**
- Manual trigger (no auto-scheduling for demo)
- Checks current stock levels:
  - Seeds (kg)
  - Pesticide (L)
  - Fertilizer (kg)
- Evaluates against crop needs (e.g., Rice at 45 days)
- Calls Gemini API first, falls back to Cohere if quota exceeded
- Both APIs use identical JSON schema

**AI Logic:**
1. If recommended cost ≤ AI purchase limit → Auto-approve (deduct from wallet)
2. If recommended cost > AI purchase limit → Create transaction as "AI Recommended — Over Limit" (do NOT deduct)
3. No separate approval queue - all transactions have 3 action buttons

---

## B. TRANSACTION LIST TAB

### Transaction Display
Each transaction shows:
- Item name (e.g., "DAP Fertilizer 50kg", "Stem borer pesticide")
- Vendor name (e.g., "Krishna Agro Store", "Rythu Seva Kendra")
- Cost in ₹
- Timestamp (date & time)
- Status badge (color-coded)
- AI reasoning (if applicable)

### Status Types
- ✅ **Completed — Manual Order** (green)
- ✅ **Completed — AI Approved** (green)
- ✅ **Completed — Human Approved** (green)
- ⏳ **Pending Approval** (yellow)
- ⚠️ **AI Recommended — Over Limit** (gray)
- ❌ **Cancelled** (red)

### Three Action Buttons (on every transaction)
These are NOT approval gates - just manual controls available anytime:

1. **"Approve (AI)"** - Purple button with bot icon
   - Marks as "Completed — AI Approved"
   - Deducts from wallet balance
   
2. **"Approve (Human)"** - Green button with checkmark
   - Marks as "Completed — Human Approved"
   - Deducts from wallet balance
   
3. **"Cancel"** - Red button with X icon
   - Marks as "Cancelled"
   - Does NOT deduct from balance

**Note:** Buttons only appear on pending transactions. Completed/cancelled transactions show status only.

### Seed Transactions (Pre-loaded Demo Data)
1. DAP Fertilizer 50kg — Krishna Agro Store — ₹1,200 (Completed — Manual Order)
2. Stem borer pesticide 300ml — Rythu Seva Kendra — ₹450 (Completed — AI Approved)
3. Urea Fertilizer 25kg — Farmer's Choice Store — ₹600 (Pending Approval)
4. Rice Seeds (BPT 5204) 20kg — Seed Corporation — ₹1,600 (Completed — Human Approved)

---

## C. FARMING CALCULATOR TAB

### Input Fields
**Budget & Timeline:**
- Max Input Budget (₹)
- Sowing Date (date picker)
- Harvest Date (date picker)

**Yield & Sales:**
- Expected Yield (kg)
- Quantity Sold (kg)
- Sale Price per kg (₹)

**Input Usage:**
- Pesticide Used (L) | Pesticide Stock (L)
- Fertilizer Used (kg) | Fertilizer Stock (kg)
- Seeds Used (kg) | Seeds Stock (kg)

### Computed Outputs (Auto-calculated)
- **Total Expense** (₹) - Red badge
  - Based on usage × estimated costs
  - Pesticide: ₹450/L, Fertilizer: ₹24/kg, Seeds: ₹80/kg
  
- **Total Revenue** (₹) - Blue badge
  - Quantity Sold × Sale Price
  
- **Estimated Profit** (₹) - Green badge
  - Expected Yield × Sale Price - Total Expense
  
- **Actual Profit** (₹) - Large green badge (primary metric)
  - Total Revenue - Total Expense
  - This is the real profit after selling

All calculations happen in real-time as inputs change.

---

## D. MARKETPLACE TAB

### Vendor Grid
5 mock vendors with multiple products each:

**1. Krishna Agro Store** (Mysuru, Karnataka)
- DAP Fertilizer 50kg — ₹1,200
- Urea Fertilizer 25kg — ₹600
- NPK Complex 50kg — ₹1,400

**2. Rythu Seva Kendra** (Bangalore, Karnataka)
- Stem borer pesticide 300ml — ₹450
- Leaf folder control 500ml — ₹650
- Fungicide spray 250ml — ₹380

**3. Seed Corporation** (Mysuru, Karnataka)
- Rice Seeds (BPT 5204) 20kg — ₹1,600
- Wheat Seeds (HD 2967) 25kg — ₹2,000
- Cotton Seeds (Bt) 5kg — ₹2,500

**4. Farmer's Choice Store** (Mandya, Karnataka)
- Hand Spray Pump 1 unit — ₹850
- Garden Spade 1 unit — ₹450
- Weeding Tool Set 1 set — ₹1,200

**5. Agri Tech Supplies** (Bangalore, Karnataka)
- Organic Compost 100kg — ₹800
- Bio-pesticide 1L — ₹950

### Order Button
- Click "Order" on any product
- Instantly deducts price from wallet balance
- Creates transaction marked "Completed — Manual Order"
- Shows success/error alert
- Validates sufficient balance before order

---

## E. DAILY AI WALLET AGENT

### How It Works

**Trigger:** Click "Run AI Wallet Review" button in Wallet tab

**Agent Flow:**
1. Reads current wallet balance
2. Reads AI auto-purchase limit
3. Reads stock levels (seeds, pesticide, fertilizer)
4. Gets crop info (Rice at 45 days - mocked for demo)
5. Loads vendor list with all products and prices

**AI API Call (Identical for Gemini & Cohere):**

```typescript
System Prompt:
"You are an agricultural procurement assistant...
Respond ONLY with valid JSON, no markdown, no explanation.
Use this exact schema: {...}"

User Message:
"Current wallet balance: ₹{balance}
Auto-purchase limit: ₹{limit}
Current stock levels:
  - Seeds: {seeds} kg
  - Pesticide: {pesticide} L
  - Fertilizer: {fertilizer} kg
Crop: {crop}, planted {days} days ago
Available vendors: {vendor_json}

Evaluate if any input is running low and recommend purchases."
```

**AI Response Schema:**
```json
{
  "needs_purchase": true/false,
  "purchases": [
    {
      "item": "Stem borer pesticide",
      "category": "pesticide",
      "vendor": "Rythu Seva Kendra",
      "quantity": "300ml",
      "cost_inr": 450,
      "reasoning": "Pesticide stock low, needed for pest control"
    }
  ],
  "summary": "2 items need restocking based on current levels"
}
```

### Processing Recommendations

**For each recommended purchase:**

1. **Check cost vs. AI purchase limit:**
   - `cost ≤ limit` → Auto-approve
     - Deduct from wallet balance immediately
     - Create transaction: "Completed — AI Approved"
     - Include AI reasoning
   
   - `cost > limit` → Pending
     - Create transaction: "AI Recommended — Over Limit"
     - Do NOT deduct balance
     - Farmer can manually approve/cancel using 3 buttons

2. **Validate wallet balance:**
   - If insufficient funds, skip purchase
   - Log warning in console

3. **Update transaction list:**
   - All new transactions appear in Transactions tab
   - Farmer can review and take action

### Fallback Logic

**If both Gemini & Cohere fail:**
- Uses simple rule-based logic:
  - Pesticide < 3L → Recommend 300ml pesticide (₹450)
  - Fertilizer < 50kg → Recommend 50kg DAP (₹1,200)
  - Seeds < 20kg → Recommend 20kg seeds (₹1,600)

**Console Logging:**
```
🤖 AI Wallet Agent - Running analysis...
📊 Stock levels: {seeds: 15, pesticide: 2.5, fertilizer: 45}
💰 Wallet balance: 15000
🎯 AI purchase limit: 2000
📦 Processing purchase: Stem borer pesticide for ₹450
✅ Auto-approved: Stem borer pesticide
⚠️ Over limit, pending approval: Rice Seeds (BPT 5204)
```

---

## Implementation Details

### File Structure
```
src/
├── app/
│   ├── finance/
│   │   └── page.tsx          # Main Finance page (4 tabs)
│   └── dashboard/
│       └── page.tsx          # Updated with Finance card
├── services/
│   ├── wallet.ts             # Wallet service (all logic)
│   └── gemini.ts             # Added processWalletAgent method
```

### Services

**WalletService** (`src/services/wallet.ts`)
- `getWallet()` - Get current balance and AI limit
- `addMoney(amount)` - Add to wallet
- `withdraw(amount)` - Withdraw from wallet
- `setAIPurchaseLimit(limit)` - Update AI limit
- `getTransactions()` - Get all transactions
- `getVendors()` - Get marketplace vendors
- `getStockLevels()` - Get current stock
- `createTransaction(...)` - Add new transaction
- `approveTransaction(id, type)` - Approve & deduct
- `cancelTransaction(id)` - Cancel transaction
- `createManualOrder(...)` - Place marketplace order
- `runAIWalletAgent()` - Execute AI analysis

**GeminiService** (`src/services/gemini.ts`)
- Added `processWalletAgent(systemPrompt, userMessage)` method
- Tries Gemini first (with 429 quota detection)
- Falls back to Cohere Chat API V2
- Returns raw string response (parsed by wallet service)

### LocalStorage Keys
```typescript
'farmer_wallet'           // {balance: number, aiPurchaseLimit: number}
'wallet_transactions'     // Transaction[]
'marketplace_vendors'     // Vendor[]
'farm_stock_levels'       // {seeds: number, pesticide: number, fertilizer: number}
```

---

## Testing Guide

### Test Wallet Operations
1. Go to `/finance` → Wallet tab
2. Add ₹5,000 → Balance should increase
3. Withdraw ₹2,000 → Balance should decrease
4. Set AI limit to ₹1,500 → Should update

### Test Manual Orders
1. Go to Marketplace tab
2. Click "Order" on any product
3. Check:
   - Wallet balance decreases
   - New transaction appears in Transactions tab
   - Status: "Completed — Manual Order"

### Test Transaction Actions
1. Go to Transactions tab
2. Find "Pending Approval" transaction
3. Try all 3 buttons:
   - "Approve (AI)" → Deducts balance, marks AI Approved
   - "Approve (Human)" → Deducts balance, marks Human Approved
   - "Cancel" → No deduction, marks Cancelled

### Test AI Wallet Agent
1. Go to Wallet tab
2. Click "Run AI Wallet Review"
3. Wait for AI processing (watch console logs)
4. Check results:
   - If recommendations ≤ limit → Auto-approved transactions
   - If recommendations > limit → Pending transactions
   - Go to Transactions tab to see new entries

### Test Calculator
1. Go to Calculator tab
2. Fill in all inputs:
   - Budget: ₹25,000
   - Expected Yield: 2,500 kg
   - Quantity Sold: 2,000 kg
   - Sale Price: ₹18/kg
   - Pesticide Used: 1.5 L
   - Fertilizer Used: 100 kg
   - Seeds Used: 25 kg
3. Check computed outputs update in real-time
4. Actual Profit should show: (2000 × 18) - expenses

### Test API Fallback
1. Open browser console
2. Run AI Wallet Agent
3. Look for these logs:
   - `🔍 GEMINI VISION API CALL - BEFORE`
   - If Gemini fails: `⚠️ Gemini quota exceeded, switching to Cohere...`
   - `📤 Sending wallet agent request to Cohere Chat API (V2)...`
   - `✅ COHERE WALLET AGENT API CALL - SUCCESS`

---

## Key Design Decisions

### No Approval Queue Gate
- Transactions are NOT blocked in a separate "pending approval" state
- All transactions are just entries with status labels
- The 3 buttons (Approve AI/Human/Cancel) are manual override options
- This gives farmers full control without rigid workflows

### Cost Limit Check on App Side
- AI may return purchases of any cost
- App recomputes `cost_inr` vs. `aiPurchaseLimit` before deciding status
- Never trust limit checks from AI response
- This prevents AI hallucination from auto-approving expensive purchases

### Identical JSON Schema for Both AIs
- Same prompt template for Gemini and Cohere
- Same response parsing logic
- No branching based on provider
- Seamless fallback experience

### Mock Data Throughout
- No real banking APIs
- No real vendor integrations
- All prices and products are hardcoded
- Perfect for demo and development

### Console Logging
- Extensive logging for debugging
- Shows API calls, stock levels, decisions
- Helps understand AI agent behavior
- Production-ready for monitoring

---

## Summary

✅ Finance page with 4 tabs (Wallet, Transactions, Calculator, Marketplace)
✅ Mock wallet with add/withdraw operations
✅ AI auto-purchase limit setting
✅ Transaction list with 3-button control (Approve AI/Human/Cancel)
✅ Realistic seed transactions pre-loaded
✅ Farming calculator with auto-computed profit
✅ Marketplace with 5 vendors, 14+ products
✅ Manual ordering from marketplace
✅ AI Wallet Agent with Gemini → Cohere fallback
✅ Intelligent purchase recommendations
✅ Auto-approval for purchases within limit
✅ Over-limit purchases marked for manual review
✅ No separate approval queue or workflow gates
✅ All mock data, no real APIs
✅ Complete localStorage persistence
✅ Comprehensive console logging

The farmer has full control over their finances with AI assistance, not AI control!
