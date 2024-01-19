require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHATGPT_DEFAULT_TOKEN = process.env.CHATGPT_DEFAULT_TOKEN;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// In-memory storage for user OpenAI tokens
const userOpenAiTokens = {};

const listCommand = [
  { text: "/start", description: "Start talking" },
  { text: "/help", description: "Show all commands" },
  { text: "/gpt", description: "Use chat GPT" },
  { text: "/set_openai_token", description: "Set your OpenAI token" },
];

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const { first_name, last_name } = msg.chat;

  // Send a welcome message
  bot.sendMessage(
    chatId,
    `Hello ${first_name} ${last_name}! What can I help you?`,
  );
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const { first_name, last_name } = msg.chat;

  // Send a welcome message
  bot.sendMessage(
    chatId,
    `List of commands 💻:\n\n${listCommand.map((item) => `${item.text} - ${item.description}`).join("\n")}`,
  );
});

bot.onText(/\/set_openai_token/, (msg) => {
  const chatId = msg.chat.id;
  const userOpenAiToken = msg.text
    .trim()
    .replace("/set_openai_token", "")
    .trim();
  if (!userOpenAiToken) {
    bot.sendMessage(chatId, "Use syntax: /set_openai_token <YOUR_OPENAI_KEY>");
  } else {
    // Save user's OpenAI token in the storage
    userOpenAiTokens[chatId] = userOpenAiToken;

    bot.sendMessage(chatId, "OpenAI token set successfully!");
  }
});

// nghe message
bot.onText(/\/gpt/, async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text.trim().replace("/gpt", "").trim();

  // Check if user has set an OpenAI token
  const userOpenAiToken = userOpenAiTokens[chatId];
  if (!userOpenAiToken) {
    bot.sendMessage(
      chatId,
      "You have not set your OPEN_API_KEY\nUse syntax: /set_openai_token <YOUR_OPENAI_KEY>",
    );
  } else {
    // nếu message rỗng
    if (!messageText) {
      bot.sendMessage(chatId, "Use syntax: /gpt <YOUR_MESSAGE>");
    } else {
      bot.sendChatAction(chatId, "typing");
      try {
        const openai = new OpenAI({
          apiKey: userOpenAiToken,
        });

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: messageText }],
          temperature: 0.7,
        });

        // Respond to the message (optional)
        bot.sendMessage(chatId, response.data.choices[0].message.content);
      } catch (e) {
        bot.sendMessage(
          chatId,
          `Error ⚠️\nType: ${e.error.type}\nMessage: ${e.error.message}`,
        );
      }
    }
  }
});

// Handle errors
bot.on("polling_error", (error) => {
  console.error(`Polling error: ${error.message}`);
});

console.log(
  "Bot is running and listening for /setopenaitoken and /gpt commands.",
);
