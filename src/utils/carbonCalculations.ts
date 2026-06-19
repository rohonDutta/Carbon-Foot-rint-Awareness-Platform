import { BaselineInput, BaselineResult, CarbonCategory } from "../types";

/**
 * Indian emission factors calibrated to regional grid intensity, LPG cylinder weights,
 * fuel economy norms, and IPCC lifecycle analyses for Indian food systems.
 *
 * Units: kg CO₂-equivalent per unit (km, INR, flight leg, year).
 */

// ---------------------------------------------------------------------------
// Transport emission factors (kg CO₂e per km)
// ---------------------------------------------------------------------------
const TRANSPORT_FACTORS = {
  vehicle: {
    none:       0,      // Walking / cycling
    gas_small:  0.11,   // Petrol/CNG hatchback (e.g. Maruti Swift, WagonR)
    gas_medium: 0.16,   // Petrol/Diesel sedan or compact SUV (e.g. Honda City, Creta)
    gas_large:  0.22,   // Large Diesel SUV / utility vehicle (e.g. Fortuner, Innova)
    hybrid:     0.08,   // Two-wheeler (motorcycle/scooter) — extremely common in India
    electric:   0.05,   // EV under coal-heavy Indian grid (~0.82 kg CO₂/kWh)
  } as Record<BaselineInput["vehicleType"], number>,
  /** kg CO₂e per passenger-km across Delhi/Namma/Mumbai Metro, local train, shared bus */
  publicTransit: 0.025,
  /** kg CO₂e per domestic flight leg (average India ~1 400 km sector) */
  flightDomestic: 120,
  /** kg CO₂e per international flight leg */
  flightInternational: 650,
} as const;

// ---------------------------------------------------------------------------
// Home energy emission factors
// ---------------------------------------------------------------------------

/**
 * Indian average electricity tariff: ~₹8/kWh.
 * Grid emission intensity: ~0.82 kg CO₂/kWh.
 * Therefore 1 INR ≈ 0.125 kWh ≈ 0.10 kg CO₂.
 */
const ELECTRICITY_PER_INR = 0.10; // kg CO₂ per ₹ spent on electricity

/**
 * LPG: 14.2 kg cylinder ≈ ₹1 000 → ~42 kg CO₂.
 * PNG: similar CO₂-per-rupee ratio.
 * Therefore 1 INR ≈ 0.042 kg CO₂ for cooking gas.
 */
const COOKING_GAS_PER_INR = 0.042; // kg CO₂ per ₹ spent on LPG/PNG

/**
 * Supplementary cooling/heating load factors (kg CO₂ per ₹ of monthly cost).
 * Mapped to the `otherHeatingSource` selector options.
 */
const HEATING_FACTORS: Record<BaselineInput["otherHeatingSource"], number> = {
  none:    0,    // Ceiling fans only
  oil:     0.06, // Geyser / water heater only
  propane: 0.08, // Low/moderate air conditioning
  wood:    0.12, // Heavy air conditioning (Indian summer peak load)
};

// ---------------------------------------------------------------------------
// Diet emission factors (kg CO₂e per person per year)
// ---------------------------------------------------------------------------
const DIET_FACTORS: Record<BaselineInput["dietType"], number> = {
  vegan:      600,  // 100% plant-based; no ghee, milk, paneer, or honey
  vegetarian: 700,  // Strict Jain/Sattvik; no root vegetables
  low_meat:   900,  // Lacto-vegetarian (most common Indian diet; includes curd, paneer)
  avg_meat:   1300, // Eggitarian / occasional chicken or fish
  high_meat:  2200, // Regular non-vegetarian (daily or frequent meat consumption)
};

/**
 * Fraction by which local/organic sourcing discounts diet emissions.
 * Buying from regional mandis avoids long-haul cold-chain transport.
 */
const ORGANIC_DISCOUNT_RATE = 0.08; // 8% reduction per 100% organic fraction

// ---------------------------------------------------------------------------
// Waste emission factors (kg CO₂e per person per year)
// ---------------------------------------------------------------------------

/** Baseline personal waste emissions assuming all waste goes to landfill. */
const WASTE_BASELINE_KG = 180;

