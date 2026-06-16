import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent and key
const api_key = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: api_key,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint to handle AI assistance / carbon Q&A
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!api_key) {
      return res.status(500).json({
        error: "Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.",
      });
    }

    // Format history for GoogleGenAI SDK chat or construct a clean conversation context
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are dynamic CarbonWise Eco Assist, a supportive, knowledgeable environmental scientist and action strategist specializing in carbon analytics for Indian citizens.
Your purpose is to help individuals track, understand, and reduce their carbon footprint in an Indian urban/rural context.
Be encouraging, factual (use scientific principles/data regarding carbon emissions), and output clean, well-formatted Markdown with bullet points where appropriate.
Adopt Indian references including:
- Diet: pure lacto-vegetarian, Jain/Sattvik, eggitarian regimes, ghee/paneer footprint comparisons.
- Energy: PM Surya Ghar Yojana solar rooftop panel subsidies, 5-star BEE energy ratings, BLDC ceiling fans, water heater geyser usage, LPG cylinders power draw.
- Transportation: Delhi/Mumbai/Namma metros, local trains, auto-rickshaws, shared e-autos, two-wheelers, fuel options like CNG, Petrol, Diesel, and EV charging under the Indian electricity grid.
- Waste: segregating dry and wet waste, selling scrap to local Kabadiwalas.
Always present pricing in Indian Rupees (₹) and distances in kilometers (km). Avoid extreme jargon but maintain high integrity.`,
      },
    });

    // Replay history to build chat state if provided
    if (history && Array.isArray(history)) {
      // Keep it up to the last 15 messages for performance/token limit safety
      const recentHistory = history.slice(-15);
      for (const turn of recentHistory) {
         // Feed them sequentially or just construct a single rich content prompt to keep it extremely stable
      }
    }

    // Direct generation with contextual instructions including a summary of history is extremely fast and robust for web apps
    const conversationPrompt = history && history.length > 0 
      ? `Here is the conversation history:\n${history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join("\n")}\n\nUser: ${message}`
      : message;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: conversationPrompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error?.message || "An error occurred with the AI assistant." });
  }
});

// Endpoint to generate customized Eco Action Plans & Insights using JSON Schema
app.post("/api/insights", async (req, res) => {
  try {
    const { baseline, logs, goal } = req.body;

    if (!api_key) {
      return res.status(500).json({
        error: "Gemini API key is not configured.",
      });
    }

    const targetReductionDesc = goal 
      ? `USER'S REDUCTION TARGET GOAL: Reduce baseline annual emissions by ${goal.percentTarget || 10}% within ${goal.timeframeMonths || 3} months.`
      : `USER'S REDUCTION TARGET GOAL: General steady 10% reduction.`;

    // Construct a rich prompt describing the user's footprint details
    const prompt = `Analyze this user's carbon footprint data and generate a highly personalized, structured carbon-reduction action plan.
User's Annual Baseline Carbon Footprint Estimation:
- Transportation: ${baseline?.transportation || 0} kg CO2
- Household Energy: ${baseline?.energy || 0} kg CO2
- Diet & Food: ${baseline?.diet || 0} kg CO2
- Waste & Recycling: ${baseline?.waste || 0} kg CO2
- Total Footprint: ${baseline?.total || 0} kg CO2

${targetReductionDesc}

Active Logging Activity Context (recent logged footprint savings):
${JSON.stringify(logs || [])}

Perform the following:
1. Provide a concise, highly insightful summary (personalizedInsight) explaining where their footprint is highest, where they are making progress, and how they can focus their efforts to achieve their goals. Incorporate encouraging Indian contexts.
2. Generate 5 highly actionable, personalized physical tasks/recommendations (recommendations) for them to implement in an Indian urban/suburban setting. Target areas with high emissions first. Assign a valid category to each from ['transport', 'energy', 'diet', 'waste']. Estimate the specific annual CO2 savings in kg. Estimate a difficulty level ('easy', 'moderate', 'hard') and a realistic financial cost or investment description ('free', 'low cost', 'investment').

IMPORTANT: All suggestions must represent real Indian solutions, such as BLDC ceiling fans, switching geyser on only as-needed, PM Surya Ghar solar rooftops, metro rail transits, shared electric battery-autos, Segregating wet/dry rubbish, selling reusable scrap directly to local Kabadiwalas, or eating traditional dairy-reduced veg diets (no butter/ghee days). Reference km and INR (₹).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an environmental carbon-emissions calculator auditing a citizen's life footprint in India. You return highly precise custom-tailored tasks to reduce emissions using regional Indian policies, diets, and transit systems.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["personalizedInsight", "recommendations"],
          properties: {
            personalizedInsight: {
              type: Type.STRING,
              description: "A friendly, expert paragraph-long critique and motivational guideline of the individual's carbon footprint.",
            },
            recommendations: {
              type: Type.ARRAY,
              description: "A list of exactly 5 targeted carbon-saving recommendations.",
              items: {
                type: Type.OBJECT,
                required: ["id", "category", "title", "description", "impact", "annualSavingsKg", "difficulty", "estimatedCost"],
                properties: {
                  id: { type: Type.STRING, description: "A unique slug ID starting with task_" },
                  category: { type: Type.STRING, description: "Must be exactly one of: 'transport', 'energy', 'diet', 'waste'" },
                  title: { type: Type.STRING, description: "A snappy, actionable recommendation title." },
                  description: { type: Type.STRING, description: "A clear, compelling description detailing how to perform this task and why." },
                  impact: { type: Type.STRING, description: "Impact rating: 'high', 'medium', or 'low'" },
                  annualSavingsKg: { type: Type.NUMBER, description: "The calculated yearly kilograms of CO2 saved if this action is fully complete." },
                  difficulty: { type: Type.STRING, description: "Perceived execution difficulty: 'easy', 'moderate', or 'hard'" },
                  estimatedCost: { type: Type.STRING, description: "Approximate expenditure: 'free', 'low cost', 'medium cost', or 'investment'" }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/insights:", error);
    res.status(500).json({ error: error?.message || "Could not generate insights." });
  }
});

// Mount Vite middleware for development or static handlers for production
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const serverListener = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
