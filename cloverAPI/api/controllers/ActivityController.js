/**

* @module Controller : ActivityController
* @description Handle Services related to Activities

*/
var _ = require('lodash');
module.exports = {

    /**
     * @description Get activities located within a predefined distance from the user with optional filters.
     * @return The activities located within a predefined distance from the user, sorted from nearest to farthest.
     */
    find: function(req, res, next) {
        sails.log.debug("-----Starting new Request of activities-----");
        console.log("find: ", req.param("lat"), ", ", req.param("lon"));
        var filter = {};

        if (!req.param("userGender") || !req.param("userAge")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error passing parameter userAge or userGender." })));
        }

        if (!req.param("fbId")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Param fbId not supplied." })));
        }

        var type_of_service = req.param("type_of_service");
        if (!type_of_service) {
            type_of_service = sails.config.constants.ACTIVITY_SERVICE_TYPE.REFRESH;
            // return(res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({summary : "Param type_of_service not supplied."})));
        }

        var loggedUserFbId = req.param("fbId");
        var userAgeInt = parseInt(req.param("userAge"));
        sails.log.debug("User Age: " + userAgeInt + " || User Gender: " + req.param("userGender"));
        filter.gender = [req.param("userGender"), sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH];

        if (userAgeInt > 0) {
            filter.age_filter_from = { '<=': userAgeInt };
            filter.age_filter_to = { '>=': userAgeInt };
        } else {
            filter.age_filter_from = sails.config.constants.AGE_FILTER_RANGE.MIN;
            filter.age_filter_to = sails.config.constants.AGE_FILTER_RANGE.MAX;
        }

        var friendsFbIds = [];
        var friendsOfFriendsIds = [];
        getUserFacebookFriends(req, res, function(friendsFbIds, friendsOfFriendsIds) {
            sails.log.debug("FbFriends: " + friendsFbIds.length + "||FbFriendsOfFriends: " + friendsOfFriendsIds.length);
            // TODO: should validate activity type
            var activityType = req.param("type");
            if (typeof activityType !== "undefined") filter.type = activityType;
            //Support several types.
            var querystring = require('querystring');
            var finish = false;
            var types = [];
            for (var i = 1; !finish; i++) {
                var typeParam = 'type' + i;
                var activityType = req.param(typeParam);
                if (typeof activityType !== "undefined") {
                    types[i - 1] = querystring.unescape(activityType);
                } else {
                    finish = true;
                }
            }
            if (types.length > 0) filter.type = types;

            var createdBy = req.param("createdBy");
            if (typeof createdBy === "undefined") createdBy = 'everyone';
            User.find({ fbId: loggedUserFbId }).exec(function(err, user) {
                if (!err && user && user.length > 0) {
                    loggedUser = user[0];
                    if (createdBy == 'everyone') {
                        console.log('everyone');
                        applyDefaultFiltersAndPaginateActivities(loggedUser, friendsFbIds, friendsOfFriendsIds, filter, null, req, res, function(activitiesToShow) {
                            return res.json(createActivityResponseWithLikes(activitiesToShow, loggedUserFbId));
                        });
                    } else {
                        var creatorFbIds = [];

                        if (createdBy == 'friends') {
                            creatorFbIds = friendsFbIds;
                        } else {
                            creatorFbIds = friendsOfFriendsIds;
                        }

                        if (creatorFbIds.length > 0) {
                            sails.log.debug("-----Querying activities from users and return a response-----");
                            User.find({ fbId: creatorFbIds }).then(function(users) {
                                var usersObjectIds = users.map(function(user) { return user.id });
                                filter.creator = usersObjectIds;
                                applyDefaultFiltersAndPaginateActivities(loggedUser, friendsFbIds, friendsOfFriendsIds, filter, null, req, res, function(activitiesToShow) {
                                    return res.json(createActivityResponseWithLikes(activitiesToShow, loggedUserFbId));
                                });
                            }).catch(function(err) {
                                console.log(err);
                                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Activities couldn't be retrieved." })));
                            })
                        } else {
                            sails.log.debug("*** No FBFriends or FoF ***");
                            return (res.json([]));
                        }
                    }
                } else {
                    sails.log.debug("Error retrieving logged user.");
                    sails.log.debug("User fbId: " + loggedUserFbId);
                    if (err) sails.log.debug("Error: " + err);

                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving logged user." })));
                }
            })
        })
    },


    /**
     * Retrieves one specific activity with populated properties.
     *
     * @description Receives the id of the request and retrieves its information in a customized json response.
     * @return The Activity in customized json response.
     */

    findOne: function(req, res, next) {
        if (!req.param("id")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "id of the activity not supplied." })));
        } else {
            var filter = {};
            filter.id = req.param("id");
            Activity.find(filter).populate('location').populate('creator').exec(function(err, activities) {
                if (!err && activities) {
                    if (activities.length == 1) {
                        return res.json(createActivityResponseWithLikes(activities[0], req.param("fbId")));
                    } else {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Multiple activities with the id supplied." })));
                    }
                } else {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                }
            })
        }
    },


    /**
     * @description Get activities filtered by their name and location city name. The service is paginated
     * @param  req Request
     * @param  res Response
     * @return The activities that their name or location city name contains the query parameter
     */
    findByQuery: function(req, res) {
        sails.log.debug("-----Starting find by query activities-----");
        console.log("findByQuery: ", req.param("lat") + ', ' + req.param("lon"));
        if (!req.param("fbId")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error passing fbId parameter." })));
        }

        var userFbId = req.param("fbId");
        var filter = {};
        filter.deleted = false;
        filter.sort = "date";
        var formattedToday = DateHelper.createUTCDate();
        filter.date = { '>=': formattedToday };

        User.find({ fbId: userFbId }).exec(function(err, user) {
            if (!err && user && user.length > 0) {
                var loggedUser = user[0];

                var userAgeInt = parseInt(loggedUser.age);
                if (userAgeInt > 0) {
                    filter.age_filter_from = { '<=': userAgeInt };
                    filter.age_filter_to = { '>=': userAgeInt };
                } else {
                    filter.age_filter_from = sails.config.constants.AGE_FILTER_RANGE.MIN;
                    filter.age_filter_to = sails.config.constants.AGE_FILTER_RANGE.MAX;
                }

                filter.gender = [loggedUser.gender, sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH];

                // Match any string if q is not a parameter
                var q = req.param('q');
                if (typeof q !== 'undefined') {
                    filter.or = [
                        { name: { contains: q } }
                    ];
                } else {
                    filter.or = [];
                }

                var locationFilter = {};
                if (typeof q !== 'undefined') {
                    locationFilter.or = [
                        { formatted_address: { contains: q } }
                    ];
                };
                Location.find(locationFilter).then(function(locations) {
                    //console.log(locations);
                    var locationsObjectIds = locations.map(function(location) { return location.id });
                    filter.or.push({ location: locationsObjectIds });
                    return Activity.find(filter).populate('creator').populate('location');

                }).then(function(activities) {
                    console.log("Name/Location Query passed: ", activities.length);
                    var friendsFbIds = [];
                    var friendsOfFriendsIds = [];
                    getUserFacebookFriends(req, res, function(friendsFbIds, friendsOfFriendsIds) {
                        // filterActivitiesByDate(activities, function(activitiesFilteredByDate){
                        // filterByDefaultPreferencesAgeRangeAndGender(activitiesFilteredByDate, res, user[0], function(activitiesFilteredByDefaultPreferences){
                        filterByVisibilityPrivacy(activities, friendsFbIds, friendsOfFriendsIds, function(activitiesPass) {
                                console.log("VisibilityPrivacy filter passed: ", activitiesPass.length);
                                filterByDistanceOnly(activitiesPass, loggedUser, req, res, function(activitiesToShow) {
                                    console.log("Distance filter passed: ", activitiesToShow.length);
                                    res.send({ activities: activitiesToShow });
                                })
                            })
                            // })
                    })
                }).catch(function(err) {
                    res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Activities couldn't be retrieved." }));
                })
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving user with fbId=" + userFbId })));
            }
        })
    },

    /**
     * @description Filter activities based on their name, location address, city or state. Return only the matched names
     * @param  req Request
     * @param  res Response
     * @return Names of the activities, locations address, city or state, that contains the query parameter
     */
    findByKeywords: function(req, res) {
        sails.log.debug("-----Starting find by keywords activities-----");
        var q = req.param('q') || '';

        if (q.length < 3) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "q parameter must have at least 3 characters." })));
        }

        var activitiesFilter = { name: { contains: q } };
        var locationFilter = { or: [{ formatted_address: { contains: q } }, { city: { contains: q } }, { state: { contains: q } }] }

        activitiesFilter.limit = 10;
        locationFilter.limit = 10;

        activitiesFilter.sort = 'name DESC';
        activitiesFilter.deleted = false;

        Location.find(locationFilter)
            .then(function(locations) {
                var activities = Activity.find(activitiesFilter).populate('creator').populate('location')
                    .then(function(activities) {
                        return activities;
                    });
                return [activities, locations];
            }).spread(function(activities, locations) {
                var activitiesProjection = activities.map(function(activity) { return activity.name });
                var locationsProjection = locations.map(function(location) {
                    if (location.city && location.city.indexOf(q) > -1) {
                        return location.city;
                    } else if (location.state && location.state.indexOf(q) > -1) {
                        return location.state;
                    } else {
                        return location.formatted_address;
                    }
                });
                res.send({ resultKeywords: activitiesProjection.concat(locationsProjection).slice(0, 10) });
            }).catch(function(err) {
                res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Keyword search could't complete. Try again." }));
            })
    },



    /**
     * @description retrieves all activities created by a user.
     * @return The list of activities created by a user.
     */
    activitiesCreatedByUser: function(req, res) {
        sails.log.debug("-----Starting getting activities created by user-----");
        var filter = {};
        filter.deleted = false;
        filter.sort = "date";
        // var formattedToday = DateHelper.createUTCDate();
        // filter.date = {'>=' : formattedToday};
        if (!req.param("creator")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error sending creator Id." })));
        } else {
            filter.creator = req.param("creator");
        }
        Activity.find(filter).populate('location').populate('creator').exec(function(err, activities) {
            if (!err && activities) {
                return (res.json(createActivityResponseWithLikes(activities, null)));
            } else {
                if (err) sails.log.debug("Error retrieving activities created by user: " + err);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving activities created by user with id = " + req.param("creator") })));
            }
        })
    },


    /**
     * @description Get attendance list from an activity.
     * @return The users that will attend to an activity.
     */

    getAttendanceList: function(req, res) {
        sails.log.debug("-----Starting get attendance list of activities-----");
        var filter = {};
        filter.deleted = false;
        filter.sort = "date";
        // var formattedToday = DateHelper.createUTCDate();
        // filter.date = {'>=' : formattedToday};
        if (!req.param("id")) {
            res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error sending activity Id." }));
        } else {
            filter.id = req.param("id");
            filter.isAtendeeVisible = true;
        }
        Activity.find(filter).populate("requests", { state: sails.config.constants.REQUEST_STATUS.ACCEPTED }).then(function(activities) {
            if (activities.length == 0) {
                sails.log.debug("Activity´s attendance list cannot be retrieved because either id of the activity is wrong or activity atendee is not visible.");
                res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Activity´s attendance list cannot be retrieved because either id of the activity is wrong or activity atendee is not visible." }));
            }
            var userIds = activities[0].requests.map(function(request) { return request.requester });
            userIds[userIds.length] = activities[0].creator;
            filter = {};
            filter.or = [{ id: userIds }];
            return User.find(filter)
        }).then(function(users) {
            res.send({ users: users });
        }).catch(function(err) {
            res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Attendance list couldn't be retrieved." }));
        })
    },


    /**
     * @description Edit an activity. Only can be edited by the creator.
     * @return The activity edited by the creator.
     */

    editActivity: function(req, res, next) {
        //If address was edited we create a new location, associate this new location to the activity and destroy the old location.
        //If address is not edited, we update actual Activity entity.
        sails.log.debug("-----Starting edit activity service-----");
        console.log("-----Starting edit activity service-----");
        var filter = {};
        var newActivityData = {};

        if (!req.body.id) {
            res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error sending activity Id." }));
        } else {
            filter.id = req.body.id;
        }

        newActivityData.date = req.body.date;
        newActivityData.endDate = req.body.endDate || req.body.date;
        newActivityData.name = req.body.name;
        newActivityData.details = req.body.details;
        newActivityData.fromTime = req.body.fromTime;
        newActivityData.toTime = req.body.toTime;
        newActivityData.type = req.body.type;
        newActivityData.isAtendeeVisible = req.body.isAtendeeVisible;
        newActivityData.visibility = req.body.visibility;
        newActivityData.gender = req.body.gender;
        newActivityData.age_filter_from = req.body.age_filter_from;
        newActivityData.age_filter_to = req.body.age_filter_to;

        try {
            if (!req.body.address_edited) {
                Activity.update(filter, newActivityData).exec(function(err, activityUpdated) {
                    if (!err && activityUpdated) {
                        Activity.find(filter).populate('creator').populate('location').exec(function(err, activityEdited) {
                            if (!err && activityEdited) {
                                return (res.json(createActivityResponseWithLikes(activityEdited.body, null)));
                            } else {
                                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                            }
                        })
                    } else {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                    }
                })

            } else {
                GeoHelper.getAndCreateLocationForAddress(req.param("address"), function created(location) {
                    newActivityData.location = location.id;
                    filter.id = req.body.location;
                    Location.destroy(filter).exec(function(err) {
                        if (!err) {
                            filter.id = req.body.id;
                            Activity.update(filter, newActivityData).exec(function(err, activityUpdated) {
                                if (!err && activityUpdated) {
                                    Activity.find(filter).populate('creator').populate('location').exec(function(err, activityEdited) {
                                        if (!err && activityEdited) {
                                            res.json(createActivityResponseWithLikes(activityEdited, null));
                                        } else {
                                            res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err }));
                                        }
                                    })
                                } else {
                                    res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err }));
                                }
                            })
                        } else {
                            res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err }));
                        }
                    })
                })
            }
        } catch (error) {
            res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: error }));
        }
    },


    /**
     * @description Deletes the selected activity.
     * @return The json structure of the deleted activity.
     */
    destroy: function(req, res) {
        sails.log.debug("-----Starting delete of an activity-----");
        sails.log.debug("req.id: " + req.body.id);
        sails.log.debug("req.requesterFbId: " + req.body.requesterFbId);
        if (!req.param("id") || !req.param("requesterFbId")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Id or requesterFbId not sent." })));
        } else {
            var activityId = req.param("id");
            var requester = req.param("requesterFbId");
        }
        var filter = {};
        filter.id = activityId;
        filter.deleted = false;
        Activity.find(filter).populate("creator").exec(function(err, activity) {
            if (!err && activity) {
                if (!activity[0].creator || activity[0].creator.fbId != requester) {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "User can not delete the activity selected because is not the creator of it." })));
                } else {
                    Activity.update(filter, { deleted: true }).exec(function(err, activity) {
                        if (!err && activity) {
                            updateUserPointsAfterDelete(activity[0], function() {
                                Activity.find({ id: activity[0].id }).populate("location").populate("creator").exec(function(err, activityToRetrieve) {
                                    if (!err && activityToRetrieve) {
                                        return (res.json(createActivityResponseWithLikes(activityToRetrieve, null)));
                                    } else {
                                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error finding deleted activity to retrieve." })));
                                    }
                                })
                            });
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error deleting activity." })));
                        }
                    })
                }
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error finding activity passed as parameter." })));
            }
        })
    },


    /**
     * @description Unlikes the selected activity.
     * @return The json structure of the unliked activity.
     */
    unlikeActivity: function(req, res) {
        sails.log.debug("-----Starting unlike of an activity-----");
        sails.log.debug("req.id: " + req.body.id);
        sails.log.debug("req.requesterFbId: " + req.body.requesterFbId);
        if (!req.param("id") || !req.param("requesterFbId")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Id or requesterFbId not sent." })));
        } else {
            var activityId = req.param("id");
            var requester = req.param("requesterFbId");
        }
        var filter = {};
        filter.id = activityId;
        filter.deleted = false;
        Activity.find(filter).populate("creator").exec(function(err, activity) {
            if (!err && activity && activity.length) {
                if (activity[0].creator && activity[0].creator.fbId == requester) {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "User can not unlike his/her own activity" })));
                } else {
                    var likes = activity[0].likes;
                    if (likes && _.indexOf(likes, requester) > -1) {
                        User.updatePoint({ users: [activity[0].creator.id], offset: -1 }, function() {
                            var filtered = _.reject(likes, function(fbId) {
                                return fbId == requester;
                            });
                            Activity.update(filter, { likes: filtered }).exec(function(err, activity) {
                                if (!err && activity) {
                                    Activity.find({ id: activity[0].id }).populate("location").populate("creator").exec(function(err, activityToRetrieve) {
                                        if (!err && activityToRetrieve) {
                                            return (res.json(createActivityResponseWithLikes(activityToRetrieve, requester)));
                                        } else {
                                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error finding unliked activity to return." })));
                                        }
                                    })
                                } else {
                                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error unliking activity." })));
                                }
                            })
                        });
                    } else {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "User didn't like the activity" })));
                    }
                }
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error finding activity passed as parameter." })));
            }
        })
    },


    /**
     * @description Likes the selected activity.
     * @return The json structure of the liked activity.
     */
    likeActivity: function(req, res) {
        sails.log.debug("-----Starting like of an activity-----");
        sails.log.debug("req.id: " + req.body.id);
        sails.log.debug("req.requesterFbId: " + req.body.requesterFbId);
        if (!req.param("id") || !req.param("requesterFbId")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Id or requesterFbId not sent." })));
        } else {
            var activityId = req.param("id");
            var requester = req.param("requesterFbId");
        }
        var filter = {};
        filter.id = activityId;
        filter.deleted = false;
        Activity.find(filter).populate("creator").exec(function(err, activity) {
            if (!err && activity && activity.length) {
                if (activity[0].creator && activity[0].creator.fbId == requester) {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "User can not like his/her own activity." })));
                } else {
                    var likes = activity[0].likes;
                    if (typeof likes == 'undefined' || likes == null) {
                        likes = [];
                    }
                    if (_.indexOf(likes, requester) > -1) {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "User already liked the activity" })));
                    } else {
                        User.updatePoint({ users: [activity[0].creator.id], offset: 1 }, function() {
                            likes[likes.length] = requester;
                            Activity.update(filter, { likes: likes }).exec(function(err, activity) {
                                if (!err && activity) {
                                    Activity.find({ id: activity[0].id }).populate("location").populate("creator").exec(function(err, activityToRetrieve) {
                                        if (!err && activityToRetrieve) {
                                            return (res.json(createActivityResponseWithLikes(activityToRetrieve, requester)));
                                        } else {
                                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error finding liked activity to retrieve." })));
                                        }
                                    })
                                } else {
                                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error liking activity." })));
                                }
                            })
                        });
                    }
                }
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error finding activity passed as parameter." })));
            }
        })
    },


    /**
     * @description Creates an activity.
     * @return The json structure of the created activity.
     */
    create: function(req, res) {
        sails.log.debug("-----Starting creating activity service-----");
        console.log("-----Starting creating activity service-----");
        var toTime;
        sails.log.debug("---Start creating activity---");
        if (req.body.fromTime == sails.config.constants.TIME.ANYTIME ||
            req.body.fromTime == sails.config.constants.TIME.MORNING ||
            req.body.fromTime == sails.config.constants.TIME.AFTERNOON ||
            req.body.fromTime == sails.config.constants.TIME.EVENING) {
            toTime = null;
        } else {
            if (!req.body.toTime) {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Missing toTime parameter." })));
            } else {
                toTime = req.body.toTime;
            }
        }

        var newActivityData = {
            creator: req.body.creator,
            date: req.body.date,
            endDate: req.body.endDate || req.body.date,
            name: req.body.name,
            details: req.body.details,
            type: req.body.type,
            fromTime: req.body.fromTime,
            toTime: toTime,
            address: req.body.address,
            visibility: req.body.visibility,
            gender: req.body.gender,
            age_filter_from: req.body.age_filter_from,
            age_filter_to: req.body.age_filter_to,
            isAtendeeVisible: req.body.isAtendeeVisible,
        };

        sails.log.debug("Create activity");

        User.find({ id: req.body.creator }).exec(function(err, user) {
            if (!err && user && user.length == 1) {
                Activity.create(newActivityData).exec(function(err, activityCreated) {
                    sails.log.debug("Activity created.");
                    if (!err && activityCreated) {
                        sails.log.debug("Activity created correctly.");
                        updateUserPointsAfterCreate(activityCreated, function() {
                            Activity.find({ id: activityCreated.id }).populate("location").populate("creator").exec(function(err, finalActivityResponse) {
                                if (!err && finalActivityResponse) {
                                    res.status(201);
                                    return (res.json(createActivityResponseWithLikes(finalActivityResponse[0], null)));
                                } else {
                                    sails.log.debug("Created Activity retrieved wrong.");
                                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error creating activity. Error description: " + err })));
                                }
                            })
                        });
                    } else {
                        sails.log.debug("Activity created wrong.");
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error creating activity. Error description: " + err })));
                    }
                })
            } else {
                sails.log.debug("Activity creator does not exists.");
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error creating activity. Activity creator does not exists" })));
            }
        })
    }

};