/** Annual CO₂ savings from specific recycling/composting behaviours (negative = reduction). */
const WASTE_SAVINGS = {
  recyclePaper:   -25, // Paper/cardboard sold to Kabadiwala
  recyclePlastic: -25, // PET bottles and milk packets recycled
  recycleGlass:   -15, // Glass jars reused or returned
  recycleMetal:   -30, // Tin cans, copper wire, scrap metal traded
  compostWaste:   -45, // Kitchen wet waste composted at home
} as const;

/** Minimum waste footprint after all recycling — biological/infrastructure floor. */
const WASTE_FLOOR_KG = 40;

// ---------------------------------------------------------------------------
// Household-size allocation factor
// ---------------------------------------------------------------------------

/**
 * Average Indian household size used to convert household energy bills
 * into a per-person footprint.
 * Source: Census of India 2011 average household size ≈ 4.0 persons.
 */
const HOUSEHOLD_SIZE = 4.0;

// ---------------------------------------------------------------------------
// Public export: global CO₂ reference averages (kg CO₂e per person per year)
// ---------------------------------------------------------------------------

/**
 * Per-capita carbon footprint benchmarks for comparative display.
 * India figure: ~1 900 kg (IEA 2023); sustainable threshold: 2 000 kg (1.5 °C pathway).
 */
export const CO2_GLOBAL_AVERAGES = {
  us:          15_500, // 15.5 metric tonnes (US average)
  world:        4_700, // 4.7 metric tonnes (global average)
  india:        1_900, // 1.9 metric tonnes (India national average)
  sustainable:  2_000, // 2.0 metric tonnes (IPCC 1.5 °C sustainable ceiling)
} as const;

// ---------------------------------------------------------------------------
// Core calculation function
// ---------------------------------------------------------------------------

/**
 * Calculates the estimated annual carbon footprint for an Indian resident
 * based on their self-reported lifestyle inputs.
 *
 * All monetary inputs must be in Indian Rupees (₹).
 * All distance inputs must be in kilometres (km).
 *
 * @param input - User-supplied baseline lifestyle parameters.
 * @returns      Annual kg CO₂e broken down by category and total.
 */
export function calculateBaseline(input: BaselineInput): BaselineResult {
  // 1. Transportation
  const vehicleFactor = TRANSPORT_FACTORS.vehicle[input.vehicleType] ?? 0;
  const vehicleEmissions = input.vehicleAnnualMiles * vehicleFactor;
  const transitEmissions = input.publicTransitWeeklyMiles * 52 * TRANSPORT_FACTORS.publicTransit;
  const flightEmissions =
    input.shorthaulFlightsYear * TRANSPORT_FACTORS.flightDomestic +
    input.longhaulFlightsYear  * TRANSPORT_FACTORS.flightInternational;
  const transportation = Math.round(vehicleEmissions + transitEmissions + flightEmissions);

  // 2. Household energy (allocated per person using HOUSEHOLD_SIZE)
  const grossElectricity =
    input.electricityMonthlyCost * 12 * ELECTRICITY_PER_INR;
  // Deduct the clean-energy fraction (rooftop solar / green tariff)
  const netElectricity = grossElectricity * (1 - input.electricityCleanFraction / 100);

  const gasEmissions = input.naturalGasMonthlyCost * 12 * COOKING_GAS_PER_INR;

  const heatingFactor = HEATING_FACTORS[input.otherHeatingSource] ?? 0;
  const heatingEmissions = input.otherHeatingMonthlyCost * 12 * heatingFactor;

  const energy = Math.round((netElectricity + gasEmissions + heatingEmissions) / HOUSEHOLD_SIZE);

  // 3. Diet
  const baseDiet = DIET_FACTORS[input.dietType] ?? DIET_FACTORS.low_meat;
  const organicSaving = baseDiet * (input.organicFraction / 100) * ORGANIC_DISCOUNT_RATE;
  const diet = Math.round(baseDiet - organicSaving);

  // 4. Waste
  let wasteEmissions = WASTE_BASELINE_KG;
  if (input.recyclePaper)   wasteEmissions += WASTE_SAVINGS.recyclePaper;
  if (input.recyclePlastic) wasteEmissions += WASTE_SAVINGS.recyclePlastic;
  if (input.recycleGlass)   wasteEmissions += WASTE_SAVINGS.recycleGlass;
  if (input.recycleMetal)   wasteEmissions += WASTE_SAVINGS.recycleMetal;
  if (input.compostWaste)   wasteEmissions += WASTE_SAVINGS.compostWaste;
  const waste = Math.max(WASTE_FLOOR_KG, Math.round(wasteEmissions));

  const total = transportation + energy + diet + waste;

  return { transportation, energy, diet, waste, total };
}

