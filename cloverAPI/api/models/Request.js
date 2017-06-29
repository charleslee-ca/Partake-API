/**
 * Request.js
 *
 * @class Request
 * @description Model that represents a Request
 * @property {string}  			note		- Request note provided by the requester
 * @property {string}  			state		- Request state. ["Pending, Accepted, Cancelled, Rejected"]
 * @property {User}  			requester	- User who made the request
 * @property {Activity}			activity	- Activity on which the request was made
 * @property {string}  			date		- Request date
 */

module.exports = {

    attributes: {

        note: {
            type: 'string'
        },

        state: {
            type: 'string',
            enum: [sails.config.constants.REQUEST_STATUS.PENDING, sails.config.constants.REQUEST_STATUS.ACCEPTED,
                sails.config.constants.REQUEST_STATUS.CANCELLED, sails.config.constants.REQUEST_STATUS.REJECTED
            ]
        },

        requester: {
            model: 'user',
            required: true
        },

        activity: {
            model: 'activity',
            required: true
        },

        date: {
            type: 'string'
        }

    },

    /*
    	Before create the Request we get today´s date to set date property in the request.
    */
    beforeCreate: function(values, cb) {
        sails.log.debug("RequestModel > Creating request");
        try {
            var actualDateFormatString = DateHelper.createActualDateWithFormat_yyyyMMdd();
            sails.log.debug("Correct actual date created: " + actualDateFormatString);
            values.date = actualDateFormatString;
            values.state = sails.config.constants.REQUEST_STATUS.PENDING;
            cb();
        } catch (err) {
            cb({ error: "Error while creating actual date for request." });
        }
    }



};