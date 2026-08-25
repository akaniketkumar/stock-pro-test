const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Keys Verification Route
app.get('/test-keys', (req, res) => {
  res.json({
    message: "Keys are securely loaded!",
    clientCode: process.env.CLIENT_CODE ? "Available" : "Missing"
  });
});

// 2. Complete Live Market Data Route
app.get('/get-market-data', async (req, res) => {
  try {
    // 5paisa Open API endpoint for fetching market data / scrip details
    const marketUrl = "https://OpenApi.5paisa.com/VendorsAPI/Service1.svc/V3/MarketFeed";

    const payload = {
      head: {
        Key: process.env.APP_KEY
      },
      body: {
        ClientCode: process.env.CLIENT_CODE,
        // Yahan hum example ke taur par ek stock ki request bhej rahe hain (Jaise RELIANCE)
        Exch: "N",
        ExchType: "C",
        ScripCode: 2885 // Reliance Industries ka code example
      }
    };

    // Hum yahan API request bhej rahe hain
    const response = await axios.post(marketUrl, payload);

    res.json({
      success: true,
      message: "Market data fetched successfully!",
      data: response.data
    });

  } catch (error) {
    console.error("5paisa market data fetch failed:", error.message);
    // Fallback so the app doesn't crash, but honestly flagged as fallback (not live) data
    res.json({
      success: false,
      fallback: true,
      message: "Live feed unavailable right now, showing fallback status.",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});