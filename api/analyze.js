// Final backend file: api/analyze.js
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
      You are an expert stock market analyst. Provide a detailed, structured analysis for the Indian stock with the ticker symbol: ${stockSymbol}.
      Format your response strictly as a JSON object.
      IMPORTANT: Ensure all property names (keys) are enclosed in double quotes and there are no trailing commas.
      The JSON object must have the following keys and data types:
      - "stockName": string (e.g., "State Bank of India")
      - "ticker": string (the stock symbol provided)
      - "price": string (a plausible current price, e.g., "₹860.55")
      - "change": string (a plausible day's change, e.g., "+₹5.10")
      - "changePercent": string (a plausible day's change in percent, e.g., "+0.60%")
      - "isPositive": boolean
      - "fairValue": object with keys "range" (string), "status" (string), "rationale" (string)
      - "trendAnalysis": object with "daily" and "weekly" keys, each having "trend" (string) and "insight" (string)
      - "swot": object with "pros" (an array of 3 strings) and "cons" (an array of 3 strings)
      Your entire response must be ONLY the raw JSON object, with no introductory text, no summary, no markdown, and no closing remarks.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const jsonData = JSON.parse(text);
    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Error in analyze.js:", error);
    res.status(500).json({ error: "Failed to fetch analysis from AI." });
  }
}
