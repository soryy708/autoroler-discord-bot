const bl = require('../../bl');

module.exports = ['sync', 'Update user roles in this server, based on google sheet', async (bot, userName, userId, commandId, channelId, serverId) => {
    bot.sendMessage({
        to: channelId,
        message: 'Synchronizing',
    });
    await bl.bindToChannel(bot, channelId);
    const syncSuccessful = await bl.sync(bot, serverId, commandId);
    if (syncSuccessful) {
        bot.sendMessage({
            to: channelId,
            message: 'Synchronization complete',
        });
    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Synchronization failure. Perhaps configuration is required?',
        });
    }
}];
