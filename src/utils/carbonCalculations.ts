import { BaselineInput, BaselineResult, DailyLogItem, CarbonCategory } from "../types";

// Indian emission factors based on regional grid, LPG cylinder weights, and fuel efficiencies
// Units: kg CO2 or equivalent per unit (kilometers, Indian Rupees, days)

const TRANSPORT_FACTORS = {
  // kg CO2 per kilometer (km)
  vehicle: {
    none: 0,
    gas_small: 0.11,   // Petrol/CNG Hatchbacks
    gas_medium: 0.16,  // Petrol/Diesel Sedan, CNG compact SUVs
    gas_large: 0.22,   // SUVs and large Diesel utility vehicles
    hybrid: 0.08,      // Two-Wheeler (Motorcycle / Scooter) - extremely common in India!
    electric: 0.05     // Electric Cars and EVs under coal-heavy Indian grid charging
  },
  publicTransit: 0.025, // average across Delhi/Namma Metro, local trains, and suburban buses per passenger-km
  flightShorthaul: 120, // kg CO2 per Domestic flight leg (within India, e.g., Delhi to Mumbai)
  flightLonghaul: 650   // kg CO2 per International flight leg
};

const ENERGY_FACTORS = {
  // Average electricity cost in India is ~₹8 per kWh.
  // The Indian electricity grid produces ~0.82 kg CO2 per kWh (heavy coal reliance).
  // Under ₹8/kWh, 1 INR = 0.125 kWh = 0.103 kg CO2.
  electricityPerINR: 0.10,

  // LPG Cooking Gas: 14.2 kg cylinder costs ~₹1000 and produces ~42 kg of CO2.
  // Piped PNG: similar cost per unit CO2.
  // Thus, 1 INR spent on cooking gas = ~0.04 kg CO2.
  cookingGasPerINR: 0.042,

  // Water heating / Air Conditioning / seasonal load factors in INR (₹)
  heating: {
    none: 0,
    oil: 0.06,      // Geyser Only usage (medium power draw)
    propane: 0.08,  // Moderate Air Conditioning usage
    wood: 0.12      // Heavy Air Conditioning usage (high power drawer under Indian summer)
  }
};

const DIET_FACTORS = {
  // Annual kg CO2 per diet type (source: lifecycle analyses of Indian foods - high dairy vs grain ratio)
  vegan: 600,             // 100% plant-based, no ghee, milk, paneer, or honey
  vegetarian: 700,        // Strict Jain/Sattvik - no root vegetables, pure regional grains
  low_meat: 900,         // Pure Lacto-Vegetarian (Most common Indian diet, including curd, milk, paneer)
  avg_meat: 1300,         // Eggitarian / Occasional Non-Veg (chicken or fish a few times a month)
  high_meat: 2200         // Regular Non-Vegetarian (Daily or frequent chicken, mutton, or fish dishes)
};

const WASTE_FACTORS = {
  annualBaseline: 180, // standard annual personal waste emissions in landfill (much lower than Western averages)
  // Saved (negative kg) annually if recycled/composted through municipal hubs or local Kabadiwala
  recyclePaper: -25,   // Sold paper/cartons to Kabadiwala
  recyclePlastic: -25, // Recycled milk packets and plastic delivery covers
  recycleGlass: -15,   // Cleaned and re-used glass jars for pickles/spices
  recycleMetal: -30,   // Diverted tin cans, batteries, and old copper wires
  compostWaste: -45    // Composting kitchen wet waste at home
};

/**
 * Calculates current baseline carbon footprint based on user inputs for Indian citizens
 */
export function calculateBaseline(input: BaselineInput): BaselineResult {
  // 1. Transport Annual emissions in km
  const vehicleFactor = TRANSPORT_FACTORS.vehicle[input.vehicleType] || 0;
  const vehicleEmissions = input.vehicleAnnualMiles * vehicleFactor;
  const transitEmissions = input.publicTransitWeeklyMiles * 52 * TRANSPORT_FACTORS.publicTransit;
  const flightEmissions = (input.shorthaulFlightsYear * TRANSPORT_FACTORS.flightShorthaul) +
                          (input.longhaulFlightsYear * TRANSPORT_FACTORS.flightLonghaul);
  const transportation = Math.round(vehicleEmissions + transitEmissions + flightEmissions);

  // 2. Household Energy Annual emissions in INR (₹)
  const electricityEmissions = (input.electricityMonthlyCost * 12) * ENERGY_FACTORS.electricityPerINR;
  // Deduct electricity based on clean source fraction (e.g., home solar panels / PM Surya Ghar Yojana)
  const electricEmissionsCleaned = electricityEmissions * (1 - input.electricityCleanFraction / 100);

  const gasEmissions = (input.naturalGasMonthlyCost * 12) * ENERGY_FACTORS.cookingGasPerINR;

  const coolingHeatingFactor = ENERGY_FACTORS.heating[input.otherHeatingSource] || 0;
  const coolingHeatingEmissions = (input.otherHeatingMonthlyCost * 12) * coolingHeatingFactor;

  // Since bills are typically for the whole household, assume a shared family household size of 4 people in India
  // We divide home energy by 4.0 to reflect a personal footprint allocation, keeping it realistic for Indian families
  const energy = Math.round((electricEmissionsCleaned + gasEmissions + coolingHeatingEmissions) / 4.0);

  // 3. Diet Annual emissions
  let dietEmissions = DIET_FACTORS[input.dietType] || 900;
  // Deduct a discount if eating organic/regional produce sourced from local mandis
  const organicDeduction = dietEmissions * (input.organicFraction / 100) * 0.08;
  const diet = Math.round(dietEmissions - organicDeduction);

  // 4. Waste Annual emissions
  let wasteEmissions = WASTE_FACTORS.annualBaseline;
  if (input.recyclePaper) wasteEmissions += WASTE_FACTORS.recyclePaper;
  if (input.recyclePlastic) wasteEmissions += WASTE_FACTORS.recyclePlastic;
  if (input.recycleGlass) wasteEmissions += WASTE_FACTORS.recycleGlass;
  if (input.recycleMetal) wasteEmissions += WASTE_FACTORS.recycleMetal;
  if (input.compostWaste) wasteEmissions += WASTE_FACTORS.compostWaste;
  
  // Clamp at a minimal threshold
  const waste = Math.max(40, Math.round(wasteEmissions));

  const total = transportation + energy + diet + waste;

  return {
    transportation,
    energy,
    diet,
    waste,
    total
  };
}

