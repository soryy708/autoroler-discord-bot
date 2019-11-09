const commands = [];

commands.push(
    ...require('./auth'),
    ...require('./bl'),
    ...require('./sheets')
);

commands.push(['help', 'Show this message', (bot, userName, userId, channelId) => {
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
            command = 'set-ranks-column <new column index (starting at 1)>';
        }
        else if (command === 'set-names-column') {
            command = 'set-names-column <new column index (starting at 1)>';
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

function getCommand(subject) {
    return commands.find(([command, description, listener]) => command === subject);
}

function getCommandListener(subject) {
    const [command, description, listener] = getCommand(subject);
    return listener;
}

module.exports = {
    getCommandListener,
};
