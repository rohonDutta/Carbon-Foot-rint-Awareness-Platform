import React, { useState, useEffect, useMemo } from "react";
import { getInitialState, saveState } from "./utils/storage";
import { calculateBaseline, PRESET_DAILY_ACTIONS, CO2_GLOBAL_AVERAGES, PresetAction } from "./utils/carbonCalculations";
import { calculateUpdatedStreak } from "./utils/streak";
import { AppState, BaselineInput, DailyLogItem, RecommendationItem, ChatMessage, CarbonCategory } from "./types";
import { 
  Leaf, 
  Car, 
  Flame, 
  Utensils, 
  Trash2, 
  Compass, 
  Plus, 
  MessageSquare, 
  Send, 
  BookmarkCheck, 
  Info, 
  X, 
  TrendingDown, 
  Trophy, 
  Zap, 
  RefreshCw,
  AlertCircle,
  Users,
  Share2,
  Award,
  Calendar,
  Lock,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { ProgressCenter } from "./components/ProgressCenter";
import { SocialHub } from "./components/SocialHub";
import { Badge } from "./types";

export default function App() {
  const [state, setState] = useState<AppState>(getInitialState);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [activeLogDate, setActiveLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [customActionTitle, setCustomActionTitle] = useState("");
  const [customActionImpact, setCustomActionImpact] = useState<number>(2);
  const [customActionCategory, setCustomActionCategory] = useState<CarbonCategory>("transport");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("carbonwise_username") || "Aarav Sharma";
  });
  const [isEditingName, setIsEditingName] = useState(false);

  // Auto-persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Handle user name persistence
  useEffect(() => {
    localStorage.setItem("carbonwise_username", userName);
  }, [userName]);

  // Recalculates baseline values whenever the input fields change
  const handleInputChange = <K extends keyof BaselineInput>(key: K, value: BaselineInput[K]) => {
    setState((prev) => {
      const updatedInputs = { ...prev.baselineInput, [key]: value };
      const updatedResult = calculateBaseline(updatedInputs);
      return {
        ...prev,
        baselineInput: updatedInputs,
        baselineResult: updatedResult,
      };
    });
  };

  // Social interactive groups handler
  const handleJoinGroup = (groupId: string) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              joined: !g.joined,
              memberCount: g.joined ? g.memberCount - 1 : g.memberCount + 1,
            }
          : g
      ),
    }));
  };

  // Social challenges sprint handler
  const handleJoinChallenge = (challengeId: string) => {
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              joined: !c.joined,
              participants: c.joined ? c.participants - 1 : c.participants + 1,
            }
          : c
      ),
    }));
  };

  // Create custom focus group handler
  const handleCreateGroup = (name: string, description: string, targetCategory: CarbonCategory | "all") => {
    const newGroup = {
      id: "group_" + Date.now(),
      name,
      description,
      memberCount: 1,
      joined: true,
      targetCategory,
      totalSavedKg: 0,
    };
    setState((prev) => ({
      ...prev,
      groups: [newGroup, ...prev.groups],
    }));
  };

  // Dynamic badge evaluation selector
  const computedBadges = useMemo(() => {
    const logs = state.dailyLogs || [];
    const counts = {
      diet: logs.filter((l) => l.category === "diet").length,
      transport: logs.filter((l) => l.category === "transport").length,
      energy: logs.filter((l) => l.category === "energy").length,
      waste: logs.filter((l) => l.category === "waste").length,
    };

    const streak = state.streakState?.currentStreakCount || 0;

    return (state.badges || []).map((badge) => {
      let achieved = badge.achieved;
      if (badge.id === "badge_meatless" && counts.diet >= 2) achieved = true;
      if (badge.id === "badge_commuter" && counts.transport >= 1) achieved = true;
      if (badge.id === "badge_energy" && counts.energy >= 2) achieved = true;
      if (badge.id === "badge_waste" && counts.waste >= 2) achieved = true;
      if (badge.id === "badge_streak_3" && streak >= 3) achieved = true;

      return {
        ...badge,
        achieved,
        achievedAt: badge.achievedAt || (achieved ? new Date().toISOString().split("T")[0] : undefined),
      };
    });
  }, [state.dailyLogs, state.badges, state.streakState]);

  // Helper variables
  const { baselineInput, baselineResult, dailyLogs, recommendations, chatHistory, personalizedInsight, selectedTab } = state;

  // Calculate live cumulative reductions from daily logs
  const totalSavingsFromLogs = useMemo(() => {
    return dailyLogs.reduce((sum, item) => sum + item.impactKg, 0);
  }, [dailyLogs]);

  // Total recommendations savings checked off
  const recommendationsSavings = useMemo(() => {
    return recommendations
      .filter((r) => r.completed)
      .reduce((sum, item) => sum + (item.annualSavingsKg / 365), 0); // Convert annual estimate to a daily rate
  }, [recommendations]);

  // Score & points setup for gamification
  const totalUserPoints = useMemo(() => {
    const logPoints = dailyLogs.length * 50; // 50 points per log item
    const milestonePoints = Math.round(totalSavingsFromLogs * 10); // 10 points per kg CO2 saved
    const planPoints = recommendations.filter((r) => r.completed).length * 200; // 200 points per recommendation completed
    return logPoints + milestonePoints + planPoints;
  }, [dailyLogs, totalSavingsFromLogs, recommendations]);

  // Dynamic Rank Level based on Points
  const userRank = useMemo(() => {
    if (totalUserPoints >= 2500) return { title: "Forest Guardian", bg: "bg-emerald-500", text: "text-white" };
    if (totalUserPoints >= 1200) return { title: "Carbon Warrior", bg: "bg-amber-400", text: "text-slate-900" };
    if (totalUserPoints >= 500) return { title: "Bio-Active Citizen", bg: "bg-blue-400", text: "text-white" };
    return { title: "Seed Starter", bg: "bg-slate-300", text: "text-slate-700" };
  }, [totalUserPoints]);

  // Real-time Net Footprint (Annualized Baseline minus the logging & complete action rates)
  // For easy visuals, we annualized current daily log speeds (assuming steady habits)
  const estimatedAnnualReductionsRate = useMemo(() => {
    // Treat dailyLogs as continuous behaviors
    const logRateAnnual = totalSavingsFromLogs * 30; // Scale active actions
    const recommendationAnnual = recommendations.filter(r => r.completed).reduce((sum, item) => sum + item.annualSavingsKg, 0);
    return Math.round(logRateAnnual + recommendationAnnual);
  }, [totalSavingsFromLogs, recommendations]);

  const netAnnualFootprint = useMemo(() => {
    const net = baselineResult.total - estimatedAnnualReductionsRate;
    return Math.max(500, net); // clamp to biological minimum of 500kg
  }, [baselineResult.total, estimatedAnnualReductionsRate]);

  // Generate Personalized Expert Plan using server-side Gemini JSON endpoint
  const requestAICarbonPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseline: baselineResult,
          logs: dailyLogs,
        }),
      });
      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setState((prev) => ({
          ...prev,
          lastPlanGeneratedAt: new Date().toISOString(),
          personalizedInsight: data.personalizedInsight || prev.personalizedInsight,
          recommendations: data.recommendations,
        }));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error("Failed to generate climate plan:", e);
      alert("Unable to reach the Gemini server. Please check your secrets configuration and network.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Live query chat to CarbonWise Eco Assist
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      role: "user",
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    // Update with user's input immediately
    const updatedHistory = [...chatHistory, userMsg];
    setState((prev) => ({
      ...prev,
      chatHistory: updatedHistory,
    }));
    setChatInput("");
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      if (data.text) {
        const botMsg: ChatMessage = {
          id: "assistant_" + Date.now(),
          role: "assistant",
          content: data.text,
          timestamp: new Date().toISOString(),
        };
        setState((prev) => ({
          ...prev,
          chatHistory: [...prev.chatHistory, botMsg],
        }));
      } else if (data.error) {
        setState((prev) => ({
          ...prev,
          chatHistory: [
            ...prev.chatHistory,
            {
              id: "err_" + Date.now(),
              role: "assistant",
              content: `⚠️ Sorry, I encountered an issue: ${data.error}`,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      }
    } catch (err) {
      console.error("Chat error:", err);
      setState((prev) => ({
        ...prev,
        chatHistory: [
          ...prev.chatHistory,
          {
            id: "err_" + Date.now(),
            role: "assistant",
            content: `⚠️ Under-the-hood error: Could not reach the endpoint. Make sure the development server is active on Port 3000.`,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      setIsSendingChat(false);
    }
  };

  // Add Daily Log entry
  const handleAddLog = (action: Partial<DailyLogItem>) => {
    const newItem: DailyLogItem = {
      id: "log_" + Date.now(),
      date: activeLogDate,
      category: action.category || "waste",
      title: action.title || "Sustainable Action",
      description: action.description || "",
      impactKg: action.impactKg || 1,
    };

    setState((prev) => {
      // Calculate streak updates
      const updatedStreak = calculateUpdatedStreak(
        newItem.date,
        prev.streakState?.currentStreakCount || 0,
        prev.streakState?.longestStreakCount || 0,
        prev.streakState?.lastActiveDate || null
      );

      // Increment values for joined challenges
      const updatedChallenges = (prev.challenges || []).map((chall) => {
        if (chall.joined) {
          if (chall.id === "chall_meat_free" && newItem.category === "diet") {
            return { ...chall, progressKg: Math.min(chall.goalKg, chall.progressKg + newItem.impactKg) };
          }
          if (chall.id === "chall_commuter" && newItem.category === "transport") {
            return { ...chall, progressKg: Math.min(chall.goalKg, chall.progressKg + newItem.impactKg) };
          }
          if (chall.id === "chall_dryer_free" && newItem.category === "energy" && newItem.title.toLowerCase().includes("dry")) {
            return { ...chall, progressKg: Math.min(chall.goalKg, chall.progressKg + newItem.impactKg) };
          }
        }
        return chall;
      });

      // Increment values for joined community groups
      const updatedGroups = (prev.groups || []).map((g) => {
        if (g.joined && (g.targetCategory === newItem.category || g.targetCategory === "all")) {
          return { ...g, totalSavedKg: g.totalSavedKg + newItem.impactKg };
        }
        return g;
      });

      return {
        ...prev,
        dailyLogs: [newItem, ...prev.dailyLogs],
        streakState: updatedStreak,
        challenges: updatedChallenges,
        groups: updatedGroups
      };
    });
  };

  // Remove Daily Log entry
  const handleRemoveLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter((l) => l.id !== id),
    }));
  };

  // Check off or toggle AI actions
  const handleToggleAction = (id: string) => {
    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec) =>
        rec.id === id ? { ...rec, completed: !rec.completed } : rec
      ),
    }));
  };

  // Handle custom manual log insertion
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActionTitle.trim()) return;

    handleAddLog({
      category: customActionCategory,
      title: customActionTitle,
      description: "Custom tracked action on " + activeLogDate,
      impactKg: Number(customActionImpact) || 1,
    });

    setCustomActionTitle("");
    setShowCustomForm(false);
  };

  // Reset demo states back to helpful defaults
  const handleFactoryResetState = () => {
    if (confirm("Are you sure you want to reset all custom carbon measurements and logs?")) {
      localStorage.removeItem("carbonwise_tracker_state");
      localStorage.removeItem("carbonwise_username");
      setUserName("Jane Doe");
      setState(getInitialState());
    }
  };

  // Styling helpers
  const categoryColors = {
    transport: "emerald-500",
    energy: "blue-500",
    diet: "amber-500",
    waste: "indigo-500"
  };

  const categoryLabelBg = {
    transport: "bg-emerald-50 text-emerald-800 border-emerald-200",
    energy: "bg-blue-50 text-blue-800 border-blue-200",
    diet: "bg-amber-50 text-amber-800 border-amber-200",
    waste: "bg-indigo-50 text-indigo-800 border-indigo-200"
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4] text-[#1A2E22] font-sans antialiased p-4 md:p-8 flex flex-col justify-between">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:font-bold"
      >
        Skip to main content
      </a>
      
      {/* 1. Header Section */}
      <header className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center bg-white/70 backdrop-blur-md rounded-3xl p-5 md:p-6 mb-8 shadow-sm gap-4 border border-[#e1eded]">
        {/* Brand logo & name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md" aria-hidden="true">
            <Leaf className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-emerald-950 block">CO₂-ZERO</span>
            <p className="text-[10px] text-emerald-800/60 font-bold uppercase tracking-widest mt-0.5">CarbonWise Tracker</p>
          </div>
        </div>

        {/* Global tab navigation */}
        <nav className="flex flex-wrap justify-center gap-1 bg-white/80 p-1.5 rounded-2xl border border-slate-100" aria-label="Main sections">
          <div role="tablist" className="flex flex-wrap justify-center gap-1">
          <button 
            type="button"
            role="tab"
            id="tab-calculator"
            aria-selected={selectedTab === "calculator"}
            aria-controls="panel-calculator"
            onClick={() => setState(prev => ({ ...prev, selectedTab: "calculator" }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedTab === "calculator" ? "bg-emerald-500 text-white shadow-sm" : "opacity-70 hover:opacity-100 text-emerald-950 font-semibold"}`}
          >
            Baseline Calculator
          </button>
          
          <button 
            type="button"
            role="tab"
            id="tab-logs"
            aria-selected={selectedTab === "logs"}
            aria-controls="panel-logs"
            onClick={() => setState(prev => ({ ...prev, selectedTab: "logs" }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1 ${selectedTab === "logs" ? "bg-emerald-500 text-white shadow-sm" : "opacity-70 hover:opacity-100 text-emerald-950 font-semibold"}`}
          >
            Daily Green Logs
            {dailyLogs.length > 0 && (
              <span className="w-5 h-5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full flex items-center justify-center font-bold" aria-label={`${dailyLogs.length} log entries`}>
                {dailyLogs.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            role="tab"
            id="tab-planner"
            aria-selected={selectedTab === "planner"}
            aria-controls="panel-planner"
            onClick={() => setState(prev => ({ ...prev, selectedTab: "planner" }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedTab === "planner" ? "bg-emerald-500 text-white shadow-sm" : "opacity-70 hover:opacity-100 text-emerald-950 font-semibold"}`}
          >
            AI Action Planner
          </button>

          <button 
            type="button"
            role="tab"
            id="tab-progress"
            aria-selected={selectedTab === "progress"}
            aria-controls="panel-progress"
            onClick={() => setState(prev => ({ ...prev, selectedTab: "progress" }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${selectedTab === "progress" ? "bg-emerald-500 text-white shadow-sm" : "opacity-70 hover:opacity-100 text-emerald-950 font-semibold"}`}
          >
            <Award className="w-3.5 h-3.5" aria-hidden="true" />
            Progress & Badges
          </button>

          <button 
            type="button"
            role="tab"
            id="tab-social"
            aria-selected={selectedTab === "social"}
            aria-controls="panel-social"
            onClick={() => setState(prev => ({ ...prev, selectedTab: "social" }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${selectedTab === "social" ? "bg-emerald-500 text-white shadow-sm" : "opacity-70 hover:opacity-100 text-emerald-950 font-semibold"}`}
          >
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            Social Hub
          </button>

          <button 
            type="button"
            role="tab"
            id="tab-assistant"
            aria-selected={selectedTab === "assistant"}
            aria-controls="panel-assistant"
            onClick={() => setState(prev => ({ ...prev, selectedTab: "assistant" }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${selectedTab === "assistant" ? "bg-emerald-500 text-white shadow-sm" : "opacity-70 hover:opacity-100 text-emerald-950 font-semibold"}`}
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            Eco Assist AI
          </button>
          </div>
        </nav>

        {/* User Identity widget */}
        <div id="user-profile-badge" className="flex items-center gap-3.5 bg-slate-50/50 p-2 pr-4 rounded-2xl border border-slate-100">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Climate Badge</span>
            {isEditingName ? (
              <input
                id="profile-name-input"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                aria-label="Edit your display name"
                className="text-xs font-bold text-slate-800 max-w-[100px] border-b border-emerald-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)} 
                className="font-bold text-emerald-950 text-sm hover:text-emerald-700 cursor-pointer flex items-center justify-end gap-1"
                aria-label={`Edit display name: ${userName}`}
              >
                {userName}
              </button>
            )}
            <p className="text-xs font-semibold text-emerald-600 block">{userRank.title}</p>
          </div>
          <div className={`w-11 h-11 ${userRank.bg} ${userRank.text} rounded-xl flex items-center justify-center font-black text-sm tracking-tight shadow-sm`} aria-hidden="true">
            {userName.substring(0,2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* 2. Main Visual Canvas */}
      <main id="main-content" className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 flex-1">
        
        {/* LEFT COLUMN: Carbon Hero Dial & Quick Stats (Takes 5 cols of 12) */}
        <section className="lg:col-span-5 bg-emerald-500 rounded-[3rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-emerald-950/10 min-h-[500px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-100/80">Active Performance Status</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/40 rounded-full text-[10px] font-black uppercase text-emerald-100">
                <Trophy className="w-3 h-3 text-amber-300" aria-hidden="true" />
                {totalUserPoints} pts
              </div>
            </div>
            
            <h2 className="text-3xl font-black leading-tight mt-3">
              Great job,{" "}
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="underline decoration-wavy decoration-emerald-300 cursor-pointer"
                aria-label={`Edit name: ${userName.split(" ")[0]}`}
              >
                {userName.split(" ")[0]}
              </button>
              !<br/>
              Let's shave tons of CO₂.
            </h2>
            <p className="text-emerald-50/90 text-sm mt-2 font-medium">
              Every small daily conservation action compound targets. Switch tabs to adjust estimates.
            </p>
          </div>

          {/* DYNAMIC CIRCULAR CARBON DIAL */}
          <div className="flex flex-col items-center justify-center py-6">
            <div
              className="relative w-52 h-52 flex items-center justify-center"
              role="img"
              aria-label={`Net annual carbon footprint: ${(netAnnualFootprint / 1000).toFixed(2)} metric tonnes CO₂e per year`}
            >
              <svg className="w-full h-full -rotate-90" aria-hidden="true">
                {/* Background path trail */}
                <circle 
                  cx="104" 
                  cy="104" 
                  r="92" 
                  fill="transparent" 
                  stroke="rgba(255,255,255,0.15)" 
                  strokeWidth="14" 
                />
                {/* Active usage arc */}
                <circle 
                  cx="104" 
                  cy="104" 
                  r="92" 
                  fill="transparent" 
                  stroke="#fff" 
                  strokeWidth="14" 
                  strokeDasharray="578" 
                  strokeDashoffset={Math.max(0, 578 - (578 * Math.min(100, (netAnnualFootprint / baselineResult.total) * 100)) / 100)} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              {/* Inner dial data display */}
              <div className="absolute text-center">
                <p className="text-5xl font-black tracking-tighter" id="net-carbon-metric" aria-hidden="true">
                  {(netAnnualFootprint / 1000).toFixed(2)}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">MT CO₂e / yr (Net)</p>
                
                {estimatedAnnualReductionsRate > 0 && (
                  <div className="mt-2 bg-emerald-600/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-[10px] font-bold text-emerald-100">
                    <TrendingDown className="w-3 h-3 text-emerald-300" aria-hidden="true" />
                    -{estimatedAnnualReductionsRate} kg log savings
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footprint Category Breakdown and Goal Targets */}
          <div className="space-y-4">
            <div className="bg-emerald-600/50 rounded-[2.2rem] p-5 flex flex-col gap-3">
              <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                <span>Category Baseline Indicators</span>
                <span className="text-emerald-200">Values in kg CO₂</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold tracking-tight">
                <div className="bg-emerald-700/30 p-2 rounded-xl border border-white/5">
                  <Car className="w-4 h-4 mx-auto mb-1 text-emerald-200" aria-hidden="true" />
                  <span className="block text-slate-100">Transport</span>
                  <span className="text-xs font-extrabold text-white font-mono">{baselineResult.transportation}</span>
                </div>
                <div className="bg-emerald-700/30 p-2 rounded-xl border border-white/5">
                  <Flame className="w-4 h-4 mx-auto mb-1 text-emerald-200" aria-hidden="true" />
                  <span className="block text-slate-100">Energy</span>
                  <span className="text-xs font-extrabold text-white font-mono">{baselineResult.energy}</span>
                </div>
                <div className="bg-emerald-700/30 p-2 rounded-xl border border-white/5">
                  <Utensils className="w-4 h-4 mx-auto mb-1 text-emerald-200" aria-hidden="true" />
                  <span className="block text-slate-100">Diet</span>
                  <span className="text-xs font-extrabold text-white font-mono">{baselineResult.diet}</span>
                </div>
                <div className="bg-emerald-700/30 p-2 rounded-xl border border-white/5">
                  <Trash2 className="w-4 h-4 mx-auto mb-1 text-emerald-200" aria-hidden="true" />
                  <span className="block text-slate-100">Waste</span>
                  <span className="text-xs font-extrabold text-white font-mono">{baselineResult.waste}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2 opacity-80 font-bold">
              <span>Ideal Sustainable Target: {CO2_GLOBAL_AVERAGES.sustainable / 1000} Tonnes</span>
              <span>Indian Nat'l Avg: {CO2_GLOBAL_AVERAGES.india / 1000} Tonnes</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Workspaces (Takes 7 cols of 12) */}
        <section className="lg:col-span-7 flex flex-col gap-6">

          {/* TAB 1: Baseline Carbon Footprint Calculator */}
          {selectedTab === "calculator" && (
            <div
              id="panel-calculator"
              role="tabpanel"
              aria-labelledby="tab-calculator"
              className="bg-white rounded-[3rem] p-6 md:p-8 shadow-sm border border-[#e1eded] flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Lifestyle Baseline Assessment</h3>
                    <p className="text-xs font-semibold text-emerald-700/80 mt-1">
                      Customize typical weekly transportation, utility usage, and dietary stats to build your baseline map.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-wider">
                    EPA/DEFRA Math
                  </span>
                </div>

                {/* Subsections of Baseline Form */}
                <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                  
                  {/* Transportation block */}
                  <div className="border-b border-slate-100 pb-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
                      <div className="p-1 px-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs">A</div>
                      Transportation & Air Travel
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="input-vehicleType" className="block text-xs font-extrabold text-slate-500 mb-1.5">Primary Vehicle type</label>
                        <select
                          id="input-vehicleType"
                          value={baselineInput.vehicleType}
                          onChange={(e) => handleInputChange("vehicleType", e.target.value as any)}
                          className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800"
                        >
                          <option value="none">No Private Vehicle (Walk/Cycle)</option>
                          <option value="gas_small">Hatchback / Small Car (Petrol/CNG)</option>
                          <option value="gas_medium">Sedan / Compact SUV (Petrol/Diesel)</option>
                          <option value="gas_large">SUV / Large Utility Vehicle (Diesel)</option>
                          <option value="hybrid">Two-Wheeler (Motorcycle / Scooter)</option>
                          <option value="electric">Electric Vehicle (EV/E-Bike)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="input-vehicleMiles" className="block text-xs font-extrabold text-slate-500 mb-1.5">Annual Kilometers Driven (km)</label>
                        <input
                          id="input-vehicleMiles"
                          type="number"
                          min="0"
                          max="150000"
                          step="500"
                          value={baselineInput.vehicleAnnualMiles}
                          onChange={(e) => handleInputChange("vehicleAnnualMiles", Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label htmlFor="input-weeklyTransit" className="block text-xs font-extrabold text-slate-500 mb-1.5">Public Transit Travel (km/week)</label>
                        <input
                          id="input-weeklyTransit"
                          type="number"
                          min="0"
                          max="2000"
                          value={baselineInput.publicTransitWeeklyMiles}
                          onChange={(e) => handleInputChange("publicTransitWeeklyMiles", Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="input-shorthaul" className="block text-[10px] font-extrabold text-slate-500 mb-1.5" title="Flights within India">Domestic Flights/Yr</label>
                          <input
                            id="input-shorthaul"
                            type="number"
                            min="0"
                            max="50"
                            value={baselineInput.shorthaulFlightsYear}
                            onChange={(e) => handleInputChange("shorthaulFlightsYear", Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label htmlFor="input-longhaul" className="block text-[10px] font-extrabold text-slate-500 mb-1.5" title="Flights traveling abroad">International Flights/Yr</label>
                          <input
                            id="input-longhaul"
                            type="number"
                            min="0"
                            max="30"
                            value={baselineInput.longhaulFlightsYear}
                            onChange={(e) => handleInputChange("longhaulFlightsYear", Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Home Energy block */}
                  <div className="border-b border-slate-100 pb-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 font-mono">
                      <div className="p-1 px-2 bg-blue-50 text-blue-700 rounded-lg text-xs">B</div>
                      Household Electricity & Cooking Gas
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="input-electricityBill" className="block text-xs font-extrabold text-slate-500 mb-1.5">Monthly Electricity Bill (INR ₹)</label>
                        <input
                          id="input-electricityBill"
                          type="number"
                          min="0"
                          max="150000"
                          value={baselineInput.electricityMonthlyCost}
                          onChange={(e) => handleInputChange("electricityMonthlyCost", Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label htmlFor="input-cleanElectricPower" className="block text-xs font-extrabold text-slate-500 mb-1.5">Rooftop Solar power share %</label>
                        <div className="flex items-center gap-2">
                          <input
                            id="input-cleanElectricPower"
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={baselineInput.electricityCleanFraction}
                            onChange={(e) => handleInputChange("electricityCleanFraction", Number(e.target.value))}
                            className="flex-1 accent-emerald-500"
                          />
                          <span className="w-12 text-right text-xs font-bold text-slate-700 font-mono">
                            {baselineInput.electricityCleanFraction}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="input-naturalGas" className="block text-xs font-extrabold text-slate-500 mb-1.5">Monthly Cooking Gas - LPG/PNG (INR ₹)</label>
                        <input
                          id="input-naturalGas"
                          type="number"
                          min="0"
                          max="30000"
                          value={baselineInput.naturalGasMonthlyCost}
                          onChange={(e) => handleInputChange("naturalGasMonthlyCost", Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label htmlFor="input-otherHeating" className="block text-xs font-extrabold text-slate-500 mb-1.5">Air Conditioning & Geyser Usage</label>
                        <select
                          id="input-otherHeating"
                          value={baselineInput.otherHeatingSource}
                          onChange={(e) => handleInputChange("otherHeatingSource", e.target.value as any)}
                          className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800"
                        >
                          <option value="none">None / Ceiling Fans Only</option>
                          <option value="oil">Geyser / Water Heater Only</option>
                          <option value="propane">Low/Moderate Air Conditioning</option>
                          <option value="wood">High/Heavy Air Conditioning</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Food & Waste section */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
                      <div className="p-1 px-2 bg-amber-50 text-amber-700 rounded-lg text-xs">C</div>
                      Nutrition and Waste Recyclability
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="input-dietPreference" className="block text-xs font-extrabold text-slate-500 mb-1.5">Primary Diet Preference</label>
                        <select
                          id="input-dietPreference"
                          value={baselineInput.dietType}
                          onChange={(e) => handleInputChange("dietType", e.target.value as any)}
                          className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800"
                        >
                          <option value="vegan">100% Vegan (No Curd, Ghee, Paneer, or Meat)</option>
                          <option value="vegetarian">Strict Jain / Sattvik (Regional Veg, No Root Vegetables)</option>
                          <option value="low_meat">Pure Lacto-Vegetarian (Standard Veg, Ghee/Paneer included)</option>
                          <option value="avg_meat">Eggitarian / Occasional Chicken & Fish</option>
                          <option value="high_meat">Regular Non-Vegetarian (Frequent Chicken, Mutton, or Fish)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="input-organicRatio" className="block text-xs font-extrabold text-slate-500 mb-1.5">Local Mandi / Sabzi Market Sourcing %</label>
                        <div className="flex items-center gap-2">
                          <input
                            id="input-organicRatio"
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            value={baselineInput.organicFraction}
                            onChange={(e) => handleInputChange("organicFraction", Number(e.target.value))}
                            className="flex-1 accent-emerald-500"
                          />
                          <span className="w-12 text-right text-xs font-bold text-slate-700 font-mono">
                            {baselineInput.organicFraction}%
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-extrabold text-slate-500 mb-2">Segregated & Recycled Waste Modes</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-extrabold text-slate-700 cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={baselineInput.recyclePaper}
                              onChange={(e) => handleInputChange("recyclePaper", e.target.checked)}
                              className="accent-emerald-500"
                            />
                            Paper (Kabadiwala)
                          </label>
                          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-extrabold text-slate-700 cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={baselineInput.recyclePlastic}
                              onChange={(e) => handleInputChange("recyclePlastic", e.target.checked)}
                              className="accent-emerald-500"
                            />
                            Milk Packets / PET
                          </label>
                          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-extrabold text-slate-700 cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={baselineInput.recycleGlass}
                              onChange={(e) => handleInputChange("recycleGlass", e.target.checked)}
                              className="accent-emerald-500"
                            />
                            Pickle Jars Reused
                          </label>
                          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-extrabold text-slate-700 cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={baselineInput.recycleMetal}
                              onChange={(e) => handleInputChange("recycleMetal", e.target.checked)}
                              className="accent-emerald-500"
                            />
                            Metal / Wire Trade
                          </label>
                          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-extrabold text-slate-700 cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={baselineInput.compostWaste}
                              onChange={(e) => handleInputChange("compostWaste", e.target.checked)}
                              className="accent-emerald-500"
                            />
                            Wet Waste Compost
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick warning indicator on baseline inputs */}
              <div className="mt-8 border-t border-slate-100 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Your total footprint responds in real-time as selectors are modified.
                </span>
                <button
                  type="button"
                  id="btn-re-calc-baseline"
                  onClick={handleFactoryResetState}
                  aria-label="Reset all carbon measurements and logs"
                  className="text-xs font-extrabold text-red-500 hover:text-red-700 cursor-pointer tracking-wider uppercase border border-red-50 py-1 px-3 rounded-lg hover:bg-red-50/50"
                >
                  Reset Measurements
                </button>
              </div>
            </div>
          )}


          {/* TAB 2: Daily Green Action Logs */}
          {selectedTab === "logs" && (
            <div
              id="panel-logs"
              role="tabpanel"
              aria-labelledby="tab-logs"
              className="bg-white rounded-[3rem] p-6 md:p-8 shadow-sm border border-[#e1eded] flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Daily Action Logger</h3>
                    <p className="text-xs font-semibold text-emerald-700/80 mt-1">
                      Log specific eco-actions performed today to subtract kilograms directly from your net footprint.
                    </p>
                  </div>
                  <label htmlFor="log-date-picker" className="sr-only">Log date</label>
                  <input
                    id="log-date-picker"
                    type="date"
                    value={activeLogDate}
                    onChange={(e) => setActiveLogDate(e.target.value)}
                    aria-label="Select log date"
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer"
                  />
                </div>

                {/* Sub-panels for logs: Quick Preset Clicks! */}
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">Quick Presets: Click to Log Action</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {PRESET_DAILY_ACTIONS.map((act) => {
                      const catColor = categoryColors[act.category];
                      return (
                        <button
                          key={act.id}
                          id={`preset-btn-${act.id}`}
                          onClick={() => handleAddLog(act)}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-left hover:bg-white hover:border-emerald-500 transition cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `var(--color-${catColor}, currentColor)` }} />
                            <div className="truncate">
                              <p className="font-extrabold text-slate-800 truncate">{act.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{act.description}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                            -{act.impactKg} kg
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Switch to enable Custom Event Logger */}
                <div className="mb-6">
                  {showCustomForm ? (
                    <form onSubmit={handleCustomSubmit} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-slate-700">Add Custom Action Event</span>
                        <button
                          type="button"
                          onClick={() => setShowCustomForm(false)} 
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          aria-label="Close custom action form"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label htmlFor="custom-action-title" className="block text-[10px] font-extrabold text-slate-500 mb-1">What did you do?</label>
                          <input
                            id="custom-action-title"
                            type="text"
                            placeholder="e.g. Swapped incandescent bulb for LED"
                            value={customActionTitle}
                            onChange={(e) => setCustomActionTitle(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="custom-action-impact" className="block text-[10px] font-extrabold text-slate-500 mb-1">Impact (kg CO₂e saved)</label>
                          <input
                            id="custom-action-impact"
                            type="number"
                            min="0.1"
                            max="100.0"
                            step="0.1"
                            value={customActionImpact}
                            onChange={(e) => setCustomActionImpact(Number(e.target.value))}
                            className="w-full bg-white p-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          {(["transport", "energy", "diet", "waste"] as CarbonCategory[]).map((c) => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setCustomActionCategory(c)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${customActionCategory === c ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Save Custom Action
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(true)}
                      className="w-full py-2 border border-dashed border-slate-300 rounded-2xl hover:border-emerald-500 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50/50 hover:bg-white transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" /> Add Custom Activity Log
                    </button>
                  )}
                </div>

                {/* Log Entries Grid */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
                    Recent Saved Actions Historical Activity
                  </h4>
                  {dailyLogs.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm font-bold text-slate-400">No active logs recorded. Use the presets above to seed events.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {dailyLogs.map((log) => {
                        return (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-xs"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${categoryLabelBg[log.category] || ""}`}>
                                {log.category.toUpperCase()}
                              </span>
                              <div className="truncate">
                                <p className="text-sm font-bold text-slate-900 truncate">{log.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Log Date: {log.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-black text-emerald-600">
                                -{log.impactKg} kg
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveLog(log.id)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded-md transition cursor-pointer"
                                aria-label={`Remove log: ${log.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Aggregated Footer Reductions */}
              <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-between bg-emerald-50/60 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800/80 tracking-wider">Total Avoided Carbon</span>
                    <p className="text-base font-black text-emerald-950 mt-0.5">{totalSavingsFromLogs.toFixed(1)} kg CO₂ Saved</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Points Earned</span>
                  <span className="text-sm font-mono font-bold text-slate-900">+{Math.round(totalSavingsFromLogs * 10)} XP</span>
                </div>
              </div>
            </div>
          )}


          {/* TAB 3: AI Action Planner (Real JSON endpoint & Checkbox tasks) */}
          {selectedTab === "planner" && (
            <div
              id="panel-planner"
              role="tabpanel"
              aria-labelledby="tab-planner"
              className="bg-white rounded-[3rem] p-6 md:p-8 shadow-sm border border-[#e1eded] flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">AI Personalized Action Planner</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Leverage Gemini 3.5 Flash to automatically crawl your baseline indicators and generate a target-saving dynamic road map.
                    </p>
                  </div>
                  
                  <button
                    id="btn-getplan"
                    onClick={requestAICarbonPlan}
                    disabled={isGeneratingPlan}
                    className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2 tracking-wide shadow-sm"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Generating Road Map...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        Generate Plan using Gemini
                      </>
                    )}
                  </button>
                </div>

                {/* Custom Goal Configurator form */}
                <div className="bg-[#F0F7F4] border border-emerald-100 p-5 rounded-3xl mb-6">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    Set Your Carbon Reduction Goal
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                      <label htmlFor="goal-percent-select" className="block text-[10px] font-black text-emerald-900/60 uppercase tracking-widest mb-1.5">
                        Target Percentage Reduction
                      </label>
                      <select
                        value={state.reductionGoal?.percentTarget || 10}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setState((prev) => ({
                            ...prev,
                            reductionGoal: {
                              ...prev.reductionGoal,
                              percentTarget: val,
                              isCustom: true,
                            },
                          }));
                        }}
                        className="w-full bg-white px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-850 focus:outline-none focus:border-emerald-500"
                        id="goal-percent-select"
                      >
                        <option value="5">5% Reduction (Moderate)</option>
                        <option value="10">10% Reduction (Recommended Balanced)</option>
                        <option value="15">15% Reduction (Committed Climate Champion)</option>
                        <option value="20">20% Reduction (High Ambition Plan)</option>
                        <option value="30">30% Reduction (Aggressive Climate Leader)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="goal-timeframe-select" className="block text-[10px] font-black text-emerald-900/60 uppercase tracking-widest mb-1.5">
                        Timeframe (Months)
                      </label>
                      <select
                        value={state.reductionGoal?.timeframeMonths || 3}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setState((prev) => ({
                            ...prev,
                            reductionGoal: {
                              ...prev.reductionGoal,
                              timeframeMonths: val,
                              isCustom: true,
                            },
                          }));
                        }}
                        className="w-full bg-white px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-850 focus:outline-none focus:border-emerald-500"
                        id="goal-timeframe-select"
                      >
                        <option value="1">1 Month (Sprint Action)</option>
                        <option value="2">2 Months (Short Term)</option>
                        <option value="3">3 Months (Standard Quarter)</option>
                        <option value="6">6 Months (Mid Term Vision)</option>
                        <option value="12">12 Months (Full Cycle Year)</option>
                      </select>
                    </div>

                    <div>
                      <button
                        type="button"
                        id="btn-update-goal-plan"
                        onClick={requestAICarbonPlan}
                        disabled={isGeneratingPlan}
                        className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 disabled:bg-slate-300 text-white rounded-2xl text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1.5"
                      >
                        {isGeneratingPlan ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-300" />
                        )}
                        Sync & Update Roadmap
                      </button>
                    </div>
                  </div>
                </div>

                {/* Personalized Critique Box */}
                {personalizedInsight && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 mb-6 flex gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                      <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">CarbonWise Audit Insight</span>
                      <p className="text-xs font-bold leading-relaxed text-slate-800 mt-1">
                        {personalizedInsight}
                      </p>
                    </div>
                  </div>
                )}

                {/* Interactive targeted recommendations checkboxes */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                      Live Roadmap Action Exercises
                    </h4>
                    {state.lastPlanGeneratedAt && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Updated: {new Date(state.lastPlanGeneratedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                    {recommendations.map((rec) => {
                      return (
                        <div
                          key={rec.id}
                          className={`p-4 rounded-3xl border transition flex items-start gap-4 ${rec.completed ? "bg-slate-50 border-slate-200/60" : "bg-white hover:bg-slate-50/50 border-slate-100 shadow-xs"}`}
                        >
                          <input
                            type="checkbox"
                            checked={!!rec.completed}
                            onChange={() => handleToggleAction(rec.id)}
                            className="w-5 h-5 rounded-md accent-emerald-500 text-white cursor-pointer mt-0.5 shrink-0"
                            id={`check-rec-${rec.id}`}
                            aria-label={`Mark recommendation complete: ${rec.title}`}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${categoryLabelBg[rec.category] || "bg-slate-50 text-slate-800"}`}>
                                {rec.category}
                              </span>
                              
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide ${rec.difficulty === 'easy' ? 'bg-green-50 text-green-700 border border-green-200' : rec.difficulty === 'moderate' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {rec.difficulty}
                              </span>

                              <span className="text-[9px] font-medium text-slate-400">
                                {rec.estimatedCost}
                              </span>
                            </div>

                            <p className={`text-sm font-extrabold text-slate-900 mt-2 ${rec.completed ? 'line-through text-slate-400' : ''}`}>
                              {rec.title}
                            </p>
                            <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${rec.completed ? 'text-slate-400' : ''}`}>
                              {rec.description}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Annual Savings</span>
                            <span className={`text-xs font-mono font-black ${rec.completed ? 'text-slate-400' : 'text-emerald-600'}`}>
                              -{rec.annualSavingsKg} kg
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <BookmarkCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Checking item avoids carbon continuously and gains +200 XP.
                </span>
                <span className="font-bold">
                  {recommendations.filter(r => r.completed).length} / {recommendations.length} Active Completed
                </span>
              </div>
            </div>
          )}


          {/* TAB 4: CarbonWise Eco Assist AI Assistant (Persistent chat window) */}
          {selectedTab === "assistant" && (
            <div
              id="panel-assistant"
              role="tabpanel"
              aria-labelledby="tab-assistant"
              className="bg-[#1A2E22] rounded-[3rem] p-6 md:p-8 text-white flex-1 flex flex-col justify-between shadow-xl min-h-[500px]"
            >
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center" aria-hidden="true">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base leading-tight">Eco Assist Expert</h3>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                        Gemini 3.5 Active
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Reset chat log?")) {
                        setState(prev => ({
                          ...prev,
                          chatHistory: [
                            {
                              id: "msg_init_" + Date.now(),
                              role: "assistant",
                              content: "Chat history cleared. Custom footprint questions or local transport recommendations? Speak to me directly.",
                              timestamp: new Date().toISOString()
                            }
                          ]
                        }));
                      }
                    }}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-200 cursor-pointer p-1"
                    aria-label="Clear chat history"
                  >
                    Clear Chat
                  </button>
                </div>

                {/* Dialog Chat messages box */}
                <div
                  className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-4 scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent"
                  role="log"
                  aria-live="polite"
                  aria-label="Chat messages"
                >
                  {chatHistory.map((m) => {
                    const isBot = m.role === "assistant";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${isBot ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60" : "bg-emerald-500 text-white rounded-tr-none"}`}
                        >
                          {/* Parse bold texts or raw line returns simply */}
                          <div className="whitespace-pre-wrap font-medium">
                            {m.content}
                          </div>
                        </div>
                        <span className="text-[9px] text-emerald-300/40 mt-1 uppercase tracking-wider font-mono">
                          {isBot ? "Eco Advisor" : userName.split(" ")[0]} • {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    );
                  })}

                  {isSendingChat && (
                    <div className="flex items-center gap-2 text-emerald-300/60 text-xs font-medium italic pl-1" role="status" aria-live="polite">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" aria-hidden="true" />
                      CarbonWise is studying parameters...
                    </div>
                  )}
                </div>
              </div>

              {/* Input action toolbar */}
              <form onSubmit={handleChatSubmit} className="mt-4">
                <div className="relative flex items-center">
                  <input
                    id="chat-user-input"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask standard questions. e.g. How does methane differ from CO2?"
                    disabled={isSendingChat}
                    aria-label="Message to Eco Assist AI"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-3.5 pl-4 pr-12 text-xs font-medium text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSendingChat}
                    aria-label="Send message"
                    className="absolute right-2 p-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-white rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: Progress tracking, consistency streaks, and medals */}
          {selectedTab === "progress" && (
            <div id="panel-progress" role="tabpanel" aria-labelledby="tab-progress">
            <ProgressCenter
              state={state}
              dailyLogs={dailyLogs}
              totalSavingsFromLogs={totalSavingsFromLogs}
              recommendationsSavingsRate={recommendations.filter((r) => r.completed).reduce((sum, item) => sum + item.annualSavingsKg, 0)}
              computedBadges={computedBadges}
            />
            </div>
          )}

          {/* TAB 6: Collaborative Groups, climate sprints, and global social feed */}
          {selectedTab === "social" && (
            <div id="panel-social" role="tabpanel" aria-labelledby="tab-social">
            <SocialHub
              state={state}
              onJoinGroup={handleJoinGroup}
              onJoinChallenge={handleJoinChallenge}
              onCreateGroup={handleCreateGroup}
              totalSavingsFromLogs={totalSavingsFromLogs}
            />
            </div>
          )}

        </section>

      </main>

      {/* 3. Footer info section */}
      <footer className="max-w-7xl mx-auto w-full text-center mt-8 pt-6 border-t border-[#e1eded]/60 block text-emerald-950/40 text-[10px] font-extrabold uppercase tracking-widest">
        <span>© 2026 CO₂-ZERO ENVIRONMENT PROJECT • POWERED BY GEMINI 3.5 FLASH • DURABLE STATE REGISTERED</span>
      </footer>

    </div>
  );
}

// Sparkle graphic component for AI insights decoration
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </svg>
  );
}
