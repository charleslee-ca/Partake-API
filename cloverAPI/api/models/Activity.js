/**
* Activity.js
*
* @class Activity
* @description Model that represents an Activity
* @property {string}  	id					- Activity's identifier
* @property {string}  	name				- Activity's name
* @property {string}  	details				- Activity's details
* @property {date}  	date				- Activity's date , should have format "yyyy-MM-dd"
* @property {string}  	fromTime			- Activity's initial time , should have format (hh:mm) or can be 'Anytime , Morning, Afternoon , Evening'
* @property {string}  	toTime 				- Activity's end time , should have format (hh:mm) or can be 'Anytime , Morning, Afternoon , Evening'
* @property {boolean}	makeAtendeeVisible	- Indicates whether the atendee is visible or not
* @property {User}		creator				- An object that represents the the User that created this Activity
* @property {Location}	location			- An object that represents the the Activity's location. This location is linked to the Activity just before creation.
* @property {string}  	type 				- Activity's type . It's an enum. Possible values : ['Sports', 'Food & Drinks','Theater','Music','Movies','Outdoors','Recreation'].

*/
module.exports = {

    types: {
        is_time: function(time) {
            if (!time) {
                time = sails.config.constants.TIME.ANYTIME; //by default time should be ANYTIME
            };
            return time == sails.config.constants.TIME.ANYTIME ||
                time == sails.config.constants.TIME.MORNING ||
                time == sails.config.constants.TIME.AFTERNOON ||
                time == sails.config.constants.TIME.EVENING || DateHelper.isValidTime(time);
        },
        is_date: function(date) {
            return DateHelper.isValidDate(date);
        }
    },
    attributes: {

        name: {
            required: true,
            type: 'string'
        },
        details: {
            required: true,
            type: 'string'
        },
        date: {
            required: true,
            type: 'date',
            is_date: true
        },
        endDate: {
            type: 'date',
            is_date: true
        },
        fromTime: {
            type: 'string',
            is_time: true,
            defaultsTo: sails.config.constants.TIME.ANYTIME
        },
        toTime: {
            type: 'string',
            is_time: true,
            defaultsTo: sails.config.constants.TIME.ANYTIME
        },
        isAtendeeVisible: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },
        creator: {
            model: 'user',
            required: true
        },
        location: {
            model: 'location',
        },
        type: {
            required: true,
            type: 'string',
            enum: ['Sports', 'Food & Drinks', 'Theater', 'Music', 'Movies', 'Outdoors', 'Recreation']
        },
        requests: {
            collection: 'request',
            via: 'activity'
        },
        visibility: {
            type: 'string',
            enum: [sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE, sails.config.constants.ACTIVITY_VISIBILITY.FRIENDS, sails.config.constants.ACTIVITY_VISIBILITY.FOF],
            required: true
        },
        gender: {
            type: 'string',
            enum: [sails.config.constants.ACTIVITY_GENDER_FILTER.MALE, sails.config.constants.ACTIVITY_GENDER_FILTER.FEMALE, sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH],
            required: true
        },
        age_filter_from: {
            type: 'integer',
            required: true
        },
        age_filter_to: {
            type: 'integer',
            required: true
        },
        deleted: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },
        likes: {
            type: 'array'
        }
    },
    /*
    	Before create the Activity we try to create a Location object based on parameter 'address'
    */
    beforeCreate: function(values, cb) {
        sails.log.debug("ActivityModel > Creating activity");
        var formattedDate = DateHelper.createUTCDate(values.date);
        values.date = formattedDate;
        GeoHelper.getAndCreateLocationForAddress(values.address, function created(location) {
            if (location) {
                sails.log.debug("ActivityModel > Asigned location " + location.id);
                values.location = location.id;
                if (values.fromTime == sails.config.constants.TIME.ANYTIME ||
                    values.fromTime == sails.config.constants.TIME.MORNING ||
                    values.fromTime == sails.config.constants.TIME.AFTERNOON ||
                    values.fromTime == sails.config.constants.TIME.EVENING) {
                    values.toTime = null;
                }
                cb();
            } else {
                cb({ error: "Invalid address" });
            }
        });
    },

    beforeUpdate: function(valuesToUpdate, cb) {
        sails.log.debug("ActivityModel > Updating activity");
        cb();
    }
};