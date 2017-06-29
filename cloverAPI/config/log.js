/**
 * Built-in Log Configuration
 * (sails.config.log)
 *
 * Configure the log level for your app, as well as the transport
 * (Underneath the covers, Sails uses Winston for logging, which
 * allows for some pretty neat custom transports/adapters for log messages)
 *
 * For more information on the Sails logger, check out:
 * http://sailsjs.org/#/documentation/concepts/Logging
 */

var winston = require('winston');

var customLogger = new winston.Logger({
    transports: [
        new(winston.transports.DailyRotateFile)({
            level: 'debug',
            filename: './logs/log.log'
        }),
    ],
});

module.exports.log = {
    custom: customLogger,
    level: "debug"
};