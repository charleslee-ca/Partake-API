/**
 * Report.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {

        reportedReason: {
            type: 'string',
            enum: [sails.config.constants.REPORT_USER_REASON.PHOTOS, sails.config.constants.REPORT_USER_REASON.MESSAGES,
                sails.config.constants.REPORT_USER_REASON.BULLYING, sails.config.constants.REPORT_USER_REASON.OTHER
            ],
            required: true
        },

        reportedNotes: {
            type: 'string'
        },

        reporterUser: {
            model: 'user',
            required: true
        },

        reportedUser: {
            model: 'user',
            required: true
        }

    }
};