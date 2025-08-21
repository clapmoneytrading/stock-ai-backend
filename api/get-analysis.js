// This is your new backend logic.
// It fetches real EOD data from Alpha Vantage using your secret key.

export default async function handler(request, response) {
  const stockSymbol = request.query.stock;
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY; // Securely access your new key

  if (!stockSymbol) {
    return response.status(400).json({ error: 'Stock symbol is required' });
  }

  try {
    // 1. Fetch real End-of-Day data from Alpha Vantage
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol}&apikey=${apiKey}`;
    const dataResponse = await fetch(alphaVantageUrl);
    const data = await dataResponse.json();

    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    // Extract the most recent data point
    const timeSeries = data['Time Series (Daily)'];
    const lastRefreshed = data['Meta Data']['3. Last Refreshed'];
    const recentData = timeSeries[lastRefreshed];
    const previousDate = Object.keys(timeSeries)[1];
    const previousClose = timeSeries[previousDate]['4. close'];

    const currentPrice = parseFloat(recentData['4. close']);
    const openPrice = parseFloat(recentData['1. open']);
    const highPrice = parseFloat(recentData['2. high']);
    const lowPrice = parseFloat(recentData['3. low']);
    const volume = parseInt(recentData['5. volume']);
    const change = currentPrice - parseFloat(previousClose);
    const changePercent = (change / parseFloat(previousClose)) * 100;

    // 2. (Conceptual) Send this data to an AI for analysis
    // In a real scenario, you would pass the 'timeSeries' data to the Gemini API
    // For now, we will generate a mock analysis based on the real data.
    const analysis = {
      sentiment: change > 0 ? 'Bullish' : 'Bearish',
      fairValue: {
        range: `₹${(currentPrice * 0.95).toFixed(2)} - ₹${(currentPrice * 1.1).toFixed(2)}`,
        status: 'Fairly Valued',
        rationale: 'Based on recent price action and historical volatility.'
      },
      trends: {
        daily: { status: change > 0 ? 'Positive Momentum' : 'Negative Momentum', insight: 'Based on the last closing price.' },
        weekly: { status: 'Neutral', insight: 'A longer-term trend analysis is required.' }
      }
    };

    // 3. Combine real data and AI analysis into one response
    const finalResponse = {
      stockName: data['Meta Data']['2. Symbol'],
      price: currentPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      ...analysis // Add the AI analysis to the response
    };

    response.status(200).json(finalResponse);

  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Failed to fetch or analyze data for ${stockSymbol}. Check if the symbol is correct (e.g., RELIANCE.BSE for BSE, or just RELIANCE for NSE).` });
  }
}