function updateUserPointsAfterCreate(activity, cb) {
    Activity.find({ creator: activity.creator }).exec(function(err, activities) {
        var points = 0;
        if (err || !activities) {
            points = 4;
        } else {
            if (activities.length == 1) {
                points = 12;
            } else {
                points = 4;
            }
        }
        User.updatePoint({ users: [activity.creator], offset: points }, cb);
    });
}


function updateUserPointsAfterDelete(activity, cb) {
    var actualDate = DateHelper.createUTCDate();
    var activityDate = new Date(activity.date);
    var activityEndDate = activity.endDate ? new Date(activity.endDate) : null;
    if ((activityEndDate || activityDate) >= actualDate) {
        var points = _.size(activity.likes);
        var creator = activity.creator;

        console.log("activity likes " + points);
        console.log("creator " + creator);

        var filter = {};
        filter.creator = activity.creator;

        Activity.find({ where: { creator: activity.creator }, sort: 'createdAt ASC' }).then(function(userActivities) {
            if (userActivities && userActivities.length > 0) {
                if (activity.id == userActivities[0].id) {
                    points += 12;
                } else {
                    points += 4;
                }
            } else {
                points += 4;
            }
            console.log("Points activity " + points);
            return Request.find({ activity: activity.id });
        }).then(function(requests) {
            _.each(requests, function(request) {
                if (request.state == sails.config.constants.REQUEST_STATUS.PENDING) {
                    points += 1;
                } else if (request.state == sails.config.constants.REQUEST_STATUS.ACCEPTED) {
                    points += 3;
                };
            });
            console.log("Points request " + points);
            User.updatePoint({ users: [creator], offset: -points }, cb);
        }).catch(function(err) {
            console.log(err);
            console.log("Points error " + points);
            console.log("creator " + creator);

            if (creator && points) {
                User.updatePoint({ users: [creator], offset: -points }, cb);
            } else {
                cb();
            }
        });
    } else {
        cb();
    }
}

