// Updated backend file: api/ratings.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // CORS Headers... (same as above)
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ error: "Method Not Allowed" }); }

  try {
    const { stockSymbol } = req.body;
    if (!stockSymbol) { return res.status(400).json({ error: "Stock symbol is required." }); }

    const prompt = `
      You are a quantitative financial analyst... // The rest of your prompt is the same
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // --- START: New cleaning step ---
    if (text.startsWith("```json")) {
        text = text.substring(7, text.length - 3).trim();
    }
    // --- END: New cleaning step ---

    const jsonData = JSON.parse(text);

    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Error in ratings.js:", error);
    res.status(500).json({ error: "Failed to fetch analyst ratings from AI." });
  }
}
