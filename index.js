require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')

const token = process.env.TG_TOKEN

const bot = new TelegramBot(token, { polling: true })

console.log("Bot has started")

bot.onText(/\/gt (.+)/, (msg, match) => {

	const chatId = msg.chat.id
	const resp = match[1]

	bot.sendMessage(chatId, resp)
})