// ---------------------------------------------------------------------------
// Preset daily eco-actions for rapid logging
// ---------------------------------------------------------------------------

/** Shape of a preset eco-action the user can log with a single click. */
export interface PresetAction {
  id: string;
  category: CarbonCategory;
  title: string;
  description: string;
  /** Estimated kg CO₂e avoided compared to the default baseline behaviour. */
  impactKg: number;
}

/**
 * Curated list of common Indian eco-actions covering all four carbon categories.
 * Each entry represents a measurable daily behaviour change and its approximate
 * CO₂ avoidance relative to the default fossil-fuel / high-waste baseline.
 */
export const PRESET_DAILY_ACTIONS: PresetAction[] = [
  // -- Transportation --
  {
    id: "act_transit",
    category: "transport",
    title: "Commute via Metro / Local Train",
    description: "Took the local train, subway, or suburban rail instead of solo riding in a car.",
    impactKg: 3.2,
  },
  {
    id: "act_bike_walk",
    category: "transport",
    title: "Eco Commute (Walk / Cycle / E-scooter)",
    description: "Walked, bicycled, or rode an electric scooter for a short trip.",
    impactKg: 1.5,
  },
  {
    id: "act_carpool",
    category: "transport",
    title: "Shared Auto-Rickshaw / E-Rik",
    description: "Chose a shared CNG auto-rickshaw or electric e-rickshaw instead of a private taxi.",
    impactKg: 1.2,
  },
  {
    id: "act_remote_work",
    category: "transport",
    title: "Work From Home (WFH)",
    description: "Skipped the daily commute entirely by working remotely.",
    impactKg: 4.0,
  },

  // -- Home energy --
  {
    id: "act_wash_cold",
    category: "energy",
    title: "Air-Drying Laundry in Sun",
    description: "Hung clothes on laundry lines in daylight instead of using a powered dryer.",
    impactKg: 0.8,
  },
  {
    id: "act_line_dry",
    category: "energy",
    title: "Swapped AC for Ceiling Fan",
    description: "Kept the high-power AC off; used a 5-star BLDC ceiling fan or desert cooler.",
    impactKg: 2.5,
  },
  {
    id: "act_eco_temp",
    category: "energy",
    title: "Turned Off Geyser Promptly",
    description: "Switched off the geyser immediately after 15 minutes of heating.",
    impactKg: 1.4,
  },
  {
    id: "act_vampire_power",
    category: "energy",
    title: "Unplugged Smart Boards & Chargers",
    description: "Turned off power boards for TV, routers, and chargers before sleeping.",
    impactKg: 0.3,
  },

  // -- Diet --
  {
    id: "act_vegan_day",
    category: "diet",
    title: "Vegan & Ghee-Free Day",
    description: "Avoided all dairy and ghee today; ate purely plant-based meals.",
    impactKg: 4.5,
  },
  {
    id: "act_vegetarian_meal",
    category: "diet",
    title: "Traditional High-Fibre Veg Meal",
    description: "Relished a homemade vegetarian plate (dal, rice, seasonal sabzi) — no meat.",
    impactKg: 2.2,
  },
  {
    id: "act_prevent_waste",
    category: "diet",
    title: "Zero Waste Mandi Shopping",
    description: "Sourced fresh local ingredients from the subzi mandi using cloth bags.",
    impactKg: 1.1,
  },

  // -- Waste --
  {
    id: "act_plastic_free",
    category: "waste",
    title: "Reused Cloth Bags ('Thaili')",
    description: "Carried a cotton bag for shopping, avoiding single-use plastic covers.",
    impactKg: 0.6,
  },
  {
    id: "act_upcycle",
    category: "waste",
    title: "Kabadiwala Scrap Sorting",
    description: "Sorted cardboard, newspapers, PET bottles, and tin cans for the Kabadiwala.",
    impactKg: 5.0,
  },
  {
    id: "act_compost_bin",
    category: "waste",
    title: "Diverted Wet Waste to Compost",
    description: "Segregated vegetable/fruit wastes into a home composting bin.",
    impactKg: 0.8,
  },
];
