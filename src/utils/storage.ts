import { AppState, BaselineInput, BaselineResult } from "../types";
import { calculateBaseline } from "./carbonCalculations";

const STORAGE_KEY = "carbonwise_tracker_state";

const DEFAULT_INPUTS: BaselineInput = {
  vehicleType: "gas_small", // Petrol/CNG Hatchback
  vehicleAnnualMiles: 8500, // in km
  publicTransitWeeklyMiles: 45, // in km
  shorthaulFlightsYear: 1, // Domestic flights
  longhaulFlightsYear: 0, // International flights
  electricityMonthlyCost: 2200, // Monthly electricity bill in INR (₹)
  electricityCleanFraction: 0, // No default solar setup
  naturalGasMonthlyCost: 950, // Monthly cooking gas/LPG bill in INR (₹)
  otherHeatingSource: "none",
  otherHeatingMonthlyCost: 0,
  dietType: "low_meat", // Pure Lacto-Vegetarian (Most common Indian diet)
  organicFraction: 25, // buying from regional vendors / subzi mandis
  recyclePaper: true,
  recyclePlastic: true,
  recycleGlass: false,
  recycleMetal: false,
  compostWaste: false
};

const defaultBaselineResult = calculateBaseline(DEFAULT_INPUTS);

// Pre-seeded logs for Indian users
const SEEDED_LOGS = [
  {
    id: "seed_log_1",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 3 days ago
    category: "transport" as const,
    title: "Commute via local Metro",
    description: "Avoided high-traffic personal diesel SUV exhaust by taking the city Metro to work.",
    impactKg: 3.2
  },
  {
    id: "seed_log_2",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 2 days ago
    category: "diet" as const,
    title: "Eco Veg / Ghee-Free Dinner",
    description: "Sourced Dal Tadka, Subzi and dry rotis with zero butter or ghee to limit dairy footprints.",
    impactKg: 2.2
  },
  {
    id: "seed_log_3",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Yesterday
    category: "energy" as const,
    title: "Sun-Dried Clothes under Day Sky",
    description: "Avoided utilizing any heat spinning dryers by letting fresh Indian sunshine dry the full laundry load.",
    impactKg: 0.8
  }
];

const SEEDED_RECOMMENDATIONS = [
  {
    id: "task_solar",
    category: "energy" as const,
    title: "Apply for PM Surya Ghar Subsidies",
    description: "Look up local state board guidelines for PM Surya Ghar: Muft Bijli Yojana rooftop solar panel subsidies. This cuts household electrical coal emissions down to solid zero and offsets bills completely.",
    impact: "high" as const,
    annualSavingsKg: 980,
    difficulty: "moderate" as const,
    estimatedCost: "investment",
    completed: false
  },
  {
    id: "task_temp",
    category: "energy" as const,
    title: "Switch to 5-Star BEE Rated Ceiling Fans",
    description: "Replace older ceiling fans with high-efficiency 5-Star BEE BLDC ceiling fans. BLDC motors draw just 28W instead of 75W, shaving substantial power off the monthly bill.",
    impact: "medium" as const,
    annualSavingsKg: 210,
    difficulty: "easy" as const,
    estimatedCost: "low cost",
    completed: false
  },
  {
    id: "task_diet",
    category: "diet" as const,
    title: "Adopt 2 Vegan (Ghee-Free) Days Weekly",
    description: "Adopt or transition two days a week to completely dairy-free (avoiding ghee, curd, paneer, and tea with dairy milk). Dairy has an oversized agricultural methane footprint globally.",
    impact: "medium" as const,
    annualSavingsKg: 190,
    difficulty: "easy" as const,
    estimatedCost: "free",
    completed: false
  },
  {
    id: "task_bike",
    category: "transport" as const,
    title: "Leverage Local Shared E-Auto Rickshaws",
    description: "Swap personal car short trips under 3 kilometers with shared electric e-rickshaws or simple walking for vegetable purchases at the local mandi.",
    impact: "high" as const,
    annualSavingsKg: 340,
    difficulty: "easy" as const,
    estimatedCost: "free",
    completed: false
  }
];

const SEEDED_CHAT = [
  {
    id: "msg_init",
    role: "assistant" as const,
    content: `Namaste! Welcome to CarbonWise Eco Assist! 🌿🇮🇳
    
I've calculated your baseline carbon stats adjusted specifically for **Indian citizens**.

Because of lower national defaults, your calculated baseline is **${Math.round(defaultBaselineResult.total / 1000 * 10) / 10} metric tonnes of CO₂** per year, which is already very close to the sustainable limit of **2.0 metric tonnes**! Our main goal is to transition our transport and home energy usage to ensure we maintain our eco-friendly lifestyles.

Feel free to utilize the **Baseline Calculator** to input your exact values (in kilometers and Rupees ₹), log daily green activities on the **Daily Green Logs** hub, or ask me questions about local policies like solar subsidies or recycling. How can I guide you today?`,
    timestamp: new Date().toISOString()
  }
];

