# Fasal Munafa - Demo Quick Guide

## 🚀 Start the App

```bash
cd fasal-munafa
npm run dev
```

Open: `http://localhost:3000`

---

## 🎯 Demo Flow (5-Minute Walkthrough)

### 1. Dashboard (Main Hub)
**Show:**
- **Finance Center card** (click to show wallet system)
- **Weighted score cards** with info tooltips (click ℹ️ icons)
- **Crop Timeline** (not a static chart, shows planting date + actions)
- **AI Recommendations** (color-coded by urgency)
- **Token Usage Bar** (top right: "1,240 / 5,000 used today")
- **Quick Actions** (6 buttons)

**Key Points:**
- Scores use real formulas (40/20/20/20, etc.)
- Not hardcoded anymore
- Tooltips show breakdown

### 2. Health Check (Plantix-Style)
**Path:** Click "Health Check" → Upload crop photo

**Show:**
- Photo upload interface
- Click "Analyze Health"
- Get verdict: Good / Needs Attention / Critical
- Detailed breakdown (disease, pests, deficiencies)
- Treatment recommendations

**Key Feature:** Instant photo diagnosis like Plantix

### 3. Ask AI Chat
**Path:** Click "Ask AI"

**Show:**
- Chat interface with AI
- Ask: "When should I apply fertilizer?"
- Get contextual answer (AI knows your land data)
- Click **"Talk to Human Officer"**
- Write message → Goes to government queue
- Confirmation received

**Key Feature:** AI + human escalation in one flow

### 4. Finance Center
**Path:** Dashboard → Finance Center card

**Show 4 Tabs:**

**A. Wallet**
- Current balance
- Add/withdraw money
- AI purchase limit setting
- Click **"Run AI Wallet Review"**
- Watch AI recommend purchases

**B. Transactions**
- 12 diverse transactions
- 3 buttons on each: Approve (AI) / Approve (Human) / Cancel
- No approval queue - just status labels

**C. Calculator**
- Enter farming inputs
- Real-time profit calculation

**D. Marketplace**
- 5 vendors, 14+ products
- Click "Order" → Instant purchase

### 5. Land Records
**Path:** Click "Land Records" in Quick Actions

**Show:**
- **Big green card at top:** Next Season Recommendation
  - AI suggests Wheat for Rabi
  - Profit potential: ₹52,000
  - Investment: ₹28,000
  - Reasoning based on history
- Past crops with yields
- Financial summary
- Photo history

**Key Feature:** Season-level AI planning (different from daily recommendations)

### 6. Task Scheduler
**Path:** Click "Schedule Task"

**Show:**
- Click "Add Task"
- Choose from dropdown or custom
- Set date/time
- See in Upcoming/Past Due/Completed
- Click complete button

### 7. Reports
**Path:** Click "View Reports"

**Show 4 Tabs:**
- Performance: Health trend chart
- Financial: Expense breakdown (bar chart)
- Stock & Usage: Current inventory
- AI Chat History

---

## 💡 Key Demo Points

### 1. Real Weighted Scoring (Not Fake)
**Say:** "The scores use actual formulas:"
- Crop Health = 40% Gemini + 20% Weather + 20% NDVI + 20% History
- Click info icon to show breakdown

### 2. AI Everywhere
**Say:** "AI powers multiple features:"
- Health Check photo analysis
- Chat assistant
- Wallet procurement agent
- Recommendations (real-time, not static)
- Next season planning

### 3. Seamless Fallback
**Say:** "When Gemini quota exceeds:"
- Automatically switches to Cohere
- Same JSON schema
- User doesn't notice
- Watch console logs for "⚠️ Gemini quota exceeded, switching to Cohere..."

### 4. No Approval Queue
**Say:** "Transactions are flexible:"
- Every transaction has 3 buttons always available
- No rigid workflow
- Farmer decides: AI approve, Human approve, or Cancel
- AI auto-approves only within set limit (₹2,000)

### 5. Comprehensive Finance
**Say:** "Complete financial management:"
- Wallet with mock balance
- Marketplace with real Karnataka vendors
- Farming calculator
- AI agent that checks stock and recommends purchases
- All mock data (no real banking)

---

## 🔍 Console Logs to Watch

Open browser DevTools (F12) → Console

**During AI Wallet Agent:**
```
🤖 AI Wallet Agent - Running analysis...
📊 Stock levels: {seeds: 15, pesticide: 2.5, fertilizer: 45}
💰 Wallet balance: 15000
🔄 Calling Gemini Vision API...
✅ GEMINI WALLET AGENT API CALL - SUCCESS
📦 Processing purchase: Stem borer pesticide for ₹450
✅ Auto-approved: Stem borer pesticide
```

