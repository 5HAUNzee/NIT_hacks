const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Sentiment = require("sentiment");

const app = express();
const sentiment = new Sentiment();

app.use(cors());
app.use(bodyParser.json());

// Route for sentiment analysis
app.post("/analyze", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const result = sentiment.analyze(text);
  const overall =
    result.score > 0 ? "positive" : result.score < 0 ? "negative" : "neutral";

  res.json({
    text,
    score: result.score,
    overall,
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
