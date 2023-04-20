require("dotenv").config();
const axios = require("axios");
const { Client, GatewayIntentBits } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

// Initialize OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Initialize Discord API
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.login(process.env.DISCORD_BOT_TOKEN);

// Initialize RSS Parser
const Parser = require("rss-parser");
const parser = new Parser();

async function fetchNewArticles() {
  const feedURL = "https://rss.panewslab.com/zh/tvsq/rss";
  const feed = await parser.parseURL(feedURL);

  try {
    //yesterday
    let date = new Date();
    date.setDate(date.getDate() - 1);

    const newArticles = feed.items.filter(
      (item) => new Date(item.pubDate) > date
    );

    if (newArticles.length > 0) {
      console.log(`${newArticles.length} new articles found:`);

      for (const item of newArticles) {
        console.log(`${item.title} (${item.link})`);
        await translateAndChat(item.content);
      }
    } else {
      console.log("No new articles found.");
    }
  } catch (error) {
    console.error("Error fetching the RSS feed:", error);
  }
}

async function translateAndChat(article_text) {
  const input_text = `Translate the following Chinese text to English: ${article_text}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: input_text }],
  });
  // console.log(completion.data);
  // console.log(completion.data["choices"]);
  const text = completion.data["choices"][0]["message"]["content"];
  console.log(text);

  const channel = client.channels.cache.get(process.env.CHANNEL_ID);
  if (channel) {
    channel.send(text);
  } else {
    console.error("Channel not found");
  }
}

// exports.handler = async (event, context) => {
//   await fetchNewArticles();
// };

async function main() {
  await fetchNewArticles();
}

main().catch((error) => {
  console.error(error);
});
