const express = require("express");
const path = require("path");
const app = express();
require("dotenv").config();
const connectDB = require("./src/db/connect");
console.log("URI:", process.env.MONGODB_URI);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve UI
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api", require("./routes/api"));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Resume Matcher API is running",
    endpoints: {
      parseResume: "POST /api/parse/resume",
      parseJD:     "POST /api/parse/jd",
      match:       "POST /api/match"
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(` Resume Matcher running on http://localhost:${PORT}`);
  });
});

module.exports = app;
