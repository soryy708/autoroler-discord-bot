const auth = require('../../auth');
const sheet = require('../../sheet');
const logUtil = require('../../util/log');

module.exports = ['set-url', 'Change which google sheet I should read from when synchronizing', async (bot, userName, userId, commandId, channelId, serverId, message, evt, args) => {
    if (args.length <= 1) {
        bot.sendMessage({
            to: channelId,
            message: 'Missing argument',
        });
        return;
    }

    const newUrl = args[1];
    const isAuthenticated = await auth.isAuthenticated(userId);
    if (isAuthenticated) {
        await sheet.setSourceUrl(newUrl);
        bot.sendMessage({
            to: channelId,
            message: 'Source URL set',
        });
        logUtil.log('info', serverId, commandId, 'Source URL changed', {requestor: userName, newUrl});

    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Authentication required',
        });
    }
}];
