process.env['NTBA_FIX_319'] = 1;
require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(process.env.TELEGRAM_API_KEY, {polling: true})
const ical = require('node-ical')
const dayjs = require('dayjs')
const locale = require('dayjs/locale/de')
const schedule = require('node-schedule')

dayjs.locale(locale)

let data = ical.parseFile('muellkalender.ics')
let chatID
let job
const interval = 24

function sendRubbishMessage(customInterval) {
    let messages
    
    if (Number.isInteger(customInterval)) {
        messages = checkNext(customInterval)    
    } else {
        messages = checkNext(interval)
    }

    if (chatID && messages.length) {
        messages.forEach(message => bot.sendMessage(chatID, message))
    } else if (!chatID){
        console.error('chatID not set')
    }
}

function checkNext(hours) {
    data = Object.values(data).filter(date => dayjs(date.start).diff(dayjs(), 'hour') >= 0)
    const messages = []
	if (data.length <= 0) {
	    return 'Kalendar enthält keine aktuellen Daten mehr. Downloade den aktuellen.'
	} else {
		data.forEach(date => {
			if (dayjs(date.start).diff(dayjs(), 'hour') <= hours) {
		  		messages.push(`Müll rausbringen. ${date.summary.match(/- (.*)/)[1]} wird am ${dayjs(date.start).format('dddd DD.MM.YYYY')} abgeholt.`)
			}
		})
		return messages
	}
}

bot.onText(/\/start/, msg => {
    chatID = msg.chat.id;
	bot.sendMessage(chatID, `Bot wird neugestartet. Der Bot checkt jeden Morgen um 7:00 und Abends um 19:00 ob Müll rausgebracht werden muss.`)	
	if (!job) {
		job = schedule.scheduleJob('rubbishjob', '0 7,19 * * *', sendRubbishMessage)	
	}			
})

bot.onText(/\/active/, msg => {
	msg.chat.id === chatID ? bot.sendMessage(chatID, 'Bot läuft in diesem Channel') : bot.sendMessage(msg.chat.id, 'Bot läuft in einem anderen Channel. Um hier zu verwenden /start tippen.') 
})

bot.onText(/\/test/, msg => {
    // debugging function to check for the next 30 days
    sendRubbishMessage(720) 
})




