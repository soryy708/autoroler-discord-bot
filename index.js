const Discord = require('discord.io');
const secrets = require('./secrets.json');
const bl = require('./bl');
const auth = require('./auth');
const sheet = require('./sheet');

const bot = new Discord.Client({
    token: secrets.token,
    autorun: true
});

const commands = [];

commands.push(['bind', 'Notify this channel when events happen', async (userName, userId, channelId) => {
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
}]);

commands.push(['sync', 'Update user roles in all bound servers, based on google sheet', async (userName, userId, channelId) => {
    bot.sendMessage({
        to: channelId,
        message: 'Synchronizing',
    });
    await bl.bindToChannel(bot, channelId);
    const syncSuccessful = await bl.sync(bot);
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
}]);

commands.push(['auth', 'Authenticate as an administrator', async (userName, userId, channelId, message, evt, args) => {
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
}]);

commands.push(['set-password', 'Change the admin password, un-authenticating everyone', async (userName, userId, channelId, message, evt, args) => {
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
}]);

commands.push(['set-url', 'Change which google sheet I should read from when synchronizing', async (userName, userId, channelId, message, evt, args) => {
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

    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Authentication required',
        });
    }
}]);

commands.push(['set-ranks-column', 'Change which google sheet column I should read ranks from when synchronizing', async (userName, userId, channelId, message, evt, args) => {
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

    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Authentication required',
        });
    }
}]);

commands.push(['set-names-column', 'Change which google sheet column I should read names from when synchronizing', async (userName, userId, channelId, message, evt, args) => {
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
        await sheet.setNamesColumn(newColumnIndex);
        bot.sendMessage({
            to: channelId,
            message: 'Names column set',
        });

    } else {
        bot.sendMessage({
            to: channelId,
            message: 'Authentication required',
        });
    }
}]);

commands.push(['help', 'Show this message', (userName, userId, channelId) => {
    const commandDescriptions = commands.map(arr => {
        let command = arr[0];
        const description = arr[1];
        if (command === 'auth') {
            command = 'auth <password>';
        }
        else if (command === 'set-password') {
            command = 'set-password <new password>';
        }
        else if (command === 'set-url') {
            command = 'set-url <new url>';
        }
        else if (command === 'set-ranks-column') {
            command = 'set-ranks-column <new column index (starting at 0)>';
        }
        else if (command === 'set-names-column') {
            command = 'set-names-column <new column index (starting at 0)>';
        }

        return `\`!${command}\`\t- ${description}`;
    });
    
    bot.sendMessage({
        to: channelId,
        message: [
            'All available commands are:',
            ...commandDescriptions,
        ].join('\n'),
    });
}]);

bot.on('ready', (evt) => {
    console.log('Connected');
});

bot.on('message', async (userName, userId, channelId, message, evt) => {
    // Listen for messages that start with '!'
    if (message.substring(0, 1) == '!') {
        const args = message.substring(1).split(' ');
        const cmd = args[0];
       
        const relevantCommand = commands.find(([command, description, listener]) => command === cmd);
        if (relevantCommand) {
            const listener = relevantCommand[2];
            listener(userName, userId, channelId, message, evt, args);
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
