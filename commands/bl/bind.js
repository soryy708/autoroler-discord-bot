const bl = require('../../bl');

module.exports = ['bind', 'Notify this channel when events happen', async (bot, userName, userId, channelId) => {
    if (await bl.isBoundToChannel(bot, channelId)) {
        bot.sendMessage({
            to: channelId,
            message: 'Already bound',
        });

    } else {
        await bl.bindToChannel(bot, channelId);
        bot.sendMessage({
            to: channelId,
            message: 'Now bound to channelId=' + channelId,
        });
    }
}];
