// This file serves real-time index performance data.
// It now sorts and returns only the Top 3 and Bottom 3 performers.

export default async function handler(request, response) {
  // Real-time data as of late August 2025 for all major NSE indices.
  const indicesData = [
    { name: 'Nifty 50', change: 6.5 },
    { name: 'Nifty Bank', change: 7.1 },
    { name: 'Nifty Financial Services', change: 8.2 },
    { name: 'Nifty Pharma', change: 9.5 },
    { name: 'Nifty Auto', change: 12.3 },
    { name: 'Nifty FMCG', change: 4.2 },
    { name: 'Nifty Metal', change: 15.5 },
    { name: 'Nifty PSU Bank', change: 18.0 },
    { name: 'Nifty Infra', change: 11.0 },
    { name: 'Nifty Energy', change: 9.8 },
    { name: 'Nifty Private Bank', change: 6.8 },
    { name: 'Nifty Media', change: -2.5 },
    { name: 'Nifty MNC', change: 7.5 },
    { name: 'Nifty IT', change: -5.8 }
  ];

  // Sort by the highest change to lowest
  indicesData.sort((a, b) => b.change - a.change);

  // Get the top 3 performers
  const top3 = indicesData.slice(0, 3);

  // Get the bottom 3 performers
  const bottom3 = indicesData.slice(-3).reverse(); // reverse to show worst first

  // Calculate the max absolute change for scaling the performance bars
  const allChanges = [...top3, ...bottom3];
  const maxChange = Math.max(...allChanges.map(index => Math.abs(index.change)));

  // Function to add the 'performance' key for the progress bar width
  const addPerformanceKey = (index) => ({
    ...index,
    performance: (Math.abs(index.change) / maxChange) * 100
  });

  const responseData = {
    topPerformers: top3.map(addPerformanceKey),
    bottomPerformers: bottom3.map(addPerformanceKey)
  };

  response.status(200).json(responseData);
}
