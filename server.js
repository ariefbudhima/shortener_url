require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
