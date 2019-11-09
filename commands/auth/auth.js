const bl = require('../../bl');
const auth = require('../../auth');

module.exports = ['auth', 'Authenticate as an administrator', async (bot, userName, userId, commandId, channelId, serverId, message, evt, args) => {
    if (args.length <= 1) {
        const isAuthenticated = await auth.isAuthenticated(userId);
        if (isAuthenticated) {
            bot.sendMessage({
                to: channelId,
                message: 'Already authenticated',
            });
        } else {
            bot.sendMessage({
                to: channelId,
                message: 'Missing argument',
            });
        }
        return;
    }

    const password = args[1];
    const isAuthenticated = await auth.authenticate(userId, password);
    if (isAuthenticated) {
        bl.sendMessageToAllBoundChannels(bot, `${userName} is now authenticated as admin`);
    } else {
        bl.sendMessageToAllBoundChannels(bot, `${userName} just failed admin authentication`);
    }
}];
