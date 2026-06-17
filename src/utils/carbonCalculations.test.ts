import { describe, it, expect } from "vitest";
import {
  calculateBaseline,
  PRESET_DAILY_ACTIONS,
  CO2_GLOBAL_AVERAGES,
} from "./carbonCalculations";
import { BaselineInput } from "../types";

const baseInput: BaselineInput = {
  vehicleType: "gas_small",
  vehicleAnnualMiles: 5000,
  publicTransitWeeklyMiles: 20,
  shorthaulFlightsYear: 1,
  longhaulFlightsYear: 0,
  electricityMonthlyCost: 1500,
  electricityCleanFraction: 0,
  naturalGasMonthlyCost: 400,
  otherHeatingSource: "none",
  otherHeatingMonthlyCost: 0,
  dietType: "low_meat",
  organicFraction: 20,
  recyclePaper: true,
  recyclePlastic: true,
  recycleGlass: true,
  recycleMetal: false,
  compostWaste: true,
};

describe("calculateBaseline", () => {
  it("returns all category fields and a total equal to their sum", () => {
    const result = calculateBaseline(baseInput);

    expect(result).toHaveProperty("transportation");
    expect(result).toHaveProperty("energy");
    expect(result).toHaveProperty("diet");
    expect(result).toHaveProperty("waste");
    expect(result).toHaveProperty("total");

    expect(result.transportation).toBeGreaterThan(0);
    expect(result.energy).toBeGreaterThan(0);
    expect(result.diet).toBeGreaterThan(0);
    expect(result.waste).toBeGreaterThan(0);

    expect(result.total).toBe(
      result.transportation + result.energy + result.diet + result.waste
    );
  });

  it("returns zero transport emissions when no vehicle and no flights", () => {
    const result = calculateBaseline({
      ...baseInput,
      vehicleType: "none",
      vehicleAnnualMiles: 0,
      publicTransitWeeklyMiles: 0,
      shorthaulFlightsYear: 0,
      longhaulFlightsYear: 0,
    });

    expect(result.transportation).toBe(0);
  });

  it("reduces energy emissions when clean electricity fraction increases", () => {
    const noSolar = calculateBaseline({ ...baseInput, electricityCleanFraction: 0 });
    const fullSolar = calculateBaseline({ ...baseInput, electricityCleanFraction: 100 });

    expect(fullSolar.energy).toBeLessThan(noSolar.energy);
  });

  it("assigns lower diet emissions to vegan than high-meat diets", () => {
    const vegan = calculateBaseline({ ...baseInput, dietType: "vegan" });
    const highMeat = calculateBaseline({ ...baseInput, dietType: "high_meat" });

    expect(vegan.diet).toBeLessThan(highMeat.diet);
  });

  it("reduces waste emissions when all recycling options are enabled", () => {
    const minimal = calculateBaseline({
      ...baseInput,
      recyclePaper: false,
      recyclePlastic: false,
      recycleGlass: false,
      recycleMetal: false,
      compostWaste: false,
    });
    const maximal = calculateBaseline({
      ...baseInput,
      recyclePaper: true,
      recyclePlastic: true,
      recycleGlass: true,
      recycleMetal: true,
      compostWaste: true,
    });

    expect(maximal.waste).toBeLessThan(minimal.waste);
  });

  it("clamps waste at minimum threshold of 40 kg", () => {
    const result = calculateBaseline({
      ...baseInput,
      recyclePaper: true,
      recyclePlastic: true,
      recycleGlass: true,
      recycleMetal: true,
      compostWaste: true,
    });

    expect(result.waste).toBeGreaterThanOrEqual(40);
  });

  it("increases transport with long-haul flights", () => {
    const noFlights = calculateBaseline({ ...baseInput, longhaulFlightsYear: 0 });
    const withFlights = calculateBaseline({ ...baseInput, longhaulFlightsYear: 2 });

    expect(withFlights.transportation).toBeGreaterThan(noFlights.transportation);
  });
});

describe("PRESET_DAILY_ACTIONS", () => {
  it("contains actions for every carbon category", () => {
    const categories = new Set(PRESET_DAILY_ACTIONS.map((a) => a.category));
    expect(categories).toContain("transport");
    expect(categories).toContain("energy");
    expect(categories).toContain("diet");
    expect(categories).toContain("waste");
  });

  it("assigns positive impact values to every preset", () => {
    PRESET_DAILY_ACTIONS.forEach((action) => {
      expect(action.impactKg).toBeGreaterThan(0);
      expect(action.id).toBeTruthy();
      expect(action.title).toBeTruthy();
    });
  });
});

describe("CO2_GLOBAL_AVERAGES", () => {
  it("defines reference benchmarks in ascending order for India and sustainable targets", () => {
    expect(CO2_GLOBAL_AVERAGES.sustainable).toBeLessThan(CO2_GLOBAL_AVERAGES.world);
    expect(CO2_GLOBAL_AVERAGES.india).toBeLessThan(CO2_GLOBAL_AVERAGES.world);
    expect(CO2_GLOBAL_AVERAGES.world).toBeLessThan(CO2_GLOBAL_AVERAGES.us);
  });
});
