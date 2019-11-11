const request = require('request');
const sheet = require('./sheet');
const stateFileUtil = require('./util/state-file');
const secrets = require('./secrets.json');
const logUtil = require('./util/log');

const stateFilePath = 'data.json';

function getState() {
    return stateFileUtil.getState(stateFilePath);
}

function setState(newState) {
    return stateFileUtil.setState(stateFilePath, newState);
}

async function isBoundToChannel(bot, channelId) {
    const state = await getState();
    const boundChannels = state.boundChannels || [];
    return boundChannels.find(boundChannel => boundChannel === channelId) !== undefined;
}

async function bindToChannel(bot, channelId) {
    if (!await isBoundToChannel(bot, channelId)) {
        const oldState = await getState();
        await setState({
            boundChannels: (oldState.boundChannels || []).concat(channelId),
        });
    }
}

async function sync(bot, requestServerId, commandId) {
    const state = await getState();
    const boundChannels = state.boundChannels || [];
    const data = await sheet.getData();
    if (data.length === 0) {
        logUtil.log('warn', requestServerId, commandId, 'Could not get google sheet data');
        return false;
    }

    const allRolesInSheet = data.map(([name, rank]) => rank);
    const processedServers = [];

    async function runSync(serverId) {
        if (!serverId || processedServers.includes(serverId) || !bot.servers[serverId]) {
            return;
        } else {
            processedServers.push(serverId);
        }

        const server = bot.servers[serverId];
        const relevantServerRoles = Object.values(server.roles).filter(serverRole => {
            return allRolesInSheet.reduce((prev, sheetRole) => prev || serverRole.name.includes(sheetRole), false);
        });
        const mappedServerRoles = relevantServerRoles.map(serverRole => [serverRole.name, serverRole.id]);
        const serverUsers = Object.values(bot.users);

        const groupedLog = logUtil.groupedLog();
        await Promise.all(data.map(async ([name, rank]) => {
            function setUserRoles(serverId, userId, roles) {
                // https://github.com/izy521/discord.io/issues/289#issuecomment-418552716
                return new Promise((resolve, reject) => {
                    request({
                        url: `https://discordapp.com/api/v6/guilds/${serverId}/members/${userId}`,
                        headers: {
                            'User-Agent': 'DiscordBot (Custom API request, 1.0)',
                            'Authorization': `Bot ${secrets.token}`,
                            'Content-Type': 'application/json',
                        },
                        method: 'PATCH',
                        body: JSON.stringify({roles: roles})
                    }, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        if (response.statusCode !== 204) {
                            reject(body);
                        }
                        resolve(body);
                    });
                });
            }

            const user = serverUsers.find((serverUser) => serverUser.username.includes(name));
            const role = mappedServerRoles.find(([roleName, id]) => roleName.includes(rank));
            if (!user || !role) {
                if (!user) {
                    groupedLog.log('warn', serverId, commandId, 'Could not find user in server', {username: name});
                }
                if (!role) {
                    groupedLog.log('warn', serverId, commandId, 'Could not find role in server', {role: rank});
                }

                return;
            }

            const currentRoles = server.members[user.id].roles;
            const currentRoleIds = currentRoles.map(role => role.id);

            const filteredRoleIds = currentRoleIds.filter(roleId => {
                return relevantServerRoles.reduce((prev, [serverRoleName, serverRoleId]) => prev || serverRoleId === roleId, false);
            });
            const removedRoles = currentRoleIds.filter(role => {
                const roleId = role[1];
                return !relevantServerRoles.reduce((prev, [serverRoleName, serverRoleId]) => prev || serverRoleId === roleId, false);
            });
            const removedRoleNames = removedRoles.map(role => role[0]);
            const newRoles = filteredRoleIds.concat(role[1]);
            try {
                await setUserRoles(serverId, user.id, newRoles);
                groupedLog.log('info', serverId, commandId, 'Changed user role', {username: user.username, removedRoles: removedRoleNames, addedRoles: role[0]});
            } catch(e) {
                groupedLog.log('error', serverId, commandId, 'User role change failed', {username: user.username, newRoles, exception: e.toString(), stackTrace: e.stack});
            }
        }))
            .finally(() => {
                groupedLog.flush();
            });
    }

    if (!requestServerId) {
        await Promise.all(boundChannels.map(channelId => {
            const serverId = (bot.channels[channelId] || {}).guild_id;
            return runSync(serverId);
        }));
    } else {
        await runSync(requestServerId);
    }

    return true;
}

async function sendMessageToAllBoundChannels(bot, message) {
    const state = await getState();
    const boundChannels = state.boundChannels || [];
    boundChannels.forEach(channelId => {
        bot.sendMessage({
            to: channelId,
            message: message,
        });
    });
}

module.exports = {
    isBoundToChannel,
    bindToChannel,
    sync,
    sendMessageToAllBoundChannels,
};