function createActivityResponseWithLikes(activity, fbId) {
    var processActivity = function(row) {
        var likes = row.likes;
        if (!likes) {
            likes = [];
        }
        row.likes = likes.length;
        row.liked = _.indexOf(likes, fbId) > -1;
    }
    if (_.isArray(activity)) {
        _.each(activity, processActivity);
    } else {
        processActivity(activity);
    }
    return activity;
}

/**
 * @description Given an array of user facebook ids, return a JSON response with the activities that where created by those users
 * @return A JSON response with the described activities or a JSON error
 */
function queryActivitiesFromUsersAndReturnAResponse(req, res, next, pageInDB, activityIndexInPage, filter, loggedUserFbId, friendsFbIds, friendsOfFriendsIds) {
    sails.log.debug("-----Querying activities from users and return a response-----");
    User.find({ fbId: friendsFbIds })
        .then(function(users) {
            var usersObjectIds = users.map(function(user) { return user.id });
            filter.creator = usersObjectIds;
            var activitiesFound = false;
            var activitiesAlreadyFilteredToShow = [];
            paginateActivities(loggedUserFbId, friendsFbIds, friendsOfFriendsIds, activitiesAlreadyFilteredToShow, activitiesFound, filter, pageInDB, activityIndexInPage, req, res, function(activitiesToShow) {
                return (res.json(createActivityResponseWithLikes(activitiesToShow, loggedUserFbId)));
            })
        }).catch(function(err) {
            console.log(err);
            res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Activities couldn't be retrieved." }));
        })
}

