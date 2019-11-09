const bl = require('../../bl');

module.exports = ['sync', 'Update user roles in all bound servers, based on google sheet', async (bot, userName, userId, channelId) => {
    bot.sendMessage({
        to: channelId,
        message: 'Synchronizing',
    });
    await bl.bindToChannel(bot, channelId);
    const syncSuccessful = await bl.sync(bot, channelId);
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
