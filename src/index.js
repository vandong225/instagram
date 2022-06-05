require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require('body-parser')
const instagramBot = require("./instagram.bot");

function exitHandler(options, exitCode) {
  if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

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