/**
 * @description Return the filtered activities by distance and dates
 * @return A JSON response with the described activities or a JSON error
 */
function tryFilterByDistance(activities, req, res, cb) {
    try {
        sails.log.debug("Starting filtering by distance.");
        filterByDistance(activities, req, res, function(activitiesToShow) {
            for (var i = 0; i < activitiesToShow.length - 1; i++) {
                for (var j = i + 1; j < activitiesToShow.length; j++) {
                    var distanceI = JSON.parse(activitiesToShow[i]["distance"]);
                    var distanceJ = JSON.parse(activitiesToShow[j]["distance"]);
                    if (distanceJ < distanceI) {
                        var aux = activitiesToShow[i];
                        activitiesToShow[i] = activitiesToShow[j];
                        activitiesToShow[j] = aux;
                    }
                }
            }
            return cb(activitiesToShow);
        })
    } catch (errorFilterByDistance) {
        sails.log.debug("Error trying to find activities: " + errorFilterByDistance);
        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: errorFilterByDistance })));
    }
}

/**
 * @description Filter activities by distance and by the filters passed as parameters. <br>
 *       Filter by dayStart and dayEnd if supplied.
 * @return The activities located within a predefined distance from the user filtered by filters selected.
 */
function filterByDistance(activities, req, res, cb) {
    var dayStart = req.param("dayStart");
    var dayEnd = req.param("dayEnd");
    var existsDateFilter = false;
    try {
        if (typeof req.param("lat") == "undefined" || typeof req.param("lon") == "undefined") {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: 'Must have location parameters in the request.' })));
        }
        existsDateFilter = true;
        filterActivitiesByNumberOfDays(activities, dayStart, dayEnd, function(correctDays, activitiesFilteredByDate) {
            if (correctDays) {
                var activitiesToShow = [];
                if (existsDateFilter) {
                    activities = [];
                    activities = activitiesFilteredByDate;
                }
                if (!req.param("fbId")) {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Param fbId not supplied." })));
                }
                var fbId = req.param("fbId");
                sails.log.debug("fbId: " + fbId);
                sails.log.debug("User coordinates: " + "==>Lat: " + req.param("lat") + " ==>Long: " + req.param("lon"));
                User.find({ fbId: fbId }).exec(function(err, user) {
                    if (!err && user) {
                        if (user.length == 1) {
                            sails.log.debug("User found: start filtering " + activities.length + " activities.");
                            filterByDefaultPreferencesAgeRangeAndGender(activities, res, user[0], function(activities) {
                                for (var i = 0; i < activities.length; i++) {
                                    var latLocAct = JSON.parse(activities[i]["location"]["lat"]);
                                    var lonLocAct = JSON.parse(activities[i]["location"]["lon"]);
                                    var jsonCoordinatesActivityLocation = JSON.parse('{"latitude" :' + latLocAct + ', "longitude" :' + lonLocAct + '}');
                                    var jsonCoordinatesUserLocation = JSON.parse('{"latitude" :' + req.param("lat") + ', "longitude" :' + req.param("lon") + '}');
                                    GeoHelper.calculateDistanceBetweenCoordinates(jsonCoordinatesUserLocation, jsonCoordinatesActivityLocation, function(distance) {
                                        // console.log('distance between user location: ' + jsonCoordinatesUserLocation + ' and activity location: ' + jsonCoordinatesActivityLocation + ' is ' + distance);
                                        if (distance <= user[0].default_limit_search_results) {
                                            activities[i].distance = distance;
                                            activitiesToShow[activitiesToShow.length] = activities[i];
                                        }
                                    });
                                }
                                sails.log.debug('################ of activities after filter by distance: ' + activitiesToShow.length);
                                return (cb(activitiesToShow));
                            })
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "No user found with the fbId provided" })));
                        }
                    } else {
                        if (err) sails.log.debug("Error retrieving user: " + err);
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving user: " + err })));
                    }
                })
            } else {
                sails.log.debug("Filter Dates Errors. dayEnd < dayStart.");
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: 'Filter Dates Errors. dayEnd < dayStart.' })));
            }
        })
    } catch (err) {
        sails.log.debug("Error filtering by distance: " + err);
        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
    }
}



