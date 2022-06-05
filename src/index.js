require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require('body-parser')
const instagramBot = require("./instagram.bot");

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

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
