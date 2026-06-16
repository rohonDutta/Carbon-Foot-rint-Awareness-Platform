export type CarbonCategory = "transport" | "energy" | "diet" | "waste";

export interface BaselineInput {
  // Transport questions
  vehicleType: "none" | "gas_small" | "gas_medium" | "gas_large" | "hybrid" | "electric";
  vehicleAnnualMiles: number;
  publicTransitWeeklyMiles: number;
  shorthaulFlightsYear: number; // under 1500 miles
  longhaulFlightsYear: number; // over 1500 miles

  // Home energy questions
  electricityMonthlyCost: number;
  electricityCleanFraction: number; // 0 to 100% (solar, green pricing, etc)
  naturalGasMonthlyCost: number;
  otherHeatingSource: "none" | "oil" | "propane" | "wood";
  otherHeatingMonthlyCost: number;

  // Diet questions
  dietType: "vegan" | "vegetarian" | "low_meat" | "avg_meat" | "high_meat";
  organicFraction: number; // 0 to 100%

  // Waste questions
  recyclePaper: boolean;
  recyclePlastic: boolean;
  recycleGlass: boolean;
  recycleMetal: boolean;
  compostWaste: boolean;
}

export interface BaselineResult {
  transportation: number; // kg CO2 / year
  energy: number;         // kg CO2 / year
  diet: number;           // kg CO2 / year
  waste: number;          // kg CO2 / year
  total: number;          // total annual kg CO2
}

export interface DailyLogItem {
  id: string;
  date: string; // ISO format or YYYY-MM-DD
  category: CarbonCategory;
  title: string;
  description: string;
  impactKg: number; // The carbon emissions avoided (positive) or saved compared to default baseline action
}

export interface RecommendationItem {
  id: string;
  category: CarbonCategory;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  annualSavingsKg: number;
  difficulty: "easy" | "moderate" | "hard";
  estimatedCost: "free" | "low cost" | "medium cost" | "investment" | string;
  completed?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string; // e.g. "Utensils", "Car", "Zap", "Trash2", "Trophy"
  achieved: boolean;
  achievedAt?: string;
  requirement: string;
}

export interface StreakState {
  currentStreakCount: number;
  longestStreakCount: number;
  lastActiveDate: string | null; // YYYY-MM-DD
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  joined: boolean;
  targetCategory: CarbonCategory | "all";
  totalSavedKg: number;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  goalKg: number;
  progressKg: number;
  joined: boolean;
  participants: number;
  daysRemaining: number;
}

export interface ReductionGoal {
  percentTarget: number; // e.g. 10
  timeframeMonths: number; // e.g. 3
  startDate: string; // YYYY-MM-DD
  isCustom: boolean;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AppState {
  baselineInput: BaselineInput;
  baselineResult: BaselineResult;
  dailyLogs: DailyLogItem[];
  recommendations: RecommendationItem[];
  chatHistory: ChatMessage[];
  lastPlanGeneratedAt: string | null;
  personalizedInsight: string | null;
  selectedTab: "calculator" | "logs" | "planner" | "assistant" | "social" | "progress";
  
  // New trackable additions
  reductionGoal: ReductionGoal;
  streakState: StreakState;
  badges: Badge[];
  groups: CommunityGroup[];
  challenges: CommunityChallenge[];
}