/**
 * @description Filter activities by distance and by the filters passed as parameters. <br>
 *       Filter by dayStart and dayEnd if supplied.
 * @return The activities located within a predefined distance from the user filtered by filters selected.
 */
function filterByDistanceOnly(activities, user, req, res, cb) {
    try {
        if (typeof req.param("lat") == "undefined" || typeof req.param("lon") == "undefined") {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: 'Must have location parameters in the request.' })));
        }

        var activitiesToShow = [];
        for (var i = 0; i < activities.length; i++) {
            var latLocAct = JSON.parse(activities[i]["location"]["lat"]);
            var lonLocAct = JSON.parse(activities[i]["location"]["lon"]);
            //console.log('lat: ', latLocAct);
            //console.log('lon: ', lonLocAct);
            var jsonCoordinatesActivityLocation = JSON.parse('{"latitude" :' + latLocAct + ', "longitude" :' + lonLocAct + '}');
            var jsonCoordinatesUserLocation = JSON.parse('{"latitude" :' + req.param("lat") + ', "longitude" :' + req.param("lon") + '}');
            GeoHelper.calculateDistanceBetweenCoordinates(jsonCoordinatesUserLocation, jsonCoordinatesActivityLocation, function(distance) {

                if (distance <= user.default_limit_search_results) {
                    console.log('distance = ', distance);
                    console.log('limit = ', user.default_limit_search_results);
                    activities[i].distance = distance;
                    activitiesToShow[activitiesToShow.length] = activities[i];
                }
            });
        }

        return (cb(activitiesToShow));

    } catch (err) {
        sails.log.debug("Error filtering by distance: " + err);
        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
    }
}



/**
 * @description Filter activities by number of days (from and to) when the activity takes place.
 * @return The activities sorted filtered by number of days.
 */
function filterActivitiesByNumberOfDays(activities, dayStart, dayEnd, cb) {
    if (typeof dayStart != "undefined" && typeof dayEnd != "undefined") {
        var correctDays = false;
        var activitiesFilteredByDate = [];
        if (parseInt(dayEnd) >= parseInt(dayStart)) {
            correctDays = true;
            var startDate = DateHelper.createUTCDate();
            startDate.setDate(startDate.getDate() + parseInt(dayStart));

            var endDate = DateHelper.createUTCDate();
            endDate.setDate(endDate.getDate() + parseInt(dayEnd) + 1);
            sails.log.debug("Start date :" + startDate + " End Date : " + endDate);
            console.log("Start date :" + startDate + " End Date : " + endDate);
            for (var i = 0; i < activities.length; i++) {
                var activityDate = activities[i]["date"];
                if (activityDate >= startDate && activityDate < endDate) {
                    activitiesFilteredByDate[activitiesFilteredByDate.length] = activities[i];
                }
            }
        }
        return (cb(activitiesFilteredByDate));
    } else {
        return (cb(activities));
    }
}



