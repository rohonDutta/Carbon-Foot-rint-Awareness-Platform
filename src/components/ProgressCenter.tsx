import React, { useMemo, useState } from "react";
import { AppState, Badge } from "../types";
import { 
  Trophy, 
  Award, 
  Zap, 
  Flame, 
  Utensils, 
  Car, 
  Trash2, 
  Lock, 
  CheckCircle, 
  TrendingDown, 
  Sparkles
} from "lucide-react";

interface ProgressCenterProps {
  state: AppState;
  totalSavingsFromLogs: number;
  recommendationsSavingsRate: number; // in kg/yr
  computedBadges: Badge[];
}

export const ProgressCenter: React.FC<ProgressCenterProps> = ({ 
  state, 
  totalSavingsFromLogs, 
  recommendationsSavingsRate,
  computedBadges
}) => {
  const { streakState, reductionGoal } = state;
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // SVG Chart Dimensions
  const chartWidth = 540;
  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 35;

  const monthlyFootprintData = useMemo(() => {
    const monthlyBaseline = state.baselineResult.total / 12;
    
    // Seed average reductions for prior months to show a beautiful descending visual curve
    return [
      { month: "Jan 2026", baseline: monthlyBaseline, actual: monthlyBaseline * 0.96 },
      { month: "Feb 2026", baseline: monthlyBaseline, actual: monthlyBaseline * 0.91 },
      { month: "Mar 2026", baseline: monthlyBaseline, actual: monthlyBaseline * 0.88 },
      { month: "Apr 2026", baseline: monthlyBaseline, actual: monthlyBaseline * 0.84 },
      { month: "May 2026", baseline: monthlyBaseline, actual: monthlyBaseline * 0.82 },
      { 
        month: "Jun 2026", 
        baseline: monthlyBaseline, 
        // Actual incorporates the real savings from user's current logged items & completed checkmarks
        actual: Math.max(50, monthlyBaseline - totalSavingsFromLogs - (recommendationsSavingsRate / 12)) 
      },
    ];
  }, [state.baselineResult.total, totalSavingsFromLogs, recommendationsSavingsRate]);

  // SVG Drawing Helpers
  const maxVal = useMemo(() => {
    return Math.max(...monthlyFootprintData.map(d => d.baseline)) * 1.1;
  }, [monthlyFootprintData]);

  const points = useMemo(() => {
    return monthlyFootprintData.map((d, idx) => {
      const x = paddingLeft + (idx / (monthlyFootprintData.length - 1)) * (chartWidth - paddingLeft - paddingRight);
      const yBaseline = chartHeight - paddingBottom - (d.baseline / maxVal) * (chartHeight - paddingTop - paddingBottom);
      const yActual = chartHeight - paddingBottom - (d.actual / maxVal) * (chartHeight - paddingTop - paddingBottom);
      return { x, yBaseline, yActual, label: d.month, baseline: d.baseline, actual: d.actual };
    });
  }, [monthlyFootprintData, maxVal]);

  const baselinePath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yBaseline}`).join(" ");
  }, [points]);

  const actualPath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yActual}`).join(" ");
  }, [points]);

  const actualAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const p1 = points[0];
    const pLast = points[points.length - 1];
    const lineCoords = points.map(p => `L ${p.x} ${p.yActual}`).join(" ");
    return `M ${p1.x} ${chartHeight - paddingBottom} L ${p1.x} ${p1.yActual} ${lineCoords} L ${pLast.x} ${chartHeight - paddingBottom} Z`;
  }, [points]);

  // Helper Badge Icon Router
  const getBadgeIcon = (iconName: string, active: boolean) => {
    const sizeCls = "w-6 h-6 stroke-[2.2]";
    switch(iconName) {
      case "Utensils":
        return <Utensils className={`${sizeCls} ${active ? "text-amber-500" : "text-slate-400"}`} aria-hidden="true" />;
      case "Car":
        return <Car className={`${sizeCls} ${active ? "text-emerald-500" : "text-slate-400"}`} aria-hidden="true" />;
      case "Zap":
        return <Zap className={`${sizeCls} ${active ? "text-blue-500" : "text-slate-400"}`} aria-hidden="true" />;
      case "Trash2":
        return <Trash2 className={`${sizeCls} ${active ? "text-indigo-500" : "text-slate-400"}`} aria-hidden="true" />;
      default:
        return <Trophy className={`${sizeCls} ${active ? "text-amber-400" : "text-slate-400"}`} aria-hidden="true" />;
    }
  };

  const savedThisMonthKg = Math.round(totalSavingsFromLogs + (recommendationsSavingsRate / 12));

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between" id="progress-center-stage">
      
      {/* SECTION 1: MAIN CHARTS AND STATS BENTO ROW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* CHART CONTAINER: Takes 8/12 on large screens */}
        <div className="md:col-span-8 bg-white rounded-[2.5rem] p-6 border border-[#e1eded] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Baseline vs Actual Trend
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight mt-2 flex items-center gap-1.5">
                  Monthly CO₂ Footprint over Time
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Your carbon trail is dropping! Real-time logging updates the June metric.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-extrabold">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-0.5 border-t border-dashed border-slate-300 block" /> Baseline
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-1.5 bg-emerald-500 rounded-sm block" /> Actual
                </span>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="relative overflow-visible my-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible"
                role="img"
                aria-label="Monthly carbon footprint trend chart comparing baseline and actual emissions from January to June"
              >
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                  const y = chartHeight - paddingBottom - ratio * (chartHeight - paddingTop - paddingBottom);
                  const gridVal = Math.round(ratio * maxVal);
                  return (
                    <g key={gridIdx}>
                      <line 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={chartWidth - paddingRight} 
                        y2={y} 
                        stroke="#F1F5F9" 
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={y + 3} 
                        fill="#94A3B8" 
                        fontSize="9" 
                        fontWeight="bold" 
                        textAnchor="end"
                        className="font-mono"
                      >
                        {gridVal}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis labels */}
                {points.map((p, idx) => (
                  <text
                    key={idx}
                    x={p.x}
                    y={chartHeight - 12}
                    fill="#94A3B8"
                    fontSize="9"
                    fontWeight="extrabold"
                    textAnchor="middle"
                  >
                    {p.label.split(" ")[0]}
                  </text>
                ))}

                {/* Filled Area Gradient under actual */}
                <path d={actualAreaPath} fill="url(#chartGlow)" />

                {/* Baseline Guide Path */}
                <path 
                  d={baselinePath} 
                  fill="none" 
                  stroke="#94A3B8" 
                  strokeWidth="1.5" 
                  strokeDasharray="5 5" 
                  strokeOpacity="0.6"
                />

                {/* Actual Footprint Path */}
                <path 
                  d={actualPath} 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive circles and hover handles */}
                {points.map((p, idx) => {
                  const isHovered = hoveredMonth === idx;
                  return (
                    <g 
                      key={idx}
                      onMouseEnter={() => setHoveredMonth(idx)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="cursor-pointer"
                    >
                      {/* Invisible fat interaction guide line */}
                      <line 
                        x1={p.x} 
                        y1={paddingTop} 
                        x2={p.x} 
                        y2={chartHeight - paddingBottom} 
                        stroke="transparent" 
                        strokeWidth="15" 
                      />

                      {/* Interactive active line indicator on hover */}
                      {isHovered && (
                        <line 
                          x1={p.x} 
                          y1={paddingTop} 
                          x2={p.x} 
                          y2={chartHeight - paddingBottom} 
                          stroke="#10B981" 
                          strokeWidth="1" 
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Baseline coordinate point */}
                      <circle 
                        cx={p.x} 
                        cy={p.yBaseline} 
                        r="3" 
                        fill="#94A3B8" 
                      />

                      {/* Actual coordinate outer pulse */}
                      <circle 
                        cx={p.x} 
                        cy={p.yActual} 
                        r={isHovered ? "8" : "5"} 
                        fill="#10B981" 
                        className="transition-all duration-200 fill-emerald-400/30"
                      />

                      {/* Actual coordinate inner core */}
                      <circle 
                        cx={p.x} 
                        cy={p.yActual} 
                        r="3" 
                        fill="#FFFFFF" 
                        stroke="#10B981"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Float popover value summary */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-100 text-[10px] font-bold py-1.5 px-3 rounded-full flex gap-3 shadow-md">
                {hoveredMonth !== null ? (
                  <>
                    <span className="text-slate-400">{points[hoveredMonth].label}:</span>
                    <span className="font-mono text-emerald-400">{(points[hoveredMonth].actual).toFixed(0)} kg CO₂ (Actual)</span>
                    <span className="text-slate-500 border-l border-slate-800 pl-3">Baseline: {(points[hoveredMonth].baseline).toFixed(0)} kg</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>June actual emissions reduced by <strong className="text-emerald-400 font-mono font-black">{savedThisMonthKg} kg</strong> this month</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#F0F7F4] border border-emerald-100 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-950 mt-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Current reduction goal: <strong>{reductionGoal.percentTarget}% reduction</strong> over {reductionGoal.timeframeMonths} months.</span>
            </span>
            <div className="font-mono text-emerald-700">
              Start: {reductionGoal.startDate}
            </div>
          </div>
        </div>

        {/* STREAK CONTAINER: Takes 4/12 on large screens */}
        <div className="md:col-span-4 bg-[#1A2E22] rounded-[2.5rem] p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Consistency</span>
                <h3 className="text-xl font-bold leading-tight mt-1">Green Streak</h3>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
              </div>
            </div>

            <div className="text-center py-6">
              <span className="text-6xl font-black tracking-tighter text-amber-300 font-mono" id="current-streak-val" aria-label={`Current streak: ${streakState.currentStreakCount} days`}>
                {streakState.currentStreakCount}
              </span>
              <p className="text-xs uppercase font-extrabold tracking-widest text-emerald-300 mt-2">Consecutive Days Active</p>
              
              <div className="mt-4 bg-emerald-500/10 px-4 py-2 rounded-2xl inline-flex gap-2 items-center text-xs text-emerald-100 border border-emerald-800/50">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Longest record streak: <strong>{streakState.longestStreakCount} days</strong></span>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-800/70 pt-4 mt-2">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2.5">
              Weekly Activity Logs
            </span>
            <div className="grid grid-cols-7 gap-2.5 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                // Mock active logging days based on seed logs and current streak
                const isLogged = idx <= 3 || (streakState.currentStreakCount > idx);
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 border ${isLogged ? "bg-amber-400 border-amber-300 text-slate-900" : "bg-emerald-900/40 border-emerald-800/40 text-emerald-600"}`}
                    >
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-emerald-400 font-semibold leading-normal mt-3">
              *Logging an eco-positive event resets any timer and maintains daily habits. Keep it active!
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 2: MILESTONES & ACHIEVEMENTS GRID */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-[#e1eded] shadow-xs">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Environmental Achievement Medals
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Compete to earn and unlock prestigious badges by completing tasks and registering your daily offset logs.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            Unlocked: {computedBadges.filter(b => b.achieved).length} / {computedBadges.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {computedBadges.map((badge) => {
            return (
              <div 
                key={badge.id}
                className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${badge.achieved ? "bg-emerald-50/40 border-emerald-200/65 shadow-xs" : "bg-slate-50/50 border-slate-100 opacity-70"}`}
              >
                {/* Visual lock status for gamified systems */}
                {!badge.achieved && (
                  <div className="absolute top-2 right-2 p-1 bg-slate-200/50 md:p-1 md:bg-transparent rounded-full text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
                {badge.achieved && (
                  <div className="absolute top-2 right-2 p-1 text-emerald-600 scale-110">
                    <CheckCircle className="w-3.5 h-3.5 fill-emerald-100" />
                  </div>
                )}

                <div>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3.5 ${badge.achieved ? "bg-emerald-100" : "bg-slate-100"}`}>
                    {getBadgeIcon(badge.iconName, badge.achieved)}
                  </div>
                  
                  <h4 className="text-xs font-black text-slate-900 leading-tight uppercase tracking-tight">
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 lines-clamp-3 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Target</span>
                  <span className={badge.achieved ? "text-emerald-700 font-extrabold" : "text-slate-500"}>
                    {badge.requirement}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
