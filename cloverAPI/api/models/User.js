/**
* User.js
*
* @class User
* @description Model that represents a User
* @property {string}  			fbId		- Is the user's id in Facebook system . Used to identify users in our system
* @property {string}  			fbToken		- Token provided by Facebook. Used to ensure authentication. All requests should provide it later
* @property {string}  			firstName	- User's first name
* @property {string}  			lastName	- User's last name
* @property {string}			email		- User's email (optional)
* @property {string}  			age			- User's age
* @property {string}  			gender 		- ["male","female"]
* @property {boolean}			blocked		- Indicates whether a user is blocked or not
* @property {string}			activeFrom	- A datetime indicating the time that the user was created
* @property {string}			aboutMe		- User's 'about me' text
* @property {User[]}			fbFriends 	- User's facebook friends who are registered for the app
* @property {Activity[]}		activities 	- Activities created by this user
* @property {Request[]}			requests	- Requests made by this user
* @property {string[]}			pictures 	- Pictures links of the user profile. Picure links must be from some facebook album from the user fb account.
* @property {string}			deviceToken - iOS device token used for push notifications

* @property {integer}			default_limit_search_results
* @property {string}			default_activities_created_by
* @property {integer}	        default_activities_age_from
* @property {integer}			default_activities_age_to
*/

module.exports = {

    attributes: {
        fbId: {
            unique: true,
            required: true,
            type: 'string'
        },
        fbToken: {
            required: true,
            type: 'string'
        },
        firstName: {
            required: true,
            type: 'string'
        },
        lastName: {
            required: true,
            type: 'string',
        },
        email: {
            type: 'string'
        },
        age: {
            required: true,
            type: 'integer',
        },
        gender: {
            required: true,
            type: 'string',
            enum: ['male', 'female']
        },
        blocked: {
            type: 'boolean',
            defaultsTo: false
        },
        activeFrom: {
            type: 'datetime'
        },
        aboutMe: {
            type: 'string',
            defaultsTo: ''
        },
        fbFriends: {
            collection: 'user'
        },
        activities: {
            collection: 'activity',
            via: 'creator'
        },
        profilePictureUrl: {
            type: 'string'
        },
        requests: {
            collection: 'request',
            via: 'requester'
        },
        pictures: {
            type: 'array',
            defaultsTo: []
        },
        deviceToken: {
            type: 'string',
            defaultsTo: ''
        },
        default_limit_search_results: {
            type: 'integer',
            defaultsTo: 80000
        },
        default_activities_created_by: {
            type: 'string',
            defaultsTo: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
            enum: [sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH, sails.config.constants.ACTIVITY_GENDER_FILTER.MALE, sails.config.constants.ACTIVITY_GENDER_FILTER.FEMALE]
        },
        default_activities_age_from: {
            type: 'integer',
            defaultsTo: sails.config.constants.AGE_FILTER_RANGE.MIN
        },
        default_activities_age_to: {
            type: 'integer',
            defaultsTo: sails.config.constants.AGE_FILTER_RANGE.MAX
        },
        blocked_users: {
            type: 'array',
            defaultsTo: []
        },
        activities_page: {
            type: 'integer',
            defaultsTo: 0
        },
        activities_index_in_page: {
            type: 'integer',
            defaultsTo: 0
        },
        last_get_activities_time: {
            type: 'date',
            defaultsTo: new Date()
        },
        badge_counter: {
            type: 'integer',
            defaultsTo: 0
        },
        karma_point: {
            type: 'integer',
            defaultsTo: 0
        }
    },

    beforeCreate: function(values, cb) {
        sails.log.debug("UserModel > Creating user");
        values.activeFrom = new Date();
        cb();
    },

    afterCreate: function(newlyInsertedRecord, cb) {
        sails.log.debug("UserModel > User created");
        cb();
    },

    /**
     * Increment/Decrement User Points
     * @param  {Object}   options
     *            => users {Array} list of user ids
     *            => offset number to add/subtract from the user point
     * @param  {Function} cb
     */
    updatePoint: function(options, cb) {
        var filter = {};
        filter.id = options.users;

        User.find({ id: options.users }).exec(function(err, users) {
            if (err) return cb(err);
            if (!users || !users.length) return cb(new Error('Users not found.'));

            var promises = [];

            for (var i = users.length - 1; i >= 0; i--) {
                var point = users[i].karma_point;
                if (typeof point === 'undefined' || !point) {
                    point = 0;
                }
                point += options.offset;
                if (point < 0) {
                    point = 0;
                };

                promises.push(User.update(users[i].id, { karma_point: point }));
            };

            Promise.all(promises).then(function(savedUsers) {
                sails.log.debug("Updated user points by " + options.offset);
                for (var i = savedUsers.length - 1; i >= 0; i--) {
                    sails.log.debug(savedUsers[i].id);
                };
                cb();
            });
        });
    }
};