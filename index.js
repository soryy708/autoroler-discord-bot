const Discord = require('discord.io');
const secrets = require('./secrets.json');
const commands = require('./commands');
const bl = require('./bl');

const bot = new Discord.Client({
    token: secrets.token,
    autorun: true
});

bot.on('ready', (evt) => {
    console.log('Connected');
});

bot.on('message', async (userName, userId, channelId, message, evt) => {
    // Listen for messages that start with '!'
    if (message.substring(0, 1) == '!') {
        const args = message.substring(1).split(' ');
        const cmd = args[0];
        
        const relevantCommand = commands.getCommandListener(cmd);
        if (relevantCommand) {
            await relevantCommand(bot, userName, userId, channelId, message, evt, args);
        }
    }
});

bot.on('disconnect', (errMsg, code) => {
    console.log(`Error connecting (${code}): ${errMsg}`);
});

process
    .on('unhandledRejection', (reason, promise) => {
        console.log(reason, 'Unhandled rejection at Promise', promise);
        bl.sendMessageToAllBoundChannels(bot, 'I\'ve encountered an async error. Please see the log.');
    })
    .on('uncaughtException', err => {
        console.log('Uncaught exception thrown');
        console.log(err);
        bl.sendMessageToAllBoundChannels(bot, 'I\'ve encountered an error. Please see the log.');
    });