/**
 * @description Sort Activities by date.
 * @return The activities sorted by date. The first ones are the closest in time.
 */
function sortAndGroupByDate(activities, req, res, cb) {
    for (var i = 0; i < activities.length - 1; i++) {
        for (var j = i + 1; j < activities.length; j++) {
            var dateI = new Date(activities[i]["date"]);
            var dateJ = new Date(activities[j]["date"]);
            if (dateJ < dateI) {
                var aux = activities[i];
                activities[i] = activities[j];
                activities[j] = aux;
            }
        }
    }
    return cb(activities);
}

/**
 * @description Filter the activities by user default preferences: created by and age range.
 * @return The activities filtered that matches user default preferences.
 */
function filterByDefaultPreferencesAgeRangeAndGender(activities, res, user, cb) {
    var activitiesFiltered = [];
    var default_created_by_filter = user.default_activities_created_by;
    var default_age_from_filter = user.default_activities_age_from;
    var default_age_to_filter = user.default_activities_age_to;

    if (typeof default_created_by_filter != "undefined" && typeof default_age_from_filter != "undefined" && typeof default_age_to_filter != "undefined") {
        for (var i = 0; i < activities.length; i++) {
            if (default_created_by_filter == sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH ||
                (typeof activities[i].creator != 'undefined' && activities[i].creator.gender == default_created_by_filter)) {
                // if default age range filter is set to min-max, then simply don't apply filter
                if (default_age_from_filter == sails.config.constants.AGE_FILTER_RANGE.MIN && default_age_to_filter == sails.config.constants.AGE_FILTER_RANGE.MAX) {
                    activitiesFiltered[activitiesFiltered.length] = activities[i];
                } else {
                    if (typeof activities[i].creator !== 'undefined') {
                        var creatorAge = parseInt(activities[i].creator.age);
                        if (default_age_from_filter <= creatorAge && default_age_to_filter >= creatorAge) {
                            activitiesFiltered[activitiesFiltered.length] = activities[i];
                        }
                    }
                }
            }
        }
        return cb(activitiesFiltered);
    } else {
        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Invalid default parameters." })));
    }
}

/**
 * @description Filter the activities by date. Activities with date >= actual date are retrieved.
 * @return The activities with date >= actual date.
 */
function filterActivitiesByDate(activities, cb) {
    var activitiesToShow = [];
    var actualDate = DateHelper.createUTCDate();
    for (var i = 0; i < activities.length; i++) {
        var activityDate = new Date(activities[i].date);
        if (activityDate >= actualDate) {
            activitiesToShow[activitiesToShow.length] = activities[i];
        }
    }
    return (cb(activitiesToShow));
}

/**
 * @description Get all ids from user Facebook´s friends and user Facebook´s friends of friends.
 * @return Two arrays with ids of user Facebook´s friends and user Facebook´s friends of friends.
 */
function getUserFacebookFriends(req, res, cb) {
    var fbToken = req.headers.fbtoken;
    var graphUrl = sails.config.constants.URLS.FACEBOOK_GRAPH_API;
    var options = {
            url: graphUrl + '/me/friends',
            qs: { access_token: fbToken }
        }
        // Ask for my friends
    var friendsFbIds = [];
    var friendsOfFriendsIds = [];
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            var friendsFbIds = json.data.map(function(user) { return user.id });

            User.find({ fbId: friendsFbIds }).exec(function(err, users) {
                if (!err && users) {
                    usersMap = _.mapKeys(users, function(user) {
                        return user.fbId;
                    });

                    // Friends of my friends
                    async.map(friendsFbIds, function(fbId, callback) {
                        var friend = usersMap[fbId];
                        if (friend) {
                            options.url = graphUrl + '/' + fbId + '/friends';
                            options.qs = { access_token: friend.fbToken };
                            request(options, function(error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    var json = JSON.parse(body);
                                    var userIds = json.data.map(function(user) { return user.id })
                                    callback(error, userIds);
                                } else {
                                    callback(error, null);
                                }
                            })
                        } else {
                            callback(null, null);
                        };
                    }, function(err, results) {
                        for (var i = 0; i < results.length; i++) {
                            if (results[i] !== null && results[i]) friendsOfFriendsIds = friendsOfFriendsIds.concat(results[i]);
                        }

                        return (cb(friendsFbIds, _.filter(friendsOfFriendsIds, function(FoFId) {
                            return (friendsFbIds.indexOf(FoFId) == -1) && req.param("fbId") != FoFId;
                        })));
                    })
                } else {
                    return (cb(friendsFbIds, friendsOfFriendsIds));
                };
            });

        } else {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving user´s facebook friends. Possible Facebook´s token invalid." })));
        }
    });
}


/**
 * @description Filter activities by its privacy related to its visibility.
 * @return An array with the activities that validate privacy activity visibility.
 */
function filterByVisibilityPrivacy(activities, friendsFbIds, friendsOfFriendsIds, cb) {
    var activitiesToShow = [];

    for (var i = 0; i < activities.length; i++) {
        if (activities[i].visibility == sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE) {
            activitiesToShow[activitiesToShow.length] = activities[i];
        } else if (activities[i].visibility == sails.config.constants.ACTIVITY_VISIBILITY.FRIENDS) {
            if (friendsFbIds.indexOf(activities[i].creator.fbId) > -1) {
                activitiesToShow[activitiesToShow.length] = activities[i];
            }
        } else {
            if (friendsOfFriendsIds.indexOf(activities[i].creator.fbId) > -1) {
                activitiesToShow[activitiesToShow.length] = activities[i];
            }
        }
    }
    return (cb(activitiesToShow));
}



/**
 * @description Filter activities by blocked users. An activity with a creator that has blocked the logged user won´t be added to the list
 *              of activities that the logged user can see.
 * @return An array with the activities with creators that haven´t blocked the logged user.
 */
