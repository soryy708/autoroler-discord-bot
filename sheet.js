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
            'return-empty': false,
        }, (err, cells) => {
            if (err) {
                reject(err);
                return;
            }
    
            const rawNames = cells.filter(cell => cell.col === state.sheetNamesColumn).sort((a, b) => a.row - b.row);
            const rawRanks = cells.filter(cell => cell.col === state.sheetRanksColumn).sort((a, b) => a.row - b.row);

            const names = [];
            if (rawNames.length > 0) {
                for(let i = 0; i < rawNames[0].row; ++i) {
                    names.push({
                        col: rawNames[0].col,
                        row: i,
                        _value: '',
                    });
                }
                rawNames.forEach((rawName, i) => {
                    names.push(rawName);
                    if (i + 1 < rawNames.length) {
                        for (let j = rawNames[i].row + 1; j < rawNames[i + 1].row; ++j) {
                            names.push({
                                col: rawName.col,
                                row: j,
                                _value: '',
                            });
                        }
                    }
                });
            }
            const ranks = [];
            if (rawRanks.length > 0) {
                for(let i = 0; i < rawRanks[0].row; ++i) {
                    ranks.push({
                        col: rawRanks[0].col,
                        row: i,
                        _value: '',
                    });
                }
                rawRanks.forEach((rawRank, i) => {
                    ranks.push(rawRank);
                    if (i + 1 < rawRanks.length) {
                        for (let j = rawRanks[i].row + 1; j < rawRanks[i + 1].row; ++j) {
                            ranks.push({
                                col: rawRank.col,
                                row: j,
                                _value: '',
                            });
                        }
                    }
                });
            }

            const result = [];
            
            for (let i = 0; i < names.length && i < ranks.length; ++i) {
                const name = i < names.length ? names[i]._value : '';
                const rank = i < ranks.length ? ranks[i]._value : '';
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
