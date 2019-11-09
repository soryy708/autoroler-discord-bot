const bl = require('../../bl');
const auth = require('../../auth');

module.exports = ['set-password', 'Change the admin password, un-authenticating everyone', async (bot, userName, userId, channelId, message, evt, args) => {
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
    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Authentication required',
        });
    }
}];
