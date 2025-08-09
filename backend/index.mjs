import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "https://visualmind-c1gz9zvwq-devankk667s-projects.vercel.app" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = process.env.GROQ_API_KEY;

if (!GROQ_KEY) {
  console.error("Missing GROQ_API_KEY in backend/.env");
  process.exit(1);
}

function extractMermaid(text = "") {
  const fence = text.match(/```mermaid\s*([\s\S]*?)\s*```/i);
  if (fence) return fence[1].trim();
  
  const graph = text.match(/(graph\s+(?:TD|TB|LR|RL|BT)[\s\S]*)/i);
  if (graph) return graph[1].trim();
  
  const flowchart = text.match(/flowchart\s+(?:TD|TB|LR|RL|BT)[\s\S]*/i);
  if (flowchart) return flowchart[0].trim();
  
  return "";
}

const topicExamples = {
  cooking: {
    keywords: ["cooking", "recipe", "kitchen", "food", "pizza", "baking", "ingredients"],
    example: `graph TD;
    A[Start Cooking] --> B[Gather Ingredients];
    B --> C[Prepare Tools];
    C --> D[Follow Recipe Steps];
    D --> E[Cook/Bake];
    E --> F[Check Doneness];
    F --> G[Serve Hot];`
  },
  marketing: {
    keywords: ["marketing", "advertising", "promotion", "brand", "customer", "sales"],
    example: `graph TD;
    A[Marketing Strategy] --> B[Market Research];
    A --> C[Target Audience];
    A --> D[Brand Positioning];
    B --> E[Customer Analysis];
    C --> F[Segmentation];
    D --> G[Messaging];`
  },
  technology: {
    keywords: ["software", "development", "programming", "system", "app", "web"],
    example: `graph TD;
    A[Software Development] --> B[Requirements];
    B --> C[Design];
    C --> D[Implementation];
    D --> E[Testing];
    E --> F[Deployment];`
  },
  business: {
    keywords: ["business", "process", "workflow", "management", "operations"],
    example: `graph TD;
    A[Business Process] --> B[Planning];
    B --> C[Execution];
    C --> D[Monitoring];
    D --> E[Optimization];`
  }
};

function detectTopicCategory(topic) {
  const topicLower = topic.toLowerCase();
  for (const [category, data] of Object.entries(topicExamples)) {
    if (data.keywords.some(keyword => topicLower.includes(keyword))) {
      return category;
    }
  }
  return null;
}

app.post("/api/generate", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const topicCategory = detectTopicCategory(topic);
    const exampleStructure = topicCategory ? topicExamples[topicCategory].example : "";

    const systemPrompt = `You are an expert diagram creator specializing in topic-specific flowcharts.

ABSOLUTE RULES:
1. Create diagrams ONLY about the exact topic provided
2. NEVER mix different subject areas 
3. NEVER add machine learning, AI, or data science concepts unless the topic specifically asks for them
4. NEVER add supervised learning, regression, clustering, classification to non-ML topics
5. Every single node must be directly related to the specific topic
6. Use practical, real-world steps and processes

OUTPUT FORMAT:
- Start with \`\`\`mermaid
- Use graph TD; format
- End with \`\`\`
- Use descriptive labels in [square brackets]
- Connect with --> arrows

TOPIC FOCUS: Create content that someone learning about this specific topic would find useful and relevant.`;

    let userPrompt = `Create a Mermaid flowchart diagram for: "${topic}"

SPECIFIC INSTRUCTIONS FOR "${topic}":
- Focus EXCLUSIVELY on "${topic}" concepts and processes
- Create a logical flow of steps, concepts, or components related to "${topic}"
- Include 6-12 nodes that show the main aspects of "${topic}"
- Make it educational and practical for someone learning about "${topic}"
- Do NOT include any unrelated concepts from other fields

${exampleStructure ? `Here's the style of diagram structure to follow:\n${exampleStructure}\n\nNow create a similar structure but for "${topic}":` : `Create the diagram for "${topic}":`}`;

    if (topic.toLowerCase().includes('cooking') || topic.toLowerCase().includes('recipe') || topic.toLowerCase().includes('food')) {
      userPrompt += `\n\nFor cooking topics, focus on: ingredients, preparation steps, cooking methods, timing, serving.`;
    } else if (topic.toLowerCase().includes('marketing') || topic.toLowerCase().includes('advertising')) {
      userPrompt += `\n\nFor marketing topics, focus on: strategy, research, audience, channels, measurement.`;
    } else if (topic.toLowerCase().includes('business') || topic.toLowerCase().includes('process')) {
      userPrompt += `\n\nFor business topics, focus on: planning, operations, management, workflow, outcomes.`;
    }

    const body = {
      model: "deepseek-r1-distill-llama-70b", // ✅ Updated model
      temperature: 0.2,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };

    console.log(`🎯 Generating diagram for: "${topic}"`);
    console.log(`📂 Detected category: ${topicCategory || 'general'}`);

    const apiRes = await axios.post(GROQ_API, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`
      },
      timeout: 30000
    });

    const rawText = apiRes.data.choices?.[0]?.message?.content || "";
    let mermaid = extractMermaid(rawText);

    if (!mermaid || mermaid.length < 50) {
      console.log(`🔄 Creating fallback diagram for "${topic}"`);
      mermaid = createFallbackDiagram(topic);
    }

    console.log(`✅ Generated diagram for "${topic}" (${mermaid.length} chars)`);
    console.log(`📊 First few lines:\n${mermaid.split('\n').slice(0, 3).join('\n')}`);

    res.json({ 
      raw: rawText, 
      mermaid,
      topic: topic,
      category: topicCategory,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Backend error:", err.response?.data || err.message || err);
    res.status(500).json({
      error: err.response?.data?.error?.message || err.message || "Unknown error"
    });
  }
});

function createFallbackDiagram(topic) {
  const cleanTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  if (topic.toLowerCase().includes('cooking') || topic.toLowerCase().includes('pizza')) {
    return `graph TD;
    A[${cleanTopic}] --> B[Gather Ingredients];
    B --> C[Prepare Workspace];
    C --> D[Follow Recipe Steps];
    D --> E[Cook/Bake];
    E --> F[Check Quality];
    F --> G[Serve & Enjoy];`;
  } else if (topic.toLowerCase().includes('marketing')) {
    return `graph TD;
    A[${cleanTopic}] --> B[Market Research];
    B --> C[Define Target Audience];
    C --> D[Create Strategy];
    D --> E[Execute Campaigns];
    E --> F[Measure Results];
    F --> G[Optimize & Improve];`;
  } else {
    return `graph TD;
    A[${cleanTopic}] --> B[Understanding Basics];
    B --> C[Key Components];
    C --> D[Implementation];
    D --> E[Best Practices];
    E --> F[Advanced Techniques];
    F --> G[Continuous Improvement];`;
  }
}

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    model: "deepseek-r1-distill-llama-70b", // ✅ Updated
    service: "VisualMind AI"
  });
});

// 🌟 Serve frontend in production (cross-platform safe)
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up one level from backend to reach frontend/dist
const frontendPath = path.join(__dirname, "../frontend/dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendPath));
  
  // Must be after all API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 VisualMind AI Backend listening at http://localhost:${PORT}`);
  console.log(`📊 Using Groq API with deepseek-r1-distill-llama-70b model`);
});