function filterByBlockedUsers(activities, loggedUserFbId, res, cb) {
    var activitiesToShow = [];
    User.find({ fbId: loggedUserFbId }).exec(function(err, user) {
        if (!err && user) {
            var loggedUserBlockedUsers = user[0].blocked_users;
            for (var i = 0; i < activities.length; i++) {
                var userIsBlocked = false;
                if (!activities[i].creator) {
                    sails.log.debug("Creator does not exist. ActivityId : " + activities[i].id);
                } else {
                    // check if activity owner has blocked current user
                    for (var j = 0;
                        (j < activities[i].creator.blocked_users.length && !userIsBlocked); j++) {
                        if (activities[i].creator.blocked_users[j] == loggedUserFbId) {
                            userIsBlocked = true;
                        }
                    }

                    // check if current user has blocked activity owner
                    if (!userIsBlocked) {
                        for (var j = 0;
                            (j < loggedUserBlockedUsers.length && !userIsBlocked); j++) {
                            if (loggedUserBlockedUsers[j] == activities[i].creator.fbId) {
                                userIsBlocked = true;
                            }
                        }
                    }
                }
                if (!userIsBlocked) {
                    activitiesToShow.push(activities[i]);
                }
            }
            return cb(activitiesToShow);
        }
    })
}


/**
 * @description Filter activities by blocked users. An activity with a creator that has blocked the logged user won´t be added to the list
 *              of activities that the logged user can see.
 * @return An array with the activities with creators that haven´t blocked the logged user.
 */
function filterByBlockedUsersNoFbId(activities, loggedUser, res, cb) {
    var activitiesToShow = [];

    var loggedUserBlockedUsers = loggedUser.blocked_users;
    for (var i = 0; i < activities.length; i++) {
        var userIsBlocked = false;
        if (!activities[i].creator) {
            sails.log.debug("Creator does not exist. ActivityId : " + activities[i].id);
        } else {
            // check if activity owner has blocked current user
            for (var j = 0;
                (j < activities[i].creator.blocked_users.length && !userIsBlocked); j++) {
                if (activities[i].creator.blocked_users[j] == loggedUser.fbId) {
                    userIsBlocked = true;
                }
            }

            // check if current user has blocked activity owner
            if (!userIsBlocked) {
                for (var j = 0;
                    (j < loggedUserBlockedUsers.length && !userIsBlocked); j++) {
                    if (loggedUserBlockedUsers[j] == activities[i].creator.fbId) {
                        userIsBlocked = true;
                    }
                }
            }
        }
        if (!userIsBlocked) {
            activitiesToShow.push(activities[i]);
        }
    }

    return cb(activitiesToShow);
}



/**
 @description Paginates activities to retrieve a constant number of valid activities for the logged user.
    Applies default filters:
      - User default preference age range : check against activity creator's age
      - User default preference gender    : check against activity creator's gender
      - User default preference distance  : check if the activity is taking place nearby the current user
      - Activity's Viewable by            : check if current user meets the criteria (everyone, FF, FoF)
      - Blocked                           : check if current user blocked the activity creator or vice versa
 @param loggedUser The current user.
 @param friendsFbIds The user´s friends facebook id´s.
 @param friendsOfFriendsIds The user´s friends of friends facebook id´s.
 @param filter The filter for query activities from the database.
 @param lastActivityDate The date of the last valid activity. might be used for pagination.
 @return An array with activities.
*/
function applyDefaultFiltersAndPaginateActivities(loggedUser, friendsFbIds, friendsOfFriendsIds, filter, lastActivityDate, req, res, cb) {
    filter.deleted = false;
    filter.sort = "date";
    if (lastActivityDate != null) {
        filter.date = { '>=': lastActivityDate };
    } else {
        filter.or = [
            { date: { '>=': DateHelper.createUTCDate() } },
            { endDate: { '>=': DateHelper.createUTCDate() } }
        ];
    };
    Activity.find(filter).populate('location').populate('creator').exec(function(err, activities) {
        if (!err && activities) {
            if (activities.length > 0) {
                sails.log.debug(">>>>Start Filtering Activities : " + activities.length);
                console.log(">>>>Start Filtering Activities : " + activities.length);
                filterActivitiesByNumberOfDays(activities, req.param("dayStart"), req.param("dayEnd"), function(activitiesPass1) {
                    sails.log.debug(">>>>Activities passed 1 : Number of Days : " + activitiesPass1.length);
                    console.log(">>>>Activities passed 1 : Number of Days : " + activitiesPass1.length);
                    filterByDefaultPreferencesAgeRangeAndGender(activitiesPass1, res, loggedUser, function(activitiesPass2) {
                        sails.log.debug(">>>>Activities passed 2 : Default Preferences : " + activitiesPass2.length);
                        console.log(">>>>Activities passed 2 : Default Preferences : " + activitiesPass2.length);
                        filterByDistanceOnly(activitiesPass2, loggedUser, req, res, function(activitiesPass3) {
                            sails.log.debug(">>>>Activities passed 3 : Distance : " + activitiesPass3.length);
                            console.log(">>>>Activities passed 3 : Distance : " + activitiesPass3.length);
                            filterByVisibilityPrivacy(activitiesPass3, friendsFbIds, friendsOfFriendsIds, function(activitiesPass4) {
                                sails.log.debug(">>>>Activities passed 4 : Visibility privacy : " + activitiesPass4.length);
                                console.log(">>>>Activities passed 4 : Visibility privacy : " + activitiesPass4.length);
                                filterByBlockedUsersNoFbId(activitiesPass4, loggedUser, res, function(activitiesToShow) {
                                    sails.log.debug(">>>>Activities found : " + activitiesToShow.length);
                                    sails.log.debug("-----Finishing new Request of activities-----");
                                    console.log(">>>>Activities found : " + activitiesToShow.length);
                                    if (activitiesToShow.length == 0) {
                                        res.status(201);
                                    };
                                    return (cb(activitiesToShow));
                                });
                            });
                        });
                    });
                });
            } else {
                //No activities found.
                sails.log.debug("No activities found.");
                sails.log.debug("-----Finishing new Request of activities-----");
                res.status(201);
                return (cb(activities));
            }
        } else {
            if (err) sails.log.debug("Error retrieving activities to paginate: " + err);
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving activities to paginate." })));
        }
    })
}



