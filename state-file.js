const fs = require('fs');

function getState(stateFilePath) {
    return new Promise((resolve, reject) => {
        if (!stateFilePath) {
            reject('No file path');
        }

        fs.exists(stateFilePath, exists => {
            if (!exists) {
                resolve({});
                return;
            }

            fs.readFile(stateFilePath, 'utf-8', (err, buffer) => {
                if (err) {
                    reject(err);
                    return;
                }
                const state = JSON.parse(buffer);
                resolve(state);
            });
        });
    });
}

function setState(stateFilePath, newState) {
    return new Promise((resolve, reject) => {
        if (!stateFilePath) {
            reject('No file path');
        }

        getState(stateFilePath)
            .then(oldState => {
                const data = JSON.stringify(Object.assign(oldState, newState));
                fs.writeFile(stateFilePath, data, 'utf-8', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            })
            .catch(err => {
                reject(err);
            });
    });
}

module.exports = {
    getState,
    setState,
};
