require('dotenv').config();
const express = require("express");
const app = express();
const instagramBot = require("./instagram.bot");

app.get("/", async (req, res) => {
  await instagramBot.buildBot();
  res.send("Hello World");
});

app.get("/screenshot", async (req, res) => {
  await instagramBot.screenshot();
  res.send("Hello World");
});

app.listen(3000, () => {
  console.log("running on port 3000");
});
