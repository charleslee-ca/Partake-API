var blueprintCreate = require("../../node_modules/sails/lib/hooks/blueprints/actions/create");
var blueprintUpdate = require("../../node_modules/sails/lib/hooks/blueprints/actions/update");
var crypto = require('crypto');
var request = require('request');

var rp = require('request-promise');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

/**

* @module Controller : UserController
* @description Handle Services related to Users

*/

module.exports = {
    /**
     * @description Works as login/update and as register  <br>
     *<ul>
     * <li> If a user with provided 'fbId' exists it will work as login and update the user with the data provided </li>
     * <li> If a user with provided 'fbId' doesn't exists, that user will be created </li>
     *</ul>
     * @return A json structure representing the created/logged user
     */
    login: function(req, res) {

        var params = req.body ? req.body : {};

        if (!params.fbId) {
            return res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "Missing fbId parameter" }));
        };

        if (!params.fbToken) {
            return res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "Missing fbToken parameter" }));
        };

        var facebookUrl = sails.config.constants.URLS.FACEBOOK_API;

        var options = {
            url: facebookUrl + '/debug_token',
            qs: {
                input_token: params.fbToken,
                access_token: sails.config.facebook.appId + '|' + sails.config.facebook.appSecret
            }
        };

        // Validate the fbToken. http://stackoverflow.com/a/16092226/1340460
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200 && JSON.parse(body).data.is_valid) {
                User.findOneByFbId(params.fbId).exec(function(err, user) {
                    if (user) {
                        sails.log.debug("UserCtrl > User already exists!");

                        req.options = req.options ||  {};
                        req.options.id = user.id;
                        res.status(200);
                        blueprintUpdate(req, res);

                    } else {
                        sails.log.debug("UserCtrl > User doesn't exists!");
                        res.status(201);
                        blueprintCreate(req, res);
                    }
                });
            } else {
                sails.log.debug("UserCtrl > fbToken is invalid.");
                res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "fbToken is invalid." }));
            }
        });

    },


    /**
     * @description service that returns all users at path "/user" and a specific user for example with "id" = 57gh at path "users/57gh"
     * @return A json structure representing the user or the list of all users.
     */
    find: function(req, res) {
        if (typeof req.param("id") != "undefined") {
            User.find({ id: req.param("id") }).exec(function(err, user) {
                if (!err && user) {
                    if (!req.param("fbId")) {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Logged user fbId cannot be empty." })));
                    }
                    var loggedUserFbId = req.param("fbId");
                    checkIfUserHasBlockedLoggedUser(user[0], loggedUserFbId, function(isBlocked) {
                        if (!isBlocked) {
                            return (res.json(user));
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Cannot retrieve requested user because it has blocked logged user." })));
                        }
                    })
                } else {
                    return (res.badRequest(ErrorManagerHelper.createNotFoundError(err)));
                }
            })
        } else {
            User.find().exec(function(err, users) {
                return (res.json(users));
            })
        }
    },


    /**
     * @description service that updates user profile pictures. Pictures must be ones from the user´s facebook profile.
     * @return A Json representation of the user with pictures attribute edited.
     */
    editUserPictures: function(req, res, next) {
        var filter = {};
        if (!req.body.id) {
            return res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "Missing parameter id." }));
        } else {
            var action;
            filter.id = req.body.id;
            if (!req.body.action) {
                return res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "Missing parameter action." }));
            } else {
                action = req.body.action;
            }
            if (!req.body.pic) {
                return res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "Missing parameter pic." }));
            }
        }

        User.find(filter).exec(function(err, user) {
            if (!err && user) {
                if (user.length > 0) {
                    var picturesArray = [];
                    if (action == "add") {
                        if (user[0].pictures.length < sails.config.constants.USER_PROFILE_PICTURES.MAX) {
                            picturesArray = user[0].pictures;
                            picturesArray.push(req.body.pic);
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "User can not upload more pictures. Must delete one before uploading" })));
                        }
                    } else {
                        var foundPictureToDelete = false;
                        for (var i = 0; i < user[0].pictures.length; i++) {
                            if (user[0].pictures[i] != req.body.pic) {
                                picturesArray[picturesArray.length] = user[0].pictures[i];
                            } else {
                                foundPictureToDelete = true;
                            }
                        }
                        if (!foundPictureToDelete) {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Picture not found." })));
                        }
                    }
                    User.update(filter, { pictures: picturesArray }).exec(function(err, userUpdated) {
                        if (!err && userUpdated) {
                            res.json(userUpdated);
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error updating user: " + err })));
                        }
                    })
                } else {
                    return (res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "No user found with especified id" })));
                }
            } else {
                return (res.badRequest(ErrorManagerHelper.createNotFoundError(err)));
            }
        })
    },


    /**
     * @description service that updates user profile. Pictures must be ones from the user´s facebook profile.
     * @return A Json representation of the user with pictures attribute edited.
     */
    editUserProfile: function(req, res, next) {
        var filter = {};
        var updateData = {};

        if (!req.body.id) {
            return res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "Missing parameter id." }));
        } else {
            var action;
            filter.id = req.body.id;

            if ((typeof req.body.pictures === "undefined") &&
                (typeof req.body.aboutMe === "undefined")) {
                return res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "Missing parameter. Must provide at least one parameter for update." }));
            }

            if (typeof req.body.pictures === "undefined") {
                // skip pictures
            } else if (!req.body.pictures) {
                updateData.pictures = [];
            } else if (req.body.pictures.length > sails.config.constants.USER_PROFILE_PICTURES.MAX) {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Too many pictures." })));
            } else {
                updateData.pictures = req.body.pictures;
            }

            if (typeof req.body.aboutMe === "undefined") {
                // skip aboutMe
            } else if (!req.body.aboutMe) {
                updateData.aboutMe = '';
            } else {
                updateData.aboutMe = req.body.aboutMe;
            }

        }

        User.find(filter).exec(function(err, user) {
            if (!err && user) {
                if (user.length > 0) {
                    User.update(filter, updateData).exec(function(err, userUpdated) {
                        if (!err && userUpdated) {
                            res.json(userUpdated);
                            if (updateData.pictures.length > 0) uploadPicturesToS3(userUpdated[0].id, userUpdated[0].pictures);
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error updating user: " + err })));
                        }
                    })
                } else {
                    return (res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "No user found with specified id" })));
                }
            } else {
                console.log("Error: " + req.body.id + " " + err);
                return (res.badRequest(ErrorManagerHelper.createNotFoundError(err)));
            }
        })
    },



    /**
     * @description Save user default preferences: limit search results, show activities created by, age range.
     * @return A json structure representing the User that updated its default preferences.
     */
    saveUserDefaultPreferences: function(req, res) {
        if (!req.body.fbId) {
            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "fbId parameter is not passed correctly." })));
        }
        var filter = {};
        filter.fbId = req.body.fbId;
        console.log('saveUserPreferences: ', filter.fbId);
        User.find(filter).exec(function(err, users) {
            if (!err && users) {
                if (users.length == 1) {
                    console.log(req.body);
                    var newDefaultPreferencesData = {
                        default_limit_search_results: req.body.default_limit_search_results ? req.body.default_limit_search_results : "",
                        default_activities_created_by: req.body.default_activities_created_by ? req.body.default_activities_created_by : "",
                        default_activities_age_from: req.body.default_activities_age_from ? req.body.default_activities_age_from : "",
                        default_activities_age_to: req.body.default_activities_age_to ? req.body.default_activities_age_to : ""
                    };
                    User.update(filter, newDefaultPreferencesData).exec(function(err, userUpdated) {
                        if (!err && userUpdated) {
                            console.log('updated');
                            return (res.json(userUpdated));
                        } else {
                            console.log('error while updating');
                            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error trying to update user: " + err })));
                        }
                    })
                } else {
                    return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: Multiple users with that fbId." })));
                }
            } else {
                return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error while retrieving user with fbId passed as parameter: " + err })));
            }
        })
    },


    /**
     * @description Register user device token
     * @return A json structure representing the User that updated its default preferences.
     */
    registerDeviceToken: function(req, res) {
        if (!req.body.fbId) {
            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "fbId parameter is not passed correctly." })));
        }
        var filter = {};
        filter.fbId = req.body.fbId;
        User.find(filter).exec(function(err, users) {
            if (!err && users) {
                if (users.length == 1) {
                    var newDeviceToken = {
                        deviceToken: req.body.device_token ? req.body.device_token : ""
                    };
                    User.update(filter, newDeviceToken).exec(function(err, userUpdated) {
                        if (!err && userUpdated) {
                            return (res.json({}));
                        } else {
                            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error trying to register device token: " + err })));
                        }
                    })
                } else {
                    return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: Multiple users with that fbId." })));
                }
            } else {
                return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error while retrieving user with fbId passed as parameter: " + err })));
            }
        })
    },


    /**
     * @description Reset user push notification badge counter
     * @return updated user object
     */
    resetBadgeCounter: function(req, res) {
        if (!req.body.fbId) {
            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "fbId parameter is not passed correctly." })));
        }
        var filter = {};
        filter.fbId = req.body.fbId;
        User.find(filter).exec(function(err, users) {
            if (!err && users) {
                if (users.length == 1) {
                    var newBadgeCounter = {
                        badge_counter: 0
                    };
                    User.update(filter, newBadgeCounter).exec(function(err, userUpdated) {
                        if (!err && userUpdated) {
                            return (res.json({}));
                        } else {
                            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error trying to reset badge counter: " + err })));
                        }
                    });
                } else {
                    return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: Multiple users with that fbId." + users.length })));
                }
            } else {
                return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error while retrieving user with fbId passed as parameter: " + err })));
            }
        })
    },


    /**
     * @description Retrieves users mutual friends.
     * @return A list of json structures of mutual users friends.
     */
    getUsersMutualFriends: function(req, res) {
        var otherUserFbId = req.param("fbId");
        var fbToken = req.headers.fbtoken;
        if (!otherUserFbId || !fbToken) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error passing parameters fbToken or fbId." })));
        }
        console.log("Other user: " + otherUserFbId + "fbToken: " + fbToken);
        var graphUrl = sails.config.constants.URLS.FACEBOOK_GRAPH_API;
        var appSecret = sails.config.constants.KEYS.FACEBOOK_APP_SECRET_KEY;
        var hmac = crypto.createHmac('sha256', appSecret);
        hmac.update(fbToken);

        var options = {
            url: graphUrl + '/' + otherUserFbId + '?fields=context.fields%28mutual_friends%29',
            qs: {
                access_token: fbToken,
                appsecret_proof: hmac.digest('hex')
            }
        }
        var mutualFriendsIds = [];
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                try {
                    var json = JSON.parse(body);
                } catch (error) {
                    sails.log.debug("Error retrieving users mutual friends: " + error);
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: error })));
                }
                if (!json.id || !json.context) {
                    sails.log.debug("User do not allows to access its mutual friends with logged user.");
                    return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Cannot retrieve mutual users friends because the user may not allows to access its mutual friends." })));
                }

                if (!json.context.mutual_friends) {
                    return (res.json([]));
                }
                var mutualFriendsIds = json.context.mutual_friends.data.map(function(user) { return user.id });
                User.find({ fbId: mutualFriendsIds }).exec(function(err, users) {
                    if (!err && users) {
                        return (res.json(users));
                    } else {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retieving mutual friends." })));
                    }
                })
            } else if (!error) {
                if (response.statusCode == 404) {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "No mutual friends found between users." })));
                } else {
                    sails.log.debug("Error retrieving users mutual friends: ");
                    sails.log.debug("Status code: " + response.statusCode);
                    sails.log.debug("Response body: " + response.body);
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error trying to request for mutual friends." })));
                }
            } else {
                sails.log.debug("Error retrieving users mutual friends: " + error);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: " + error })));
            }
        })
    },


    /**
     * @description Service to deactivate user account.
     * @return The json structure of the deactivated user.
     */
    destroyUser: function(req, res) {
        if (!req.param("fbId")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error passing user fbId." })));
        }
        User.find({ fbId: req.param("fbId") }).exec(function(err, user) {
            if (!err && user && user.length > 0) {
                var userToDelete = user[0];
                var activitiesToDelete = [];
                for (var i = 0; i < userToDelete.activities.length; i++) {
                    if (!userToDelete.activities[i].deleted) {
                        activitiesToDelete.push(userToDelete.activities[i].id);
                    }
                }
                Activity.update({ id: activitiesToDelete }, { deleted: true }).exec(function(err, deletedActivities) {
                    if (!err) {
                        User.destroy({ fbId: userToDelete.fbId }).exec(function(err, userDeleted) {
                            if (!err && userDeleted) {
                                sails.log.debug("User with fbId=" + userToDelete.fbId + " was successfully deleted.");
                                return (res.json(userDeleted));
                            } else {
                                if (err) {
                                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                                } else {
                                    sails.log.debug("Error deleting user");
                                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error deleting user" })));
                                }
                            }
                        });
                    } else {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error deleting user activities" })));
                    }
                });
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: " + err })));
            }
        })
    },


    /**
     * @description Service to block a user by another user. The user blocked can see activities created by the blocker but can not send requests
     *              invitatios to it.
     *              Blocked user can see blocker user profile??
     *              Blocked user can see activity detail of an activity created by the blocker user??
     * @return The json structure of the blocker user with the new blocked user facebook id added in his list of blocked users.
     */
    blockUser: function(req, res) {
        if (!req.body.userFbIdToBlock || !req.body.userFbIdBlocker) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error passing blocker user fbId or user to block fbId." })));
        }
        var userFbIdToBlock = req.body.userFbIdToBlock;
        var userFbIdBlocker = req.body.userFbIdBlocker;
        User.find({ fbId: userFbIdBlocker }).exec(function(err, user) {
            if (!err && user) {
                var userBlockedUsers = user[0].blocked_users;
                for (var i = 0; i < userBlockedUsers.length; i++) {
                    if (userBlockedUsers[i] == userFbIdToBlock) {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "User to block is already blocked by the user blocker." })));
                    }
                }
                userBlockedUsers.push(userFbIdToBlock);
                User.update({ fbId: userFbIdBlocker }, { blocked_users: userBlockedUsers }).exec(function(err, userUpdated) {
                    if (!err && userUpdated) {
                        sails.log.debug("User with fbId=" + userFbIdBlocker + " blocked the user with fbId:" + userFbIdToBlock);
                        return (res.json(userUpdated));
                    } else {
                        if (err) {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                        } else {
                            sails.log.debug("Error blocking user");
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error blocking user" })));
                        }
                    }
                })
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: " + err })));
            }
        })
    },


    /**
     * @description Service to ban a user from the app. This service can only be invoked by the admin console of the application.
     * @return The json structure of banned user.
     */

    banUser: function(req, res) {
        if (!req.body.userFbIdToBan) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error passing user fbId to ban." })));
        }
        var userToBan = req.body.userFbIdToBan;
        console.log("UID: " + userToBan);
        var appId = sails.config.facebook.appId;
        var access_token = sails.config.facebook.appId + "|" + sails.config.facebook.appSecret;
        var fbToken = req.headers.fbtoken;
        var graphUrl = sails.config.constants.URLS.FACEBOOK_GRAPH_API;
        var options = {
            url: graphUrl + '/' + appId + '/banned?uid=' + userToBan,
            qs: { access_token: access_token },
            method: "POST"
        }
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                try {
                    var json = JSON.parse(body);
                    return (res.json(json));
                } catch (err) {
                    sails.log.debug("Error getting banned users: Status Code = " + response.statusCode);
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                }
            } else {
                sails.log.debug("Error getting banned users: Status Code = " + response.statusCode);
                if (error) sails.log.debug("Error = " + error);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: error })));
            }
        })
    },


    /**
     * @description Service to get all banned users from the app.
     * @return A list of all facebook ids of banned users.
     */
    getBannedUsers: function(req, res) {
        var appId = sails.config.facebook.appId;
        var access_token = sails.config.facebook.appId + "|" + sails.config.facebook.appSecret;
        var fbToken = req.headers.fbtoken;
        var graphUrl = sails.config.constants.URLS.FACEBOOK_GRAPH_API;
        var options = {
            url: graphUrl + '/' + appId + '/banned',
            qs: { access_token: access_token },
            method: "GET"
        }
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                try {
                    var json = JSON.parse(body);
                    return (res.json(json));
                } catch (err) {
                    sails.log.debug("Error getting banned users: =>Status Code = " + response.statusCode + " =>Error = " + err);
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                }
            } else {
                sails.log.debug("Error getting banned users: Status Code = " + response.statusCode);
                if (error) sails.log.debug("Error = " + error);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: error })));
            }
        })
    },


    /**
     * @description Service to ban a user from the app. This service can only be invoked by the admin console of the application.
     * @return The json structure of banned user.
     */
    unBanUser: function(req, res) {
        if (!req.body.userFbIdToUnban) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error passing user fbId to unban." })));
        }
        var userToUnban = req.body.userFbIdToUnban;
        var appId = sails.config.facebook.appId;
        var access_token = sails.config.facebook.appId + "|" + sails.config.facebook.appSecret;
        var fbToken = req.headers.fbtoken;
        var graphUrl = sails.config.constants.URLS.FACEBOOK_GRAPH_API;
        var options = {
            url: graphUrl + '/' + appId + '/banned?uid=' + userToUnban,
            qs: { access_token: access_token },
            method: "DELETE"
        }
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                try {
                    var json = JSON.parse(body);
                    return (res.json(json));
                } catch (err) {
                    sails.log.debug("Error getting banned users: Status Code = " + response.statusCode);
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                }
            } else {
                sails.log.debug("Error getting banned users: Status Code = " + response.statusCode);
                if (error) sails.log.debug("Error = " + error);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: error })));
            }
        })
    },


    /**
     * @description Service to update user points after sharing on social media
     * @return The json structure of user.
     */
    didShare: function(req, res) {
        if (!req.body.fbId) {
            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "fbId parameter is not passed correctly." })));
        }
        if (!req.body.platform) {
            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "plaform parameter is not passed correctly." })));
        }
        if (!req.body.activityId) {
            // Shared on Tell a Friend page if no activity id is provided
            // return(res.json(ErrorManagerHelper.customizeBussinesLogicError({summary : "fbId parameter is not passed correctly."})));
        }
        var filter = {};
        filter.fbId = req.body.fbId;
        User.find(filter).exec(function(err, users) {
            if (!err && users) {
                if (users.length == 1) {
                    // TODO: different offset based on platform & activityId
                    User.updatePoint({ users: [users[0].id], offset: 5 }, function() {
                        User.find(filter).exec(function(errUpdate, usersUpdated) {
                            if (!errUpdate && usersUpdated && usersUpdated.length == 1) {
                                return (res.json(usersUpdated));
                            } else {
                                return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error while retrieving updated user with fbId passed as parameter: " + errUpdate })));
                            }
                        });
                    });
                } else {
                    return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: Multiple users with that fbId." + users.length })));
                }
            } else {
                return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error while retrieving user with fbId passed as parameter: " + err })));
            }
        })
    },


    /**
     * @description Not found response when trying to perform a GET operation on user/login.
     * @return Not found response.
     */
    getLogin: function(req, res) {
        return (res.notFound(ErrorManagerHelper.createNotFoundError({ summary: "Trying to perform a GET operation on login." })));
    }

};


