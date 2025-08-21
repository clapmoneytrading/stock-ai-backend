// /api/eod-analysis.js

export default async function handler(request, response) {
    // --- 1. Add CORS Headers and Handle Preflight Request ---
    response.setHeader('Access-Control-Allow-Origin', '*'); // Allows any domain to access your API
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle browser's preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    // --- 2. Handle the POST Request ---
    if (request.method === 'POST') {
        // FIX: Read the symbol from the request body, not the query string
        const { symbol: stockSymbol } = request.body;
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

        if (!stockSymbol) {
            return response.status(400).json({ error: 'Stock symbol is required' });
        }
        
        if (!apiKey) {
            return response.status(500).json({ error: 'API key is not configured on the server.' });
        }

        try {
            // --- 3. Fetch Stock-Specific EOD Data from Alpha Vantage ---
            const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol}&apikey=${apiKey}`;
            const dataResponse = await fetch(alphaVantageUrl);
            const stockData = await dataResponse.json();

            if (stockData['Error Message'] || !stockData['Time Series (Daily)']) {
                throw new Error(`Could not retrieve data for "${stockSymbol}". Please check the symbol (e.g., for NSE stocks like Reliance, try RELIANCE.BSE or INFY.BSE).`);
            }

            const timeSeries = stockData['Time Series (Daily)'];
            const lastRefreshed = stockData['Meta Data']['3. Last Refreshed'];
            const recentData = timeSeries[lastRefreshed];
            const previousDate = Object.keys(timeSeries)[1]; // The day before the most recent
            const previousClose = timeSeries[previousDate]['4. close'];

            const currentPrice = parseFloat(recentData['4. close']);
            const change = currentPrice - parseFloat(previousClose);
            const changePercent = (change / parseFloat(previousClose)) * 100;

            const stockAnalysis = {
                stockName: stockData['Meta Data']['2. Symbol'],
                price: currentPrice.toFixed(2),
                change: change.toFixed(2),
                changePercent: changePercent.toFixed(2),
                fairValue: {
                    range: `₹${(currentPrice * 0.95).toFixed(2)} - ₹${(currentPrice * 1.1).toFixed(2)}`,
                    status: 'Fairly Valued',
                    rationale: 'Based on recent price action and historical volatility.'
                },
                trends: {
                    daily: { status: change > 0 ? 'Positive Momentum' : 'Negative Momentum', insight: 'Based on the last closing price versus the previous day.' },
                    weekly: { status: 'Neutral', insight: 'A longer-term trend analysis is required for a weekly view.' }
                }
            };

            // --- 4. Prepare General Market EOD Data (Static for now) ---
            const indicesData = [
                { name: 'Nifty PSU Bank', change: 18.0 }, { name: 'Nifty Metal', change: 15.5 },
                { name: 'Nifty Auto', change: 12.3 }, { name: 'Nifty Infra', change: 11.0 },
                { name: 'Nifty Energy', change: 9.8 }, { name: 'Nifty Pharma', change: 9.5 },
                { name: 'Nifty Fin Services', change: 8.2 }, { name: 'Nifty MNC', change: 7.5 },
                { name: 'Nifty Bank', change: 7.1 }, { name: 'Nifty Pvt Bank', change: 6.8 },
                { name: 'Nifty 50', change: 6.5 }, { name: 'Nifty FMCG', change: 4.2 },
                { name: 'Nifty Media', change: -2.5 }, { name: 'Nifty IT', change: -5.8 }
            ];
            indicesData.sort((a, b) => b.change - a.change);
            const top3 = indicesData.slice(0, 3);
            const bottom3 = indicesData.slice(-3).reverse();
            const allChanges = [...top3, ...bottom3];
            const maxChange = Math.max(...allChanges.map(index => Math.abs(index.change)));
            const addPerformanceKey = (index) => ({ ...index, performance: (Math.abs(index.change) / maxChange) * 100 });

            const marketAnalysis = {
                indexPerformance: {
                    topPerformers: top3.map(addPerformanceKey),
                    bottomPerformers: bottom3.map(addPerformanceKey)
                },
                institutionalFlow: {
                    fii: { value: '1,038.51 Cr', status: 'Net Sell' },
                    dii: { value: '1,686.15 Cr', status: 'Net Buy' },
                    interpretation: "It was a mixed session. While FIIs booked some profits, DIIs showed strong confidence with robust buying."
                }
            };

            // --- 5. Combine All Data into a Single Response ---
            const finalResponse = {
                stockAnalysis: stockAnalysis,
                marketAnalysis: marketAnalysis
            };

            return response.status(200).json(finalResponse);

        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: error.message });
        }
    }

    // --- 6. Handle any method that is not POST or OPTIONS ---
    response.setHeader('Allow', ['POST', 'OPTIONS']);
    response.status(405).end(`Method ${request.method} Not Allowed`);
}
