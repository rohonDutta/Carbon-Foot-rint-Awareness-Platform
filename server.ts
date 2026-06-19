import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// ---------------------------------------------------------------------------
// Guard: fail fast if the API key is absent so the problem is visible at
// startup rather than silently at the first request.
// ---------------------------------------------------------------------------
const api_key = process.env.GEMINI_API_KEY;
if (!api_key) {
  console.warn(
    "[server] WARNING: GEMINI_API_KEY is not set. AI endpoints will return 503."
  );
}

const app = express();
const PORT = 3000;

// ---------------------------------------------------------------------------
// Security: cap incoming JSON body size to prevent payload-flooding attacks.
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "64kb" }));

// ---------------------------------------------------------------------------
// Security: Content-Security-Policy and other protective response headers.
// ---------------------------------------------------------------------------
app.use((_req, res, next) => {
  // Restrict resource origins to self + Gemini API CDN only.
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",  // Tailwind injects inline styles
      "connect-src 'self' https://generativelanguage.googleapis.com",
      "img-src 'self' data:",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// ---------------------------------------------------------------------------
// Security: simple in-memory rate limiter — max 30 AI requests per minute
// per IP to prevent API-key abuse.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

/** Returns true when the value is a non-empty string within the given length. */
function isValidString(value: unknown, maxLen = 4000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLen;
}

/** Returns true when value is a finite number within [min, max]. */
function isValidNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && isFinite(value) && value >= min && value <= max;
}

/** Sanitize a number that comes from user data to a safe string representation. */
function safeNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------------------
// Gemini client (shared, instantiated once)
// ---------------------------------------------------------------------------
const ai = api_key
  ? new GoogleGenAI({
      apiKey: api_key,
      httpOptions: { headers: { "User-Agent": "carbonwise-app" } },
    })
  : null;

// ---------------------------------------------------------------------------
// POST /api/chat — conversational Eco Assist endpoint
// ---------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const clientIp = req.ip ?? "unknown";
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  if (!ai) {
    return res.status(503).json({
      error: "The AI assistant is not available. Please configure GEMINI_API_KEY.",
    });
  }

  const { message, history } = req.body;

  if (!isValidString(message, 2000)) {
    return res.status(400).json({ error: "message must be a non-empty string (max 2 000 characters)." });
  }

  if (history !== undefined && !Array.isArray(history)) {
    return res.status(400).json({ error: "history must be an array when provided." });
  }

  // Sanitize and truncate history to the last 15 turns; each turn is limited.
  const safeHistory: Array<{ role: string; content: string }> = [];
  if (Array.isArray(history)) {
    for (const turn of history.slice(-15)) {
      if (
        turn &&
        typeof turn === "object" &&
        isValidString(turn.role, 20) &&
        isValidString(turn.content, 4000)
      ) {
        safeHistory.push({ role: turn.role.trim(), content: turn.content.trim() });
      }
    }
  }

  try {
    const conversationPrompt =
      safeHistory.length > 0
        ? `Here is the conversation history:\n${safeHistory
            .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
            .join("\n")}\n\nUser: ${message.trim()}`
        : message.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: conversationPrompt,
      config: {
        systemInstruction: `You are CarbonWise Eco Assist, a supportive, knowledgeable environmental scientist specialising in carbon analytics for Indian citizens.
Help individuals track, understand, and reduce their carbon footprint in an Indian urban/rural context.
Be encouraging, factual, and output clean, well-formatted Markdown with bullet points where appropriate.
Use Indian references: PM Surya Ghar solar subsidies, 5-star BEE ratings, BLDC fans, LPG cylinders, Delhi/Mumbai/Namma metros, CNG/petrol/diesel/EV options, Kabadiwala scrap trade, local mandi sourcing.
Always use Indian Rupees (₹) for prices and kilometres (km) for distances.`,
      },
    });

    return res.json({ text: response.text });
  } catch (error: unknown) {
    console.error("[/api/chat] Gemini error:", error);
    // Do NOT leak raw error messages to the client.
    return res.status(500).json({ error: "The AI assistant encountered an internal error. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/insights — structured carbon-reduction plan endpoint
// ---------------------------------------------------------------------------
app.post("/api/insights", async (req, res) => {
  const clientIp = req.ip ?? "unknown";
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  if (!ai) {
    return res.status(503).json({ error: "The AI assistant is not available. Please configure GEMINI_API_KEY." });
  }

  const { baseline, logs, goal } = req.body;

  // Validate baseline structure — all fields must be finite numbers.
  if (!baseline || typeof baseline !== "object") {
    return res.status(400).json({ error: "baseline object is required." });
  }

  const safeBaseline = {
    transportation: safeNum(baseline.transportation),
    energy: safeNum(baseline.energy),
    diet: safeNum(baseline.diet),
    waste: safeNum(baseline.waste),
    total: safeNum(baseline.total),
  };

  // Validate goal fields when present.
  const percentTarget =
    goal && isValidNumber(goal.percentTarget, 1, 100) ? goal.percentTarget : 10;
  const timeframeMonths =
    goal && isValidNumber(goal.timeframeMonths, 1, 24) ? goal.timeframeMonths : 3;

  // Validate logs array — accept up to 50 entries, each with bounded fields.
  const safeLogs: Array<{ category: string; title: string; impactKg: number }> = [];
  if (Array.isArray(logs)) {
    for (const log of logs.slice(0, 50)) {
      if (log && typeof log === "object") {
        safeLogs.push({
          category: isValidString(log.category, 20) ? log.category.trim() : "unknown",
          title: isValidString(log.title, 200) ? log.title.trim() : "Action",
          impactKg: safeNum(log.impactKg),
        });
      }
    }
  }

  try {
    const prompt = `Analyse this user's carbon footprint data and generate a personalised, structured carbon-reduction action plan.

User's Annual Baseline Carbon Footprint:
- Transportation: ${safeBaseline.transportation} kg CO₂
- Household Energy: ${safeBaseline.energy} kg CO₂
- Diet & Food: ${safeBaseline.diet} kg CO₂
- Waste & Recycling: ${safeBaseline.waste} kg CO₂
- Total Footprint: ${safeBaseline.total} kg CO₂

Reduction Goal: ${percentTarget}% reduction within ${timeframeMonths} months.

Recent Logged Savings: ${JSON.stringify(safeLogs)}

Tasks:
1. Provide a concise personalizedInsight paragraph (highest emission area, current progress, top focus area).
2. Generate exactly 5 actionable recommendations for an Indian urban/suburban household. Target highest-emission categories first.

Each recommendation must reference Indian solutions: BLDC fans, PM Surya Ghar solar, metro/e-rickshaw, Kabadiwala scrap, mandi sourcing, LPG/geyser optimisation.
Use km and ₹ for all quantities.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an environmental carbon-emissions auditor for Indian citizens. Return precise, custom-tailored tasks using regional Indian policies, diets, and transit systems.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["personalizedInsight", "recommendations"],
          properties: {
            personalizedInsight: {
              type: Type.STRING,
              description: "Expert, motivational paragraph about the user's carbon footprint.",
            },
            recommendations: {
              type: Type.ARRAY,
              description: "Exactly 5 targeted carbon-saving recommendations.",
              items: {
                type: Type.OBJECT,
                required: [
                  "id",
                  "category",
                  "title",
                  "description",
                  "impact",
                  "annualSavingsKg",
                  "difficulty",
                  "estimatedCost",
                ],
                properties: {
                  id: { type: Type.STRING, description: "Unique slug starting with task_" },
                  category: { type: Type.STRING, description: "One of: transport, energy, diet, waste" },
                  title: { type: Type.STRING, description: "Snappy, actionable title." },
                  description: { type: Type.STRING, description: "How to perform this task and why." },
                  impact: { type: Type.STRING, description: "high, medium, or low" },
                  annualSavingsKg: { type: Type.NUMBER, description: "Yearly kg CO₂ saved." },
                  difficulty: { type: Type.STRING, description: "easy, moderate, or hard" },
                  estimatedCost: { type: Type.STRING, description: "free, low cost, medium cost, or investment" },
                },
              },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text ?? "{}");
    return res.json(parsedData);
  } catch (error: unknown) {
    console.error("[/api/insights] Gemini error:", error);
    return res.status(500).json({ error: "Could not generate insights. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// Static file serving / Vite dev middleware
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] CarbonWise running on http://localhost:${PORT}`);
});
