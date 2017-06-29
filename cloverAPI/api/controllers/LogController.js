/**

* @module Controller : LogController
* @description A simple module that provides a way to display logs in a simple web page

*/
module.exports = {

    /**
     * @description Read the logs for current day and generate the view
     * @return A web page
     */
    find: function(req, res, next) {
        var moment = require('moment');
        var now = moment();
        var todayDate = now.format("YYYY-MM-DD");
        var logPath = './logs/log.log.' + todayDate;
        var fs = require('fs');
        fs.exists(logPath, function(exist) {
            if (exist) {
                fs.readFile(logPath, 'utf-8', function(error, data) {
                    var lines = [];
                    if (!error) {
                        lines = data.toString()
                            .split('\n')
                            .reverse()
                            .splice(1, 500);

                        for (var i = 0; i < lines.length; i++) {
                            lines[i] = JSON.parse(lines[i]);
                        }

                    }

                    res.view("logs", {
                        lines: lines
                    });

                })

            } else {
                res.view("logs", {
                    lines: []
                });
            }
        })

    },

};