export interface PresetAction {
  id: string;
  category: CarbonCategory;
  title: string;
  description: string;
  impactKg: number;
}

// Custom Indian eco-action presets supporting daily tracking
export const PRESET_DAILY_ACTIONS: PresetAction[] = [
  // Transportation Actions
  {
    id: "act_transit",
    category: "transport",
    title: "Commute via Metro / Local Train",
    description: "Took the local train, subway, or suburban rail instead of solo riding in a car, saving high fuel emissions.",
    impactKg: 3.2
  },
  {
    id: "act_bike_walk",
    category: "transport",
    title: "Eco Commute (Walk/Cycle/E-scooter)",
    description: "Walked, bicycled, or rode an electric scooter for close commutes or nearby marketplace runs.",
    impactKg: 1.5
  },
  {
    id: "act_carpool",
    category: "transport",
    title: "Shared Auto-Rickshaw / E-Rik",
    description: "Chose to ride a shared CNG auto-rickshaw or electric e-rickshaw instead of flagging a private taxi.",
    impactKg: 1.2
  },
  {
    id: "act_remote_work",
    category: "transport",
    title: "Work From Home (WFH)",
    description: "Skipped the daily gridlock and fuel consumption completely by working remotely today.",
    impactKg: 4.0
  },

  // Energy reduction
  {
    id: "act_wash_cold",
    category: "energy",
    title: "Air-Drying Laundry in Sun",
    description: "Hung clothes on laundry lines in daylight, leveraging natural solar heat instead of power-hungry machine heating.",
    impactKg: 0.8
  },
  {
    id: "act_line_dry",
    category: "energy",
    title: "Swapped AC for Ceiling Fan",
    description: "Kept the high-power AC off. Sensationed comfort using a 5-star energy efficient ceiling fan or desert cooler instead.",
    impactKg: 2.5
  },
  {
    id: "act_eco_temp",
    category: "energy",
    title: "Turned Off Geyser Promptly",
    description: "Turned off the water heating geyser immediately after 15 minutes of heating, avoiding standby energy leakage.",
    impactKg: 1.4
  },
  {
    id: "act_vampire_power",
    category: "energy",
    title: "Unplugged Smart Boards Chargers",
    description: "Turned off physical switches and power boards for TV, routers, and charges before sleeping to prevent phantom loads.",
    impactKg: 0.3
  },

  // Food & Diet
  {
    id: "act_vegan_day",
    category: "diet",
    title: "Vegan & Ghee-Free Day",
    description: "Avoided dairy, ghee, butter, and paneer today, eating purely plant-based meals like dal, subzis, and roti.",
    impactKg: 4.5
  },
  {
    id: "act_vegetarian_meal",
    category: "diet",
    title: "Traditional High-Fiber Veg Meal",
    description: "Relished a traditional homemade vegetarian plate (dal, rice, seasonal vegetables), completely avoiding meat options.",
    impactKg: 2.2
  },
  {
    id: "act_prevent_waste",
    category: "diet",
    title: "Zero Waste Mandi Shopping",
    description: "Sourced fresh local ingredients from the local subzi mandi using cloth bags, avoiding packaged foods.",
    impactKg: 1.1
  },

  // Waste & Circular economy
  {
    id: "act_plastic_free",
    category: "waste",
    title: "Reused Cloth Bags ('Thaili')",
    description: "Carried a physical cotton carry-bag for shopping, successfully avoiding single-use plastic carrier covers.",
    impactKg: 0.6
  },
  {
    id: "act_upcycle",
    category: "waste",
    title: "Kabadiwala Scrap Sorting",
    description: "Sorted out cardboard, newspapers, plastic pet bottles, and solid tin cans to sell directly to the Kabadiwala.",
    impactKg: 5.0
  },
  {
    id: "act_compost_bin",
    category: "waste",
    title: "Diverted Wet Waste to Compost",
    description: "Segregated wet vegetable/fruit wastes into a home composting bin instead of throwing them in combined trash.",
    impactKg: 0.8
  }
];

// Reference averages for comparative indicators tailored for Indian contexts
// India's per capita carbon emissions stand at ~1.9 metric tons (1900 kg CO2 / year)
export const CO2_GLOBAL_AVERAGES = {
  us: 15500,        // 15.5 metric tons
  world: 4700,      // 4.7 metric tons
  india: 1900,      // 1.9 metric tons (Indian Average personal baseline)
  sustainable: 2000 // 2.0 metric tons (ideal target to stay within 1.5C climate threshold)
};