/**
 @description Paginates activities to retrieve a constant number of valid activities for the logged user.
 @param pageInDB The page where to retrieve activities in the DB.
 @param loggedUserFbId The user facebook id of the logged user.
 @param friendsFbIds The user´s friends facebook id´s.
 @param friendsOfFriendsIds The user´s friends of friends facebook id´s.
 @param activitiesAlreadyFilteredToShow The activities that are already filtered and ready to be shown.
 @param activitiesFound True if required activities are found. Else false.
 @param filter The filter for query activities from the database.
 @param pageInDB The page of the database from where we want to retrieve activities.
 @param lastActivityIndex The index of the last valid activity.
 @return An array with activities.
*/
function paginateActivities(loggedUserFbId, friendsFbIds, friendsOfFriendsIds, activitiesAlreadyFilteredToShow, activitiesFound, filter, pageInDB, lastActivityIndex, req, res, cb) {
    if (!activitiesFound) {
        var limitSearch = 100;
        Activity.find(filter).populate('location').populate('creator').paginate({ page: pageInDB, limit: limitSearch }).exec(function(err, activities) {
            if (!err && activities) {
                if (activities.length > 0) {
                    var activitiesNotFilteredYet = [];
                    for (var i = lastActivityIndex; i < activities.length; i++) {
                        activitiesNotFilteredYet.push(activities[i]);
                    }
                    filterActivitiesByDate(activitiesNotFilteredYet, function(validActivities) {
                        filterByVisibilityPrivacy(validActivities, friendsFbIds, friendsOfFriendsIds, function(activitiesToFilterByBlockedUsers) {
                            filterByBlockedUsers(activitiesToFilterByBlockedUsers, loggedUserFbId, res, function(activitiesToFilterByDistance) {
                                tryFilterByDistance(activitiesToFilterByDistance, req, res, function(activitiesFilteredByDistance) {
                                    while (activitiesFilteredByDistance.length > 0) {
                                        activitiesAlreadyFilteredToShow.push(activitiesFilteredByDistance.pop());
                                    }
                                    checkForActivitiesToShowInPagination(activities, activitiesAlreadyFilteredToShow, activitiesFound, pageInDB, res, function(activitiesToShow, activitiesFound, lastActivityIndex, pageInDB) {
                                        checkIfPaginationIsCompleted(limitSearch, activities, activitiesToShow, activitiesFound, lastActivityIndex, pageInDB, req, res, function(completed, activitiesGrouped, lastActivityIndex, pageInDB) {
                                            if (completed) {
                                                sails.log.debug("Activities found: " + activitiesGrouped.length);
                                                sails.log.debug("-----Finishing new Request of activities-----");
                                                //Finish recursion.
                                                return (cb(activitiesGrouped));
                                            } else {
                                                //Less than 20 activities found. Continue searching activities.
                                                //Continue recursion.
                                                return (paginateActivities(loggedUserFbId, friendsFbIds, friendsOfFriendsIds, activitiesGrouped, completed, filter, pageInDB, lastActivityIndex, req, res, cb));
                                            }
                                        })
                                    })
                                })
                            })
                        })
                    })
                } else {
                    //No more activities to search. Finish recursion.
                    activitiesFound = true;
                    checkIfPaginationIsCompleted(limitSearch, activities, activitiesAlreadyFilteredToShow, activitiesFound, lastActivityIndex, pageInDB, req, res, function(completed, activitiesGrouped, lastActivityIndex, pageInDB) {
                        sails.log.debug("Activities found: " + activitiesGrouped.length);
                        sails.log.debug("-----Finishing new Request of activities-----");
                        return (cb(activitiesGrouped));
                    })
                }
            } else {
                if (err) sails.log.debug("Error retrieving activities to paginate: " + err);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving activities to paginate." })));
            }
        })
    } else {
        //Finish recursion.
        return (cb(activitiesAlreadyFilteredToShow));
    }
}




/**
 @description Checks and creates the pagination of activities to show.
 @param activities Array with all activities in the page to search for the index of the last valid activity to show.
 @param activitiesAlreadyFilteredToShow The activities that are ready to be shown to the user.
 @param activitiesFound True if pagination is finished, else false.
 @param pageInDB The page where to retrieve activities in the DB.
*/
function checkForActivitiesToShowInPagination(activities, activitiesAlreadyFilteredToShow, activitiesFound, pageInDB, res, cb) {
    var searchIndex = false;
    if (activitiesAlreadyFilteredToShow.length > 20) {
        while (activitiesAlreadyFilteredToShow.length > 20) {
            activitiesAlreadyFilteredToShow.pop();
        }
        activitiesFound = true;
        searchIndex = true;
    } else if (activitiesAlreadyFilteredToShow.length < 20) {
        lastActivityIndex = 0;
        pageInDB++;
    } else { //activitiesAlreadyFilteredToShow.length == 20
        activitiesFound = true;
    }
    if (searchIndex) {
        var lastActivityIndex = 0;
        //Search for lastActivityId index in the page activities array.
        var indexFound = false;
        for (var h = 0;
            (h < activities.length && !indexFound); h++) {
            if (activities[h].id == activitiesAlreadyFilteredToShow[activitiesAlreadyFilteredToShow.length - 1].id) {
                indexFound = true;
                if (h == activitiesAlreadyFilteredToShow.length - 1) {
                    //Completed all page.
                    pageInDB++;
                    lastActivityIndex = 0;
                } else {
                    lastActivityIndex = h;
                }
            }
        }
    }
    return (cb(activitiesAlreadyFilteredToShow, activitiesFound, lastActivityIndex, pageInDB));
}


/**
 @description Checks if pagination is completed. If is completed updates user´s pagination data and orders activities by date. Else continue pagination.
 @param activitiesToShow Array with all activities in the page to search for the index of the last valid activity to show.
 @param activitiesFound True if pagination is finished, else false.
 @param lastActivityIndex The index of the last valid activity in the page in the db.
 @param pageInDB The page where to retrieve activities in the DB.
*/
function checkIfPaginationIsCompleted(limitSearch, activities, activitiesToShow, activitiesFound, lastActivityIndex, pageInDB, req, res, cb) {
    var completed = false;
    if (activitiesFound || (activities.length < limitSearch)) {
        var newUserData = {
            activities_page: pageInDB,
            activities_index_in_page: lastActivityIndex,
            last_get_activities_time: new Date()
        }
        var userFbId = req.param("fbId");
        User.update({ fbId: userFbId }, newUserData).exec(function(err, userUpdated) {
            if (!err && userUpdated) {
                sortAndGroupByDate(activitiesToShow, req, res, function(activitiesGrouped) {
                    completed = true;
                    return (cb(completed, activitiesGrouped, lastActivityIndex, pageInDB));
                })
            } else {
                if (err) sails.log.debug("Error updating user´s pagination values: " + err);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error updating user´s pagination values." })));
            }
        })
    } else {
        return (cb(completed, activitiesToShow, lastActivityIndex, pageInDB));
    }
}