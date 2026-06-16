import React, { useState } from "react";
import { AppState, CommunityGroup, CommunityChallenge, CarbonCategory } from "../types";
import { 
  Users, 
  Share2, 
  Plus, 
  TrendingDown, 
  CheckCircle, 
  Check, 
  MessageSquare, 
  ArrowRight,
  Send,
  X,
  Sparkles,
  Info
} from "lucide-react";

interface SocialHubProps {
  state: AppState;
  onJoinGroup: (groupId: string) => void;
  onJoinChallenge: (challengeId: string) => void;
  onCreateGroup: (name: string, description: string, targetCategory: CarbonCategory | "all") => void;
  totalSavingsFromLogs: number;
}

// Simulated active community feed posts
const INITIAL_FEED_POSTS = [
  {
    id: "post_1",
    author: "Sarah Greenhouse",
    avatar: "SG",
    badge: "Forest Guardian",
    content: "Just avoided 5.2kg of CO₂ by cycling to the organic grocery coop market today! Swapped a short 3-mile drive entirely. feels wonderful! 🚴‍♀️🌿",
    likes: 24,
    comments: 3,
    timestamp: "12 mins ago",
    category: "transport"
  },
  {
    id: "post_2",
    author: "Marcus Thorne",
    avatar: "MT",
    badge: "Carbon Warrior",
    content: "Successfully completed my first Meatless Monday! Oatmeal breakfast, direct tofu stir-fry, and walnut snacks. Diet changes have immediate carbon reductions.",
    likes: 18,
    comments: 5,
    timestamp: "2 hours ago",
    category: "diet"
  },
  {
    id: "post_3",
    author: "Emily Solar",
    avatar: "ES",
    badge: "Bio-Active Citizen",
    content: "Called my municipal electric utility company and shifted our direct source mix to 100% green pricing! Cost an extra $4/month, but household energy emissions instantly fell to 0.",
    likes: 42,
    comments: 11,
    timestamp: "5 hours ago",
    category: "energy"
  }
];

