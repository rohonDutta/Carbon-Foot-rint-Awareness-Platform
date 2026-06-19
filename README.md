# CO₂-ZERO: Dynamic Carbon Footprint Companion

CO₂-ZERO is a smart, fully-functional, responsive carbon-reduction companion app built with React, TypeScript, Tailwind CSS, and the Google Gemini 2.0 Flash API. This solution is designed to help citizens understand their daily ecological impact, log green micro-actions, and dynamically receive an AI-optimised physical roadmap to achieve carbon neutrality.

## 🌿 Chosen Vertical
**Personal Climate Action Companion & Environmental Audit Assistant**

## 🧠 Approach and Logic
The approach treats carbon footprint reduction not as a static calculator, but as a living, gamified experience built on a two-pronged feedback loop:

1. **Mathematical Baseline Analysis** — Calculate a rigorous annual footprint based on user lifestyle inputs (transport, energy, diet, waste) using emission factors calibrated for Indian households.
2. **Dynamic AI Feedback** — Pass the baseline footprint and daily micro-actions securely to the Gemini AI model via a custom Express backend, generating continuously adapting, actionable insights without exposing API keys to the client.

## ⚙️ How the Solution Works

1. **User Onboarding & Baseline** — The user fills out a dynamic form detailing their travel, energy, diet, and waste habits. The system algorithmically converts these inputs into kg CO₂e (Carbon Dioxide Equivalent) per year using Indian grid intensity and regional emission factors.
2. **Interactive Logging** — Users log daily sustainable actions (e.g., taking public transit, eating a vegan meal). These immediately update a live "net footprint" dial using real-time React state.
3. **AI Action Planner** — The application queries the Express backend with the user's data. The Gemini 2.0 Flash model processes this context using a strict JSON schema to generate 5 highly personalised, region-aware recommendations with difficulty levels and CO₂ offset estimates.
4. **CarbonWise Eco Assist (Chatbot)** — A conversational AI assistant retains session history, allowing users to ask for localised sustainability advice, scientific explanations, or specific product tips (e.g., comparing BLDC fans vs standard ceiling fans).
5. **Social Hub** — Users join community groups and cooperative eco-challenges. Logging relevant actions automatically updates group pool savings and challenge progress meters.
6. **Progress & Badges** — Gamified milestones (XP points, climate badge tiers) reward consistent daily logging.

## 🚀 Key Features

- **Lifestyle Baseline Calculator** — Mathematical model calibrated with Indian grid intensity (0.82 kg CO₂/kWh), LPG cylinder weights, vehicle fuel efficiencies, and IPCC diet lifecycle analyses.
- **Daily Action Logger** — Preset eco-actions (metro commute, vegan day, solar drying, Kabadiwala sorting) with quantified kg CO₂ savings that update the net footprint in real time.
- **Gamification** — XP points, rank tiers (Seed Starter → Forest Guardian), streaks, and achievement badges.
- **AI-Powered Personalisation** — Gemini 2.0 Flash generates context-aware recommendations referencing PM Surya Ghar solar subsidies, 5-star BEE appliances, shared e-rickshaws, and local mandi sourcing.
- **Security** — Express server with Content-Security-Policy, rate limiting, input validation, and no API key exposure to the client.

## 📊 Assumptions Made

1. **Grid Intensity** — Indian electricity grid carbon intensity: ~0.82 kg CO₂/kWh at an average tariff of ₹8/kWh, giving ~0.10 kg CO₂ per ₹ of electricity cost.
2. **Household Allocation** — Home energy bills are divided by the average Indian household size of **4.0 persons** (Census of India 2011) to isolate the user's individual footprint.
3. **Log Annualisation** — Micro-action variables are scaled (×30 days) to produce an annualised net footprint estimate assuming steady daily habits.
4. **Indian Context** — All pricing uses Indian Rupees (₹) and distances use kilometres (km). AI recommendations are tailored to Indian infrastructure: Metro networks (Delhi, Mumbai, Namma), PM Surya Ghar Yojana, Kabadiwalas, and local mandi sourcing.
5. **Diet Factors** — Annual CO₂e per diet type reflects Indian food system lifecycle analyses: vegan (600 kg), lacto-vegetarian (900 kg), eggitarian (1 300 kg), regular non-vegetarian (2 200 kg).

## 🔧 Running Locally

```bash
# Install dependencies
npm install

# Add your Gemini API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

```bash
npm test
```

All unit tests cover: emission calculations, localStorage persistence, streak logic, and UI component rendering.
