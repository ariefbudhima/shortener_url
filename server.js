require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get allowed origin from environment variable
const allowedOriginBase = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// CORS configuration using environment variable
const corsOptions = {
  origin: function (origin, callback) {
    // Create both http and https versions of the allowed origin
    const allowedOrigins = [
      `http://${allowedOriginBase}`,
      `https://${allowedOriginBase}`
      `http://localhost:3000`,
      `https://localhost:3000`
    ];
    
    // Allow the origins from env variable or requests with no origin (like curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl) return res.status(400).json({ error: "URL is required" });

  const formattedUrl = originalUrl.startsWith("http://") || originalUrl.startsWith("https://")
    ? originalUrl
    : `http://${originalUrl}`;

  const short = uuidv4().slice(0, 6);
  await pool.query("INSERT INTO urls (short, original) VALUES ($1, $2)", [short, formattedUrl]);

  res.json({ shortUrl: `${process.env.BASE_URL}/${short}` });
});

app.get("/:short", async (req, res) => {
  const { short } = req.params;
  const result = await pool.query("SELECT original FROM urls WHERE short = $1", [short]);

  if (result.rows.length) {
    let originalUrl = result.rows[0].original;

    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = `http://${originalUrl}`;
    }

    res.redirect(originalUrl);
  } else {
    res.status(404).json({ error: "URL Not Found" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});