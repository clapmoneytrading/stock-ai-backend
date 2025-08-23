// New backend file: api/ratings.js
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
      You are a quantitative financial analyst. Analyze recent professional analyst reports for the Indian stock with the ticker symbol: ${stockSymbol}.
      Format your response strictly as a JSON object with the following keys:
      - "analystConsensus": string (must be one of "Strong Buy", "Buy", "Hold", "Sell", or "Strong Sell")
      - "averagePriceTarget": string (the average 12-month price target, e.g., "₹1,250.00")
      - "summary": string (a short summary, e.g., "Based on 22 recent analyst reports.")
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonData = JSON.parse(response.text());

    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Error in ratings.js:", error);
    res.status(500).json({ error: "Failed to fetch analyst ratings from AI." });
  }
}
