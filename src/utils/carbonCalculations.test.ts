import { describe, it, expect } from 'vitest';
import { calculateBaseline } from './carbonCalculations';
import { BaselineInput } from '../types';

describe('Carbon Calculations', () => {
  it('should accurately calculate the baseline carbon footprint', () => {
    const mockInput: BaselineInput = {
      vehicleType: 'gas_small',
      vehicleAnnualMiles: 5000,
      publicTransitWeeklyMiles: 20,
      shorthaulFlightsYear: 1,
      longhaulFlightsYear: 0,
      electricityMonthlyCost: 1500,
      electricityCleanFraction: 0,
      naturalGasMonthlyCost: 400,
      otherHeatingSource: 'none',
      otherHeatingMonthlyCost: 0,
      dietType: 'low_meat',
      organicFraction: 20,
      recyclePaper: true,
      recyclePlastic: true,
      recycleGlass: true,
      recycleMetal: false,
      compostWaste: true
    };

    const result = calculateBaseline(mockInput);

    // Verify all properties exist
    expect(result).toHaveProperty('transportation');
    expect(result).toHaveProperty('energy');
    expect(result).toHaveProperty('diet');
    expect(result).toHaveProperty('waste');
    expect(result).toHaveProperty('total');

    // Verify values are strictly mathematical and positive
    expect(result.transportation).toBeGreaterThan(0);
    expect(result.energy).toBeGreaterThan(0);
    expect(result.diet).toBeGreaterThan(0);
    expect(result.waste).toBeGreaterThan(0);

    // Total must equal sum of individual parts
    expect(result.total).toBe(
      result.transportation + result.energy + result.diet + result.waste
    );
  });
});
