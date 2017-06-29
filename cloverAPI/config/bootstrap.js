/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var apn = require('apn');

module.exports.bootstrap = function(cb) {

    request = require('request');

    /**
     * Apple Push Notifications
     */
    var options = {
        cert: __dirname + '/env/partake_prod.pem',
        key: __dirname + '/env/partake_prod.pem',
        production: true
    };

    sails.apnConnection = new apn.Connection(options);

    sails.apnConnection.on("error", function(error) {
        console.log("APN error: " + error);
    });

    sails.apnConnection.on("socketError", function(error) {
        console.log("APN socketError: " + error);
    });

    sails.apnConnection.on("transmitted", function(notification, device) {
        console.log("APN transmitted");
    });

    sails.apnConnection.on("completed", function() {
        console.log("APN completed");
    });

    sails.apnConnection.on("cacheTooSmall", function(sizeDifference) {
        console.log("APN cacheTooSmall");
    });

    sails.apnConnection.on("connected", function(openSockets) {
        console.log("APN connected: " + openSockets);
    });

    sails.apnConnection.on("disconnected", function(openSockets) {
        console.log("APN disconnected");
    });

    sails.apnConnection.on("timeout", function() {
        console.log("APN timeout");
    });

    sails.apnConnection.on("transmissionError", function(errorCode, notification, device) {
        console.log("APN error: " + errorCode);
    });

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    cb();

};