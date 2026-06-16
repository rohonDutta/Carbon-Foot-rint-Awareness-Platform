# CO₂-ZERO: Dynamic Carbon Footprint Companion

CO₂-ZERO is a smart, fully-functional, responsive carbon-reduction companion app built with React, TypeScript, Tailwind CSS, and the state-of-the-art Google Gemini 3.5 Flash API. This solution is designed to help citizens understand their daily ecological impact, log green micro-actions, and dynamically update an AI-optimized physical roadmap to achieve carbon neutrality.

## 🌿 Chosen Vertical
* **Personal Climate Action Companion & Environmental Audit Assistant**

## 🚀 Key Features & UI Experience ("Vibrant Palette" Theme)
* **Lifestyle Baseline Calculator**: Realistic mathematical model calibrated on standard EPA (United States Environmental Protection Agency) and DEFRA algorithms measuring vehicle emissions, weekly transit, air flights, utility bills, solar pricing, diet category, and recycling coverage.
* **Daily Action Logger**: Interactive logger containing precise daily action presets (remotely working, line-drying clothes, vegan days) or custom climate behaviors that continuously deduct emissions from the baseline annual average, displaying immediate rewards.
* **AI Action Planner**: Powered by **Gemini 3.5 Flash**, this module reads baseline lifestyle inputs in a server-side JSON contract to generate custom structured action tasks with varying difficulties, expected costs, and calculated annual kg CO₂e offsets.
* **Intelligent Conversation Assistant**: Chat directly with *CarbonWise Eco Assist* utilizing the robust Google GenAI SDK. Ask complex chemical queries (e.g. comparing methane to carbon dioxide) or local transport hints.
* **Vibrant Visual Gamification**: Incorporates gamified milestones (XP points, climate badge tiers ranging from *"Seed Starter"* to *"Forest Guardian"*), comparative world benchmarks, and interactive SVG real-time dials.

## 🛠️ Design Theme Highlights ("Vibrant Palette" Theme)
1. **Palette Colors**: Implements high-contrast premium off-whites (`#F0F7F4`), vibrant forest greens (`#1A2E22`), and bright golden amber elements (`#FBBF24`).
2. **Typography Pairings**: Thick black displays paired with monospace indicators for modern environmental tech branding.
3. **Structured Bento Layout**: Intuitive layout with modular task controls, customizable profile labels, and clean responsiveness.

## 📊 Scientific Assumptions Made
1. **Grid Metrics**: Individual monthly electrical carbon footprints are calculated using a baseline power factor ($1.00 USD spending $\approx 6.25 \text{ kWh} \approx 2.37 \text{ kg } CO_2e$) adjusted dynamically by the green power grid offset slider.
2. **Shared Utilities**: Direct home energy bills are divided by a standard household allocation factor of $2.2$ to isolate the user's specific singular impact factor.
3. **Log Persistence**: Micro-action variables are annualized (assuming steady daily habits) to render the live dynamic net carbon dial score.
