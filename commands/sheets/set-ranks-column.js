const auth = require('../../auth');
const sheet = require('../../sheet');
const logUtil = require('../../util/log');

module.exports = ['set-ranks-column', 'Change which google sheet column I should read ranks from when synchronizing', async (bot, userName, userId, commandId, channelId, serverId, message, evt, args) => {
    if (args.length <= 1) {
        bot.sendMessage({
            to: channelId,
            message: 'Missing argument',
        });
        return;
    }

    const newColumnIndex = args[1];
    const isAuthenticated = await auth.isAuthenticated(userId);
    if (isAuthenticated) {
        await sheet.setRanksColumn(newColumnIndex);
        bot.sendMessage({
            to: channelId,
            message: 'Ranks column set',
        });
        logUtil.log('info', serverId, commandId, 'Ranks column changed', {requestor: userName, newColumnIndex});

    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Authentication required',
        });
    }
}];