function checkIfUserHasBlockedLoggedUser(user, loggedUserFbId, cb) {
    var hasBeenBlocked = false;
    for (var i = 0;
        (i < user.blocked_users.length && !hasBeenBlocked); i++) {
        if (user.blocked_users[i] == loggedUserFbId) {
            hasBeenBlocked = true;
        }
    }
    return (cb(hasBeenBlocked));
}

function uploadPicturesToS3(userId, pictures) {
    console.log('upload started! for userId: ' + userId);
    var dirPath = 'partake/avatars/' + userId;
    var requests = [];
    for (var i = 0; i < pictures.length; i++) {
        var uri = pictures[i];

        // If it is already an amazon URL
        if (uri.indexOf('amazonaws.com') !== -1) {
            console.log("AMAZON HAHAHA!!!--");
            console.log(uri);
            continue;
        }

        var fileNameRegex = /\/([\d_\w]+\.[\w]{3})/g;
        var fileNameMatch = fileNameRegex.exec(uri);
        var path = dirPath + fileNameMatch[0];

        var options = {
            uri: uri,
            encoding: null
        };

        console.log(path);

        (function(awsFilePath, pictureIndex) {
            var request = rp(options)
                .then(function(body) {
                    console.log('== userId: ' + userId);
                    console.log('== picture index: ' + pictureIndex);
                    console.log('== awsFilePath: ' + awsFilePath);
                    return new Promise(function(resolve, reject) {
                        s3.putObject({
                            Body: body,
                            Key: awsFilePath,
                            Bucket: 'slyfej',
                            ACL: 'public-read'
                        }, function(error, data) {
                            if (error) {
                                console.log("error uploading image to s3 for image at: " + pictureIndex);
                                resolve({ index: pictureIndex, url: pictures[pictureIndex] });
                            } else {
                                console.log("success uploading to s3 for image at: " + pictureIndex);
                                resolve({ index: pictureIndex, url: 'https://s3-us-west-2.amazonaws.com/slyfej/' + awsFilePath });
                            }
                        });
                    });
                }).catch(function(err) {
                    console.log("failed to get image at index: " + pictureIndex);
                    return Promise.resolve({ index: pictureIndex, url: '' });
                });
            requests.push(request);
        })(path, i);
    }

    Promise.all(requests).then(function(results) {
        console.log('Result here---');
        console.log(results);
        if (results.length < 1) return;
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            pictures[result.index] = result.url;
        }

        i = 0;
        while (i < pictures.length) {

            var pictureURL = pictures[i];

            if (pictureURL == '') {
                pictures.splice(i, 1);
            } else {
                i++;
            }
        }

        console.log('\nFinal results == ');
        console.log(pictures);

        User.update(userId, { pictures: pictures }).exec(function(err, userUpdated) {
            if (!err && userUpdated) {
                console.log('== USER UPDATE SUCCESS == ');
                console.log('Name: ' + userUpdated.firstName + ' ' + userUpdated.lastName);
                console.log('\n');
            } else {
                console.log("Error updating user: " + err);
            }
        })

    });
}