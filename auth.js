const bcrypt = require('bcrypt');
const stateFile = require('./util/state-file');

const stateFilePath = 'admins.json';

function getState() {
    return stateFile.getState(stateFilePath);
}

function setState(newState) {
    return stateFile.setState(stateFilePath, newState);
}

async function isAuthenticated(userId) {
    const state = await getState();
    if (!state.admins) {
        return true;
    }
    return state.admins.includes(userId);
}

async function authenticate(userId, password) {
    const state = await getState();
    if (state.password) {
        const passwordsMatch = await bcrypt.compare(password, state.password);
        if (!passwordsMatch) {
            return false;
        }
    }

    const latestState = await getState();
    if (!latestState.admins || !latestState.admins.includes(userId)) {
        await setState({
            admins: (latestState.admins || []).concat(userId),
        });
    }
    return true;
}

async function setPassword(userId, newPassword) {
    if (!await isAuthenticated(userId)) {
        return false;
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    await setState({
        admins: [],
        password: newPasswordHash,
    });
    return true;
}

module.exports = {
    isAuthenticated,
    authenticate,
    setPassword,
};
