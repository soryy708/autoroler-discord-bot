const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
    ),
    transports: [
        new winston.transports.File({filename: 'log.txt'}),
        new winston.transports.Console({format: winston.format.simple()}),
    ],
});

/**
 * 
 * @param {String} level One of: error, warn, info, verbose, debug, silly
 * @param {String} serverId The ID of the server the bot is processing, or `null`
 * @param {String} commandId The ID of the command to which the bot reacts, or `null`
 * @param {String} message The message to write to the log
 * @param {Object} meta Any extra meta data to add to the log entry
 */
function log(level, serverId, commandId, message, meta = {}) {
    logger.log(level, message, {
        serverId,
        commandId,
        ...meta,
    });
}

module.exports = {
    log,
};
