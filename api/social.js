// Final backend file: api/social.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://clapmoneytrading.com'); // Correct URL
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ error: "Method Not Allowed" }); }

  try {
    const { stockSymbol } = req.body;
    if (!stockSymbol) { return res.status(400).json({ error: "Stock symbol is required." }); }

    const prompt = `
      You are a social media financial analyst... // Rest of prompt is the same
      Your entire response must be ONLY the raw JSON object, with no introductory text, no summary, no markdown, and no closing remarks.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // --- START: New, more robust cleaning step ---
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    // --- END: New cleaning step ---

    const jsonData = JSON.parse(text);
    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Error in social.js:", error);
    res.status(500).json({ error: "Failed to fetch social sentiment from AI." });
  }
}
