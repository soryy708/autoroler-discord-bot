const bl = require('../../bl');
const auth = require('../../auth');
const logUtil = require('../../util/log');

module.exports = ['set-password', 'Change the admin password, un-authenticating everyone', async (bot, userName, userId, commandId, channelId, serverId, message, evt, args) => {
    if (args.length <= 1) {
        bot.sendMessage({
            to: channelId,
            message: 'Missing argument',
        });
        return;
    }

    const newPassword = args[1];
    const isAuthenticated = await auth.isAuthenticated(userId);
    if (isAuthenticated) {
        await auth.setPassword(userId, newPassword);
        bl.sendMessageToAllBoundChannels(bot, `@${userName} changed the admin password just now`);
        logUtil.log('info', serverId, commandId, 'Admin password changed', {requestor: userName});

    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Authentication required',
        });
    }
}];
