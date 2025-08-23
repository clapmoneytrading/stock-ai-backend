// New backend file: api/social.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://clapmoneytrading.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ error: "Method Not Allowed" }); }

  try {
    const { stockSymbol } = req.body;
    if (!stockSymbol) { return res.status(400).json({ error: "Stock symbol is required." }); }

    const prompt = `
      You are a social media financial analyst. Analyze the recent public sentiment for the Indian stock with the ticker symbol: ${stockSymbol} from sources like X (Twitter), Reddit, and financial forums.
      Format your response strictly as a JSON object with the following keys:
      - "socialSentiment": string (must be one of "Bullish", "Bearish", "Neutral", or "Mixed")
      - "trendingTopic": string (a short summary of the main topic of conversation, e.g., "Speculation on upcoming earnings report.")
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonData = JSON.parse(response.text());

    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Error in social.js:", error);
    res.status(500).json({ error: "Failed to fetch social sentiment from AI." });
  }
}