export const SocialHub: React.FC<SocialHubProps> = ({
  state,
  onJoinGroup,
  onJoinChallenge,
  onCreateGroup,
  totalSavingsFromLogs
}) => {
  const { groups, challenges } = state;
  const [allowSharing, setAllowSharing] = useState(true);
  const [feedPosts, setFeedPosts] = useState(INITIAL_FEED_POSTS);
  const [customPostText, setCustomPostText] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  // Custom group form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupCat, setNewGroupCat] = useState<CarbonCategory | "all">("all");

  const userName = localStorage.getItem("carbonwise_username") || "Jane Doe";

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPostText.trim()) return;

    const newPost = {
      id: "post_" + Date.now(),
      author: userName,
      avatar: userName.substring(0,2).toUpperCase(),
      badge: totalSavingsFromLogs >= 100 ? "Carbon Warrior" : "Seed Starter",
      content: customPostText,
      likes: 0,
      comments: 0,
      timestamp: "Just now",
      category: "all"
    };

    setFeedPosts([newPost, ...feedPosts]);
    setCustomPostText("");
  };

  const handleShareProgressDirectly = () => {
    const defaultText = `I have completed ${state.dailyLogs.length} positive green actions on CO₂-ZERO and avoided ${totalSavingsFromLogs.toFixed(1)}kg of carbon footprints! Join me in restoring the biosphere! 🌍🌿`;
    setCustomPostText(defaultText);
    
    if (allowSharing) {
      const autoPost = {
        id: "post_share_" + Date.now(),
        author: userName,
        avatar: userName.substring(0,2).toUpperCase(),
        badge: totalSavingsFromLogs >= 50 ? "Carbon Warrior" : "Seed Starter",
        content: `📈 Climate Progress Milestone: I've logged ${state.dailyLogs.length} environmental offsets, reducing my carbon footprint by ${totalSavingsFromLogs.toFixed(1)} kg CO₂! Unlocked standard medals. Join my focus challenges!`,
        likes: 1,
        comments: 0,
        timestamp: "Just now",
        category: "all"
      };
      setFeedPosts([autoPost, ...feedPosts]);
      alert("Successfully posted progress milestone to global community feed!");
    } else {
      alert("Sharing disabled. Please toggle 'Allow Progress Sharing' to register community logs.");
    }
  };

  const handleLikePost = (postId: string) => {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleGroupCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;

    onCreateGroup(newGroupName, newGroupDesc, newGroupCat);
    
    // reset States
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupCat("all");
    setShowCreateGroupModal(false);
    alert("New eco-reduction focus group created successfully!");
  };

  // Category visual labels
  const labelStyles: Record<string, string> = {
    all: "bg-slate-100 text-slate-800 border-slate-200",
    transport: "bg-emerald-50 text-emerald-800 border-emerald-200",
    energy: "bg-blue-50 text-blue-800 border-blue-200",
    diet: "bg-amber-50 text-amber-800 border-amber-200",
    waste: "bg-indigo-50 text-indigo-800 border-indigo-200"
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between" id="social-hub-stage">
      
      {/* COOPERATIVE CHALLENGES AND ACTION GROUPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CHALLENGES PANEL */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-[#e1eded] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Eco-Positive Sprints
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight mt-2 flex items-center gap-1.5">
                  Cooperative Challenges
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Join active target events. Log corresponding offsets to automatically fuel the meters!
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {challenges.map((c) => {
                const percent = Math.min(100, Math.round((c.progressKg / c.goalKg) * 100));
                return (
                  <div key={c.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{c.title}</h4>
                        <p className="text-[10.5px] text-slate-500 leading-snug mt-1">{c.description}</p>
                      </div>
                      <button
                        onClick={() => onJoinChallenge(c.id)}
                        className={`text-[10px] font-extrabold py-1.5 px-3 rounded-full cursor-pointer transition whitespace-nowrap ${c.joined ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                      >
                        {c.joined ? (
                          <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Joined</span>
                        ) : "Join Sprint"}
                      </button>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                        <span>Progress: {c.progressKg.toFixed(0)} / {c.goalKg} kg CO₂ saved</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-2.5">
                      <span>👤 {c.participants} people running</span>
                      <span className="text-amber-600">⏳ {c.daysRemaining} days left</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-amber-50/70 border border-amber-100 p-3.5 rounded-2xl flex gap-3 text-xs text-amber-900 font-semibold mt-4">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-normal">
              When <strong>joined</strong>, logs categorized as diet automatically count toward the Meatless Marathon, commute metrics apply to Commuter Sprint!
            </p>
          </div>
        </div>

        {/* CLIMATE SHARING GROUPS PANEL */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-[#e1eded] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Common Interest Groupings
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight mt-2 flex items-center gap-1.5">
                  Climate Reduction Groups
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Band together with localized focus communities to pool carbon avoidance counts together.
                </p>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl cursor-pointer transition flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {groups.map((g) => {
                return (
                  <div key={g.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">{g.name}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border font-bold uppercase tracking-wider ${labelStyles[g.targetCategory] || ""}`}>
                            {g.targetCategory}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-snug mt-1">{g.description}</p>
                      </div>
                      <button
                        onClick={() => onJoinGroup(g.id)}
                        className={`text-[10px] font-extrabold py-1.5 px-3 rounded-full cursor-pointer transition whitespace-nowrap ${g.joined ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                      >
                        {g.joined ? (
                          <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Joined</span>
                        ) : "Join Group"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] font-bold text-slate-500">
                      <span>👥 {g.memberCount} members</span>
                      <span className="text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 font-bold">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Pool Saved: {g.totalSavedKg.toFixed(0)} kg CO₂
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold">
            <span className="text-slate-400">Your Collective Pool Saved:</span>
            <span className="text-emerald-700 font-extrabold font-mono text-sm">
              {groups.filter(g => g.joined).reduce((sum, g) => sum + g.totalSavedKg, 0).toFixed(0)} kg CO₂ Saved
            </span>
          </div>
        </div>

      </div>

      {/* SOCIAL PROGRESS SHARING AND COMMUNITY FEED */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-[#e1eded] shadow-xs grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* POST COMPOSER & SHARING: Takes 5/12 */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              Progress Feed & Share
            </h3>
            
            {/* Toggle progress sharing */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Allow Sharing
              </span>
              <button
                onClick={() => setAllowSharing(!allowSharing)}
                className={`w-9 h-5 rounded-full p-0.5 transition cursor-pointer flex ${allowSharing ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"}`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold text-slate-800 space-y-3">
            <p className="text-[10.5px] leading-relaxed text-slate-500 font-semibold">
              Publish rapid baseline updates, newly unlocked high-contrast medals, or active offset logs directly to all members of the community feed.
            </p>
            
            <button
              id="btn-share-social-progress"
              onClick={handleShareProgressDirectly}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-2 tracking-wide"
            >
              <Share2 className="w-3.5 h-3.5" />
              Post June Progress to Feed
            </button>
          </div>

          <form onSubmit={handleCreatePostSubmit} className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mt-1">
              Construct Eco Post
            </label>
            <textarea
              placeholder="e.g. Swapping out standard lightbulbs for full high efficiency LEDs! Saves 150W of power instantly."
              value={customPostText}
              onChange={(e) => setCustomPostText(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 p-3.5 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!customPostText.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3 h-3" /> Post Message
              </button>
            </div>
          </form>
        </div>

        {/* FEED LISTS: Takes 7/12 */}
        <div className="md:col-span-7">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-3">
            Simulated Global Eco Community Feed
          </h4>
          
          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
            {feedPosts.map((post) => {
              return (
                <div key={post.id} className="p-4 rounded-3xl border border-slate-100/80 bg-white shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-black text-emerald-800 select-none">
                        {post.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{post.author}</span>
                          <span className="text-[10px] font-bold text-slate-400">• {post.timestamp}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-extrabold block mt-0.5 w-max">
                          {post.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-bold">
                    {post.content}
                  </p>

                  <div className="flex gap-4 border-t border-slate-50 pt-2.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className="hover:text-emerald-600 cursor-pointer transition flex items-center gap-1.5"
                    >
                      ❤️ <span className="font-mono">{post.likes}</span>
                    </button>
                    <span className="flex items-center gap-1.5">
                      💬 <span className="font-mono">{post.comments}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CREATE CUSTOM REDUCTION FOCUS GROUP MODAL */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3.5rem] p-6 md:p-8 w-full max-w-sm shadow-2xl relative border border-slate-100">
            <button 
              onClick={() => setShowCreateGroupModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">
              Start Custom Eco Group
            </h3>
            <p className="text-xs text-slate-400 leading-normal mb-4 font-semibold">
              Create a localized carbon savings space. Define a core category focus and description guidelines.
            </p>

            <form onSubmit={handleGroupCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Community Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zero Waste Warriors New York"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Target Focus Category
                </label>
                <select
                  value={newGroupCat}
                  onChange={(e) => setNewGroupCat(e.target.value as any)}
                  className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="all">All Category Actions</option>
                  <option value="transport">Transportation Focus</option>
                  <option value="energy">Energy Focus</option>
                  <option value="diet">Nutrition Focus</option>
                  <option value="waste">Recycling & Waste Focus</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Purpose / Guideline Description
                </label>
                <textarea
                  placeholder="e.g. Banding together locally to reduce emissions..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Initiate Focus Group
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