**During Health Check:**
```
🌾 CROP HEALTH DETAILED ANALYSIS - BEFORE
📤 Sending request to Gemini Vision API...
✅ Gemini Crop Health Analysis: {cropHealth: 87, disease: "None detected", ...}
```

**During Ask AI:**
```
🤖 GENERATING AI RECOMMENDATIONS
📤 Sending request to Gemini API...
✅ Successfully processed Gemini recommendations
```

---

## 🎨 Visual Highlights

### Color Coding
- **Green:** Healthy (≥85%), completed, approved
- **Yellow:** Moderate (65-84%), medium urgency
- **Red:** Critical (<65%), high urgency, past due
- **Blue:** Information, water-related
- **Purple:** AI features, suggestions

### Score Tooltips
Click ℹ️ icon on any score card:
- Shows exact formula
- Displays all 4-5 components
- Weight percentages

### Urgency Badges
AI Recommendations show:
- **HIGH** (red) - urgent action
- **MEDIUM** (yellow) - important
- **LOW** (green) - routine

---

## 📱 User Personas

### Farmer (Main User)
- Dashboard with scores
- Health Check photos
- Ask AI for help
- Schedule tasks
- Manage wallet
- View reports

### Government Officer
- Reviews escalated cases
- Sees farmer messages
- Government dashboard (existing)

---

## 🧪 Test Scenarios

### Scenario 1: Low Crop Health
1. Go to Health Check
2. Upload photo of stressed crop
3. See verdict: "Needs Attention" (yellow)
4. Check recommendations
5. Go to Dashboard → See high-urgency AI recommendation

### Scenario 2: Purchase Needed
1. Go to Finance → Wallet
2. Click "Run AI Wallet Review"
3. AI detects low pesticide (2.5L < 3L threshold)
4. Recommends 300ml pesticide (₹450)
5. Auto-approves (within ₹2,000 limit)
6. Check Transactions tab → New entry

### Scenario 3: Need Human Help
1. Go to Ask AI
2. Ask complex question
3. Click "Talk to Human Officer"
4. Write issue
5. Submit → Officer gets message
6. Confirmation shown

### Scenario 4: Plan Next Season
1. Go to Land Records
2. See green card: "AI Recommendation for Next Season"
3. Wheat suggested for Rabi
4. ₹52,000 profit potential
5. Based on past Rice success

---

## 🔑 Key Features Summary

**Implemented (Ready for Demo):**
✅ Weighted scoring with tooltips
✅ Crop Timeline (replaced chart)
✅ Real AI recommendations
✅ Token usage indicator
✅ Health Check (Plantix-style)
✅ Ask AI with human escalation
✅ Land Records + next season AI
✅ Task Scheduler
✅ Reports (4 tabs)
✅ Finance system (wallet, marketplace, calculator, AI agent)
✅ 12 seed transactions
✅ 6 Quick Action buttons

**Deferred (Not Critical for Demo):**
- Map proximity alert
- Multi-photo upload UI
- Patch grid map visualization
- Real satellite API calls

---

## 💬 Demo Script

**Opening:**
"Fasal Munafa is an AI-powered agricultural platform for Indian farmers. It uses multi-factor analysis, not single-image scoring."

**Show Dashboard:**
"These scores aren't random - they use weighted formulas. Click this info icon to see the breakdown: 40% Gemini image analysis, 20% weather, 20% satellite, 20% historical data."

**Show Health Check:**
"Farmers can upload crop photos for instant diagnosis - like Plantix. The AI checks for diseases, pests, deficiencies, and gives a simple verdict."

**Show Ask AI:**
"Farmers can chat with AI for farming advice. If AI can't help, they can escalate to a human government officer with one click."

**Show Finance:**
"Complete financial management: wallet, marketplace with real Karnataka vendors, and an AI agent that monitors stock levels and recommends purchases automatically - but only within the farmer's set limit."

**Show Land Records:**
"Historical data with AI recommendations for the next season. The AI analyzes past crops, current market rates, and suggests what to plant next for maximum profit."

**Closing:**
"All AI features have seamless fallbacks: Gemini → Cohere → rule-based logic. Farmers never see errors, just results."

---

## 🎬 Ready to Demo!

**Quick Start:**
```bash
npm run dev
```

**Open:** http://localhost:3000

**Login:** Use demo credentials (if auth enabled) or proceed to dashboard

**Demo Time:** 5-7 minutes for full walkthrough

Good luck! 🚀
