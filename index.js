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

bot.onText(/\/gt (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

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

    const mint_res = await axios.post('https://api.nftport.xyz/v0/mints/easy/urls', {
        chain: 'polygon',
        name: resp,
        description: 'built with love by devesh',
        file_url: output[0],
        mint_to_address: '0xE964d1ad040334E863a1c5D03594Aa59F1Abea2b'
      }, {
        headers: {
          Authorization: process.env.NFTPORT_API_TOKEN,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })

      const mint_data = await mint_res.data
      console.log("Mint data ", mint_data)

      const txn_res = await axios.get(`https://api.nftport.xyz/v0/mints/${mint_data.transaction_hash}?chain=polygon`, {
        headers: {
          Authorization: process.env.NFTPORT_API_TOKEN,
          Accept: 'application/json'
        }
      })
      const txn_data = await txn_res.data
      console.log("Txn data ", txn_data)
      const minted_url = `https://opensea.io/assets/matic/${txn_data.contract_address}/${txn_data.token_id}`

      const caption = `
      Prompt: ${resp}
      Minted NFT: ${minted_url}
      `

  bot.sendPhoto(chatId, output[0], {caption: caption});

});

// 0xE964d1ad040334E863a1c5D03594Aa59F1Abea2b