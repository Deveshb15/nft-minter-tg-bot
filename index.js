require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const Replicate = require("replicate");
const axios = require("axios");

const token = process.env.TG_TOKEN;
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const bot = new TelegramBot(token, { polling: true });

console.log("Bot has started");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  if (text === "/start" || text === "/hello") {
    // Greeting message
    const welcomeMessage =
      "Welcome to the Minter bot!\n\n" +
      "You can mint an AI generated image as an NFT\n\n" +
      "Just add your wallet address and a prompt to generate image" +
      "Please enter your message or command.\n\n" +
      "/gt <wallet address> <prompt>";
    bot.sendMessage(chatId, welcomeMessage);
  } else if (text === "/help") {
    // Help message
    const helpMessage =
      "You can use the command below\n\n" + "/gt <wallet address> <prompt>";
    bot.sendMessage(chatId, helpMessage);
  }
});

bot.onText(/\/gt (.+)/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const message_string = match[1];
    const message_array = message_string.split(" ");
    const wallet = message_array[0];
    const resp = message_array.slice(1).join(" ");

    console.log("Wallet address ", wallet);
    console.log("Prompt ", resp);
    // add a loading message
    const loading_message = await bot.sendMessage(chatId, "Generating NFT...");

    console.log("Input ", resp);
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: resp,
        },
      }
    );
    console.log("Output ", output);

    const mint_res = await axios.post(
      "https://api.nftport.xyz/v0/mints/easy/urls",
      {
        chain: "polygon",
        name: resp,
        description: "built with love by devesh",
        file_url: output[0],
        mint_to_address: wallet,
      },
      {
        headers: {
          Authorization: process.env.NFTPORT_API_TOKEN,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const mint_data = await mint_res.data;
    console.log("Mint data ", mint_data);

    // await sleep(5000);
    let txn_res;
    let txn_data;
    let counter = 0;
    await sleep(5000);
    txn_res = await axios.get(
      `https://api.nftport.xyz/v0/mints/${mint_data.transaction_hash}?chain=polygon`,
      {
        headers: {
          Authorization: process.env.NFTPORT_API_TOKEN,
          Accept: "application/json",
        },
      }
    );

    txn_data = await txn_res.data;

    console.log("Txn data ", txn_data);
    const minted_url = `https://opensea.io/assets/matic/${txn_data.contract_address}/${txn_data.token_id}`;

    const caption = `
Prompt: ${resp}
Minted NFT: ${minted_url}
`;

    // delete the loading message
    bot.deleteMessage(chatId, loading_message.message_id);
    bot.sendPhoto(chatId, output[0], { caption: caption });
  } catch (err) {
    console.log(err.message);
  }
});