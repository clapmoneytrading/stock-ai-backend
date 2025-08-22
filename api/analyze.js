// This is your backend serverless function: api/analyze.js
// It needs the Google AI package, so you'll have to install it.
// In your project terminal, run: npm install @google/generative-ai

const { GoogleGenerativeAI } = require("@google/generative-ai");

// This line securely accesses the API key you stored in Vercel.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // We only want to handle POST requests to this function
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { stockSymbol } = req.body;

    if (!stockSymbol) {
      return res.status(400).json({ error: "Stock symbol is required." });
    }

    // --- This is the prompt we send to the Gemini AI ---
    const prompt = `
      You are an expert stock market analyst. Provide a detailed, structured analysis for the Indian stock with the ticker symbol: ${stockSymbol}.
      Format your response strictly as a JSON object with the following keys and data types:
      - "stockName": string (e.g., "State Bank of India")
      - "ticker": string (the stock symbol provided)
      - "price": string (a plausible current price, e.g., "₹860.55")
      - "change": string (a plausible day's change, e.g., "+₹5.10")
      - "changePercent": string (a plausible day's change in percent, e.g., "+0.60%")
      - "isPositive": boolean
      - "fairValue": object with keys "range" (string), "status" (string), "rationale" (string)
      - "trendAnalysis": object with "daily" and "weekly" keys, each having "trend" (string) and "insight" (string)
      - "swot": object with "pros" (an array of 3 strings) and "cons" (an array of 3 strings)

      Do not include any text, backticks, or formatting outside of the single, raw JSON object.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // The AI's response is a JSON string, so we parse it into a real object
    const jsonData = JSON.parse(text);

    // Send the structured JSON data back to the frontend dashboard
    res.status(200).json(jsonData);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to fetch analysis from AI." });
  }
}
