import React from "react";
import { CO2_GLOBAL_AVERAGES } from "../utils/carbonCalculations";

interface MetricCardProps {
  totalKg: number;
  onNavigateToCalculator: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ totalKg, onNavigateToCalculator }) => {
  const tons = (totalKg / 1000).toFixed(1);
  const percentOfUS = Math.round((totalKg / CO2_GLOBAL_AVERAGES.us) * 100);
  const percentOfWorld = Math.round((totalKg / CO2_GLOBAL_AVERAGES.world) * 100);
  const meetsSustainable = totalKg <= CO2_GLOBAL_AVERAGES.sustainable;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-emerald-400 font-mono text-xs tracking-widest uppercase">Your Annual Footprint</span>
          <h2 className="text-4xl md:text-5xl font-sans font-bold tracking-tight mt-1">
            {tons} <span className="text-lg font-normal text-slate-400">Metric Tons CO₂e / yr</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-light">
            Calculated baseline based on your transit fuel, home power bills, nutrition lifestyle, and waste recycling.
          </p>
        </div>

        <button
          id="btn-recalc"
          type="button"
          onClick={onNavigateToCalculator}
          aria-label="Adjust baseline inputs"
          className="px-4 py-2 border border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-600 rounded-lg text-xs font-medium cursor-pointer transition"
        >
          Adjust Inputs
        </button>
      </div>

      {/* Benchmark indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40">
          <span className="text-slate-500 text-xs font-medium">vs US Average (15.5t)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-xl font-semibold font-mono ${percentOfUS <= 100 ? "text-emerald-400" : "text-amber-400"}`}>
              {percentOfUS}%
            </span>
            <span className="text-xs text-slate-400">of average</span>
          </div>
          <div
            className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(100, percentOfUS)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`US average comparison: ${percentOfUS}%`}
          >
            <div
              className={`h-full rounded-full ${percentOfUS <= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, percentOfUS)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40">
          <span className="text-slate-500 text-xs font-medium">vs World Average (4.7t)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-xl font-semibold font-mono ${percentOfWorld <= 100 ? "text-emerald-400" : "text-amber-400"}`}>
              {percentOfWorld}%
            </span>
            <span className="text-xs text-slate-400">of average</span>
          </div>
          <div
            className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(100, percentOfWorld)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`World average comparison: ${percentOfWorld}%`}
          >
            <div
              className={`h-full rounded-full ${percentOfWorld <= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, percentOfWorld)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40">
          <span className="text-slate-500 text-xs font-medium">Sustainable Ceiling (2.0t)</span>
          <div className="flex items-baseline gap-2 mt-1">
            {meetsSustainable ? (
              <span className="text-xl font-semibold font-mono text-emerald-400">Achieved 🎉</span>
            ) : (
              <span className="text-xl font-semibold font-mono text-slate-300">
                +{(totalKg / 1000 - 2.0).toFixed(1)}t
              </span>
            )}
            <span className="text-xs text-slate-400">remaining to goal</span>
          </div>
          <div
            className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(100, (totalKg / CO2_GLOBAL_AVERAGES.sustainable) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Sustainable ceiling progress: ${Math.min(100, Math.round((totalKg / CO2_GLOBAL_AVERAGES.sustainable) * 100))}%`}
          >
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${Math.min(100, (totalKg / CO2_GLOBAL_AVERAGES.sustainable) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
