// This is the code for your secure "middleman" on Vercel
export default async function handler(request, response) {
  const stockSymbol = request.query.stock;

  // ❗ Your secret API key is safely accessed here on the server
  const AI_API_KEY = process.env.MY_AI_API_KEY;

  if (!stockSymbol) {
    return response.status(400).json({ error: 'Stock symbol is required' });
  }

  try {
    // This is where you would put the REAL AI API URL
    // Replace 'https://api.ai-provider.com/v1/analyze' with the actual URL
    const apiResponse = await fetch(`https://api.ai-provider.com/v1/analyze?stock=${stockSymbol}`, {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`AI API responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // Send the data from the AI back to your frontend page
    response.status(200).json(data);

  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Failed to fetch data from AI service' });
  }
}