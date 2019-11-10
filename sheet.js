const GoogleSpreadsheet = require('google-spreadsheet');
const stateFileUtil = require('./util/state-file');
const secrets = require('./secrets.json');

const stateFilePath = 'data.json';

function getState() {
    return stateFileUtil.getState(stateFilePath);
}

function setState(newState) {
    return stateFileUtil.setState(stateFilePath, newState);
}

async function setSourceUrl(url) {
    await setState({
        sheetUrl: url,
    });
}

async function setRanksColumn(columnIndex) {
    await setState({
        sheetRanksColumn: columnIndex,
    });
}

async function setNamesColumn(columnIndex) {
    await setState({
        sheetNamesColumn: columnIndex,
    });
}

async function getData() {
    const state = await getState();
    if (!state.sheetUrl || !state.sheetNamesColumn || !state.sheetRanksColumn) {
        return [];
    }

    if (isNaN(Number(state.sheetNamesColumn)) || isNaN(Number(state.sheetRanksColumn))) {
        return [];
    }

    state.sheetNamesColumn = Number(state.sheetNamesColumn);
    state.sheetRanksColumn = Number(state.sheetRanksColumn);

    const urlSuffix = state.sheetUrl.slice('https://docs.google.com/spreadsheets/d/'.length);
    const sheetKey = urlSuffix.slice(0, urlSuffix.indexOf('/'));

    const doc = new GoogleSpreadsheet(sheetKey);
    
    if (secrets.gcloud_client_email && secrets.gcloud_private_key) {
        await new Promise((resolve, reject) => {
            doc.useServiceAccountAuth({
                client_email: secrets.gcloud_client_email,
                private_key: secrets.gcloud_private_key,
            }, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    const info = await new Promise((resolve, reject) => {
        doc.getInfo((err, info) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(info);
        });
    });

    return new Promise((resolve, reject) => {
        const worksheet = info.worksheets[0];
    
        doc.getCells(worksheet.id, {
            'min-col': Math.min(state.sheetNamesColumn, state.sheetRanksColumn),
            'max-col': Math.max(state.sheetNamesColumn, state.sheetRanksColumn),
            'return-empty': true,
        }, (err, cells) => {
            if (err) {
                reject(err);
                return;
            }
    
            const names = cells.filter(cell => cell.col === state.sheetNamesColumn);
            const ranks = cells.filter(cell => cell.col === state.sheetRanksColumn);
            const result = [];
            
            for (let i = 0; i < names.length && i < ranks.length; ++i) {
                const name = i < names.length ? names[i]._value : null;
                const rank = i < ranks.length ? ranks[i]._value : null;
                if (name !== '' && rank !== '') {
                    result.push([name, rank]);
                }
            }
            resolve(result);
        });
    });
}

module.exports = {
    setSourceUrl,
    setRanksColumn,
    setNamesColumn,
    getData,
};