const SEEDED_BADGES = [
  {
    id: "badge_meatless",
    title: "Vegetarian Guru",
    description: "Logged at least 2 highly sustainable vegetarian or vegan meals to establish low-carbon food habits.",
    iconName: "Utensils",
    achieved: false,
    requirement: "2 diet action logs"
  },
  {
    id: "badge_commuter",
    title: "Metro Commute Champ",
    description: "Avoided private city traffic fumes by choosing public Metros, suburban rails, or walking.",
    iconName: "Car",
    achieved: true,
    achievedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    requirement: "1 transit action log"
  },
  {
    id: "badge_energy",
    title: "BEE Energy Saver",
    description: "Lowered energy loads by turning off geysers quickly or air-drying clothes under daylight.",
    iconName: "Zap",
    achieved: false,
    requirement: "2 home energy reduction logs"
  },
  {
    id: "badge_waste",
    title: "Kabadiwala Scrap Master",
    description: "Diverted landfill load entirely by sorting dry/wet waste and selling cardboard/metal directly.",
    iconName: "Trash2",
    achieved: false,
    requirement: "2 waste/recycling logs"
  },
  {
    id: "badge_streak_3",
    title: "Consistency Champion",
    description: "Kept your green tracking active with an ongoing consistency streak.",
    iconName: "Trophy",
    achieved: false,
    requirement: "Maintain a consistent logging streak"
  }
];

const SEEDED_GROUPS = [
  {
    id: "group_zero_waste",
    name: "Kabadiwala Sorting Warriors",
    description: "Urban Indian houses committed to high rates of waste segregation, plastics reuse, and scrap trade-ins.",
    memberCount: 840,
    joined: false,
    targetCategory: "waste" as const,
    totalSavedKg: 2450
  },
  {
    id: "group_transit",
    name: "Regular Metro Commuters",
    description: "Harnessing rapid transits (Delhi Metro, Mumbai Suburban, Namma Metro) to avoid road gridlocks.",
    memberCount: 1950,
    joined: true,
    targetCategory: "transport" as const,
    totalSavedKg: 12840
  },
  {
    id: "group_solar",
    name: "Surya Ghar Solar Club",
    description: "Indian homeowners adopting grid interactive solar rooftops under PM Surya Ghar Yojana.",
    memberCount: 220,
    joined: false,
    targetCategory: "energy" as const,
    totalSavedKg: 8900
  }
];

const SEEDED_CHALLENGES = [
  {
    id: "chall_meat_free",
    title: "Indian Vegan / Ghee-Free Week",
    description: "Prepare and celebrate completely vegan/dairy-free traditional cuisines for seven days.",
    goalKg: 15,
    progressKg: 2.2,
    joined: true,
    participants: 940,
    daysRemaining: 10
  },
  {
    id: "chall_commuter",
    title: "Metro & Local Rail Marathon",
    description: "Avoid fossil fuel cars for all heavy commutes; travel purely by metro railways and shared e-rickshaws.",
    goalKg: 25,
    progressKg: 0,
    joined: false,
    participants: 1250,
    daysRemaining: 4
  },
  {
    id: "chall_dryer_free",
    title: "Daylight Fabric Drying",
    description: "Ditch machine heat and use high Indian solar temperatures to dry laundry of the entire household.",
    goalKg: 10,
    progressKg: 0,
    joined: false,
    participants: 780,
    daysRemaining: 8
  }
];

const DEFAULT_GOAL = {
  percentTarget: 10,
  timeframeMonths: 3,
  startDate: new Date().toISOString().split("T")[0],
  isCustom: false,
  notes: "A steady, achievable 10% annual reduction represents a highly impactful reduction baseline."
};

const DEFAULT_STREAK = {
  currentStreakCount: 3, // Seed state to match pre-populated logs
  longestStreakCount: 5,
  lastActiveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // Yesterday
};

export function getInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all fields exist and carry migrations
      if (parsed.baselineInput && parsed.baselineResult) {
        return {
          ...parsed,
          // Handle migration additions for older localStorage structures
          selectedTab: (parsed.selectedTab === "calculator" || parsed.selectedTab === "logs" || parsed.selectedTab === "planner" || parsed.selectedTab === "assistant" || parsed.selectedTab === "social" || parsed.selectedTab === "progress") ? parsed.selectedTab : "calculator",
          reductionGoal: parsed.reductionGoal || DEFAULT_GOAL,
          streakState: parsed.streakState || DEFAULT_STREAK,
          badges: parsed.badges || SEEDED_BADGES,
          groups: parsed.groups || SEEDED_GROUPS,
          challenges: parsed.challenges || SEEDED_CHALLENGES
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse saved state", e);
  }

  return {
    baselineInput: DEFAULT_INPUTS,
    baselineResult: defaultBaselineResult,
    dailyLogs: SEEDED_LOGS,
    recommendations: SEEDED_RECOMMENDATIONS,
    chatHistory: SEEDED_CHAT,
    lastPlanGeneratedAt: null,
    personalizedInsight: "Your primary emissions come from electrical grid coal reliance and commuting. Swapping standard appliances with 5-star BEE models and adopting solar panels/metro travel yields rapid high-impact savings.",
    selectedTab: "calculator",
    reductionGoal: DEFAULT_GOAL,
    streakState: DEFAULT_STREAK,
    badges: SEEDED_BADGES,
    groups: SEEDED_GROUPS,
    challenges: SEEDED_CHALLENGES
  };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to persist app state", e);
  }
}
