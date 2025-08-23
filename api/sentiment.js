// This is your new backend function for news analysis: api/sentiment.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://clapmoneytrading.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { stockSymbol } = req.body;

    if (!stockSymbol) {
      return res.status(400).json({ error: "Stock symbol is required." });
    }

    // --- This is the new, specialized prompt for sentiment analysis ---
    const prompt = `
      You are a financial news analyst. Analyze the recent news sentiment for the Indian stock with the ticker symbol: ${stockSymbol}.
      Based on current news headlines and market chatter, provide a structured sentiment analysis.
      Format your response strictly as a JSON object with the following keys and data types:
      - "overallSentiment": string (must be one of "Positive", "Neutral", or "Negative")
      - "sentimentScore": number (an integer between 0 and 100, where 0 is extremely negative and 100 is extremely positive)
      - "keyInsights": array of 3 strings (three brief, bullet-point-style summaries of the key news driving the sentiment)

      Do not include any text, backticks, or formatting outside of the single, raw JSON object.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonData = JSON.parse(text);

    res.status(200).json(jsonData);

  } catch (error) {
    console.error("Error calling Gemini API for sentiment:", error);
    res.status(500).json({ error: "Failed to fetch sentiment analysis from AI." });
  }
}
