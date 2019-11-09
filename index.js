const Discord = require('discord.io');
const secrets = require('./secrets.json');
const commands = require('./commands');
const bl = require('./bl');
const logUtil = require('./util/log');

let currentCommandId = 0;
function getCommandId() {
    return currentCommandId++;
}

const bot = new Discord.Client({
    token: secrets.token,
    autorun: true
});

bot.on('ready', (evt) => {
    logUtil.log('info', null, null, 'Connected');
});

bot.on('message', async (userName, userId, channelId, message, evt) => {
    // Listen for messages that start with '!'
    if (message.substring(0, 1) == '!') {
        const args = message.substring(1).split(' ');
        const cmd = args[0];
        
        const relevantCommand = commands.getCommandListener(cmd);
        if (relevantCommand) {
            const serverId = (bot.channels[channelId] || {}).guild_id;
            const commandId = getCommandId();

            logUtil.log('verbose', serverId, commandId, 'Received command', {command: cmd});

            try {
                await relevantCommand(bot, userName, userId, commandId, channelId, serverId, message, evt, args);
            } catch (e) {
                logUtil.log('error', serverId, commandId, 'Exception when processing command', {exception: e});
                bot.sendMessage({
                    to: channelId,
                    message: `I encountered an error when processing this.\nYour commandId is ${commandId}. Please see the log for details.`,
                });
            }
        }
    }
});

bot.on('disconnect', (errorMessage, code) => {
    logUtil.log('error', null, null, 'Error connecting', {code, errorMessage});
});

process
    .on('unhandledRejection', (reason, promise) => {
        logUtil.log('error', null, null, 'Unhandled rejection at Promise', {reason, promise});
        bl.sendMessageToAllBoundChannels(bot, 'I\'ve encountered an async error. Please see the log.');
    })
    .on('uncaughtException', exception => {
        logUtil.log('error', null, null, 'Uncaught exception thrown', {exception});
        bl.sendMessageToAllBoundChannels(bot, 'I\'ve encountered an error. Please see the log.');
    });
