# CO₂-ZERO: Dynamic Carbon Footprint Companion

CO₂-ZERO is a smart, fully-functional, responsive carbon-reduction companion app built with React, TypeScript, Tailwind CSS, and the state-of-the-art Google Gemini 3.5 Flash API. This solution is designed to help citizens understand their daily ecological impact, log green micro-actions, and dynamically update an AI-optimized physical roadmap to achieve carbon neutrality.

## 🌿 Chosen Vertical
* **Personal Climate Action Companion & Environmental Audit Assistant**

## 🧠 Approach and Logic
Our approach treats carbon footprint reduction not as a static calculator, but as a living, gamified experience. The logic relies on a two-pronged feedback loop:
1. **Mathematical Baseline Analysis**: Calculate a rigorous, static annual footprint based on user lifestyle inputs.
2. **Dynamic AI Feedback**: Pass the baseline footprint, along with daily micro-actions, securely to the Gemini GenAI model to generate continuously adapting, actionable insights. By integrating Gemini via a custom Express backend, we guarantee contextual, secure prompt construction without exposing keys to the client.

## ⚙️ How the Solution Works
1. **User Onboarding & Baseline**: The user fills out a dynamic form detailing their travel, energy, diet, and waste habits. The system algorithmically converts these inputs into kg CO₂e (Carbon Dioxide Equivalent) per year.
2. **Interactive Logging**: Users log daily sustainable actions (like taking public transit or eating a vegan meal). These immediately update a live "net footprint" dial.
3. **AI Action Planner**: The application queries the Express backend with the user's data. The Gemini AI engine processes this context using a strict JSON schema to generate 5 highly personalized, region-aware recommendations with varying difficulty levels and exact offset calculations.
4. **CarbonWise Eco Assist (Chatbot)**: A conversational AI assistant retains session history, allowing users to ask for localized sustainability advice, scientific explanations, or specific product tips (e.g., comparing BLDC fans).

## 🚀 Key Features & UI Experience
* **Lifestyle Baseline Calculator**: Realistic mathematical model calibrated on standard algorithms measuring vehicle emissions, utility bills, diet category, and recycling coverage.
* **Daily Action Logger**: Interactive logger containing precise daily action presets that continuously deduct emissions from the baseline annual average.
* **Vibrant Visual Gamification**: Incorporates gamified milestones (XP points, climate badge tiers), comparative world benchmarks, and interactive SVG real-time dials.

## 📊 Assumptions Made
1. **Grid Metrics**: Individual monthly electrical carbon footprints are calculated using a baseline power factor ($1.00 USD spending ≈ 6.25 kWh ≈ 2.37 kg CO₂e) adjusted dynamically by the green power grid offset slider.
2. **Shared Utilities**: Direct home energy bills are divided by a standard household allocation factor of 2.2 to isolate the user's specific singular impact factor.
3. **Log Persistence**: Micro-action variables are annualized (assuming steady daily habits) to render the live dynamic net carbon dial score.
4. **Indian-Context Adaptation**: For the AI agent, pricing and distances are assumed and requested in INR (₹) and kilometers, and solutions are tailored toward local infrastructure (e.g., Metro networks, PM Surya Ghar).
