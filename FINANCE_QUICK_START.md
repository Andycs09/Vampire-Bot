# Finance System - Quick Start Guide

## Access Finance Center

**From Dashboard:**
- Click the "Finance Center" card (replaced "Total Profit This Season")
- Located in top-left of stats grid

**Direct URL:**
- Navigate to `/finance`

---

## Quick Feature Overview

### 💰 WALLET
- Current balance: ₹15,000 (initial)
- Add/Withdraw money
- Set AI purchase limit: ₹2,000 (default)
- **"Run AI Wallet Review"** button → AI checks stock & recommends purchases

### 📜 TRANSACTIONS
- View all wallet transactions
- Each transaction has 3 buttons:
  - **Approve (AI)** - Purple
  - **Approve (Human)** - Green
  - **Cancel** - Red
- Pre-loaded with 4 demo transactions

### 🧮 CALCULATOR
- Input: budget, dates, yield, sales, stock
- Output: expense, revenue, estimated profit, **actual profit**
- Real-time calculations

### 🏪 MARKETPLACE
- 5 vendors, 14+ products
- Seeds, pesticides, fertilizers, tools
- Click "Order" to purchase instantly

---

## Test AI Wallet Agent

1. Go to `/finance` → **Wallet tab**
2. Click **"Run AI Wallet Review"**
3. AI analyzes:
   - Stock levels (seeds: 15kg, pesticide: 2.5L, fertilizer: 45kg)
   - Crop needs (Rice at 45 days)
   - Vendor prices
4. AI recommends purchases:
   - **Cost ≤ ₹2,000** → Auto-approved, deducts balance
   - **Cost > ₹2,000** → Pending, needs manual approval
5. Check **Transactions tab** to see results

---

## AI Behavior Example

**Current Stock:**
- Seeds: 15 kg
- Pesticide: 2.5 L (LOW!)
- Fertilizer: 45 kg (LOW!)

**AI Recommendation:**
```json
{
  "needs_purchase": true,
  "purchases": [
    {
      "item": "Stem borer pesticide",
      "cost_inr": 450,
      "reasoning": "Pesticide stock low"
    },
    {
      "item": "DAP Fertilizer 50kg",
      "cost_inr": 1200,
      "reasoning": "Fertilizer below recommended level"
    }
  ]
}
```

**Result:**
- Pesticide (₹450) → AUTO-APPROVED ✅ (within ₹2,000 limit)
- Fertilizer (₹1,200) → AUTO-APPROVED ✅ (within ₹2,000 limit)
- New balance: ₹15,000 - ₹450 - ₹1,200 = ₹13,350

---

## Console Logs to Watch

Open browser console (F12) when running AI agent:

```
🤖 AI Wallet Agent - Running analysis...
📊 Stock levels: {seeds: 15, pesticide: 2.5, fertilizer: 45}
💰 Wallet balance: 15000
🎯 AI purchase limit: 2000
🔍 GEMINI VISION API CALL - BEFORE
✅ GEMINI WALLET AGENT API CALL - SUCCESS
📦 Processing purchase: Stem borer pesticide for ₹450
✅ Auto-approved: Stem borer pesticide
```

If Gemini fails:
```
❌ GEMINI VISION API ERROR: 429 quota exceeded
⚠️ Gemini quota exceeded, switching to Cohere...
📤 Sending wallet agent request to Cohere Chat API (V2)...
✅ COHERE WALLET AGENT API CALL - SUCCESS
```

---

## API Configuration

Both APIs use the same prompt and JSON schema:

**Gemini:** `gemini-pro` model
**Cohere:** `command-r-plus` model (Chat API V2)

API keys in `.env.local`:
```env
NEXT_PUBLIC_GEMINI_API_KEY="..."
NEXT_PUBLIC_COHERE_API_KEY="cohere_rhvpvetfx5aO6g1YiwD8rOAwA6KrGfHHl4RvlUHA3tcqwv"
```

---

## Key Points

✅ **No real banking** - All mock data
✅ **No approval queue** - Just transaction status labels
✅ **3 buttons always available** - Manual control anytime
✅ **AI respects limit** - Auto-approves only within ₹2,000
✅ **Seamless fallback** - Gemini → Cohere → Rule-based
✅ **Full transparency** - Detailed console logging

---

## Built Routes

```
/finance              ← Finance Center (4 tabs)
/dashboard            ← Updated with Finance card
```

## Files Created

```
src/app/finance/page.tsx           ← Main Finance UI
src/services/wallet.ts             ← All business logic
src/components/ui/label.tsx        ← Label component
FINANCE_SYSTEM.md                  ← Full documentation
FINANCE_QUICK_START.md            ← This guide
```

Build successful! Ready to use. 🚀
