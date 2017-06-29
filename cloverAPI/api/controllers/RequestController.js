/**
 * RequestController
 *
 * @description :: Server-side logic for managing requests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    /**
     * Find and retrieve Requests.
     *
     * @description Get the Requests to invitatios. If param "fbId" is included in the request it retieves only Requests related to a user with fbId = fbId.
     * @return The Requests to invitations.
     */

    find: function(req, res, next) {
        var fbId = req.param("fbId");
        Request.find().populate('requester').populate('activity').exec(function(err, requests) {
            if (!err && requests) {
                if (fbId) {
                    if (!req.param("userId")) {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Param userId cannot be empty." })));
                    }
                    var userId = req.param("userId");
                    filterRequestsByUser(requests, fbId, function(requestsToFilter) {
                        filterRequestsByActivityDate(requestsToFilter, function(requestsFiltered) {
                            filterIfActivityOfRequestHasBeenDeleted(requestsFiltered, function(requestsToNotDeletedActivities) {
                                checkBlockedUserRequestValidation(res, fbId, userId, requestsToNotDeletedActivities, function(requestsToShow) {
                                    createJsonRequestResponse(requestsToShow, function(response) {
                                        res.json(response);
                                        next();
                                    })
                                })
                            })
                        })
                    })
                } else {
                    filterRequestsByActivityDate(requests, function(requestsFiltered) {
                        filterIfActivityOfRequestHasBeenDeleted(requestsFiltered, function(requestsToNotDeletedActivities) {
                            checkBlockedUserRequestValidation(res, fbId, userId, requestsToNotDeletedActivities, function(requestsToShow) {
                                createJsonRequestResponse(requestsToShow, function(response) {
                                    res.json(response);
                                    next();
                                })
                            })
                        })
                    })
                }
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
            }
        })
    },



    /**
     * Retrieves one specific request with customized request response.
     *
     * @description Receives the id of the request and retrieves its information in a customized json response.
     * @return The Request invitation in customized json response.
     */

    findOne: function(req, res, next) {

        if (!req.param("id")) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "id of the request not supplied." })));
        } else {
            var filter = {};
            filter.id = req.param("id");
            Request.find(filter).populate('activity').populate('requester').exec(function(err, requests) {
                if (!err && requests) {
                    if (requests.length == 1) {
                        createJsonRequestResponse(requests, function(response) {
                            res.json(response);
                            next();
                        })
                    } else {
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Multiple requests with the id supplied." })));
                    }
                } else {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: err })));
                }
            })
        }
    },



    /**
     * Accepts a request invitation.
     *
     * @description Accepts a request invitation from a user. The Request must has state = PENDING.
     * @return The Request invitation accepted if state is PENDING, else error message.
     */

    accept: function(req, res, next) {
        var reqId = req.body.id;
        if (reqId) {
            var filter = {};
            filter.id = reqId;
            filter.state = sails.config.constants.REQUEST_STATUS.PENDING;
            var newStatus = {};
            newStatus.state = sails.config.constants.REQUEST_STATUS.ACCEPTED;
            Request.find(filter).populate('requester').populate('activity').exec(function(err, request) {
                if (!err && request && request.length > 0) {
                    var originalRequest = request[0];

                    Request.update(filter, newStatus).exec(function(err, requestApproved) {
                        if (!err && requestApproved) {
                            User.updatePoint({ users: [originalRequest.requester.id, originalRequest.activity.creator], offset: 2 }, function() {
                                var notificationData = {
                                    alert: "Your request has been accepted.",
                                    cd: {
                                        type: "request",
                                        action: "accept",
                                        refer: originalRequest.activity.id
                                    }
                                };

                                NotificationService.sendNotification(originalRequest.requester.id, notificationData, function() {
                                    requestApproved.requester = originalRequest.requester;
                                    requestApproved.activity = originalRequest.activity;

                                    createJsonRequestResponse(requestApproved, function(response) {
                                        res.json(response);
                                        next();
                                    })
                                });
                            })
                        } else {
                            if (err) {
                                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                            } else {
                                res.badRequest(ErrorManagerHelper.createNotFoundError());
                            }
                        }
                    })
                } else {
                    if (err) {
                        res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                    } else if (!request) {
                        res.badRequest(ErrorManagerHelper.createNotFoundError());
                    } else {
                        res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "id of the request does not exists." }));
                    }
                }
            })
        } else {
            res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "id of the request is missing." }));
        }
    },


    /**
     * Rejects a request invitation.
     *
     * @description Rejects a request invitation from a user. The Request must has state = PENDING.
     * @return The Request invitation rejected if state is PENDING, else error message.
     */
    deny: function(req, res, next) {

        var reqId = req.body.id;
        if (reqId) {
            var filter = {};
            filter.id = reqId;
            filter.state = [sails.config.constants.REQUEST_STATUS.PENDING, sails.config.constants.REQUEST_STATUS.ACCEPTED];
            var newStatus = {};
            newStatus.state = sails.config.constants.REQUEST_STATUS.REJECTED;
            Request.find(filter).populate('requester').populate('activity').exec(function(err, request) {
                if (!err && request && request.length > 0) {
                    var originalRequest = request[0];

                    Request.update(filter, newStatus).exec(function(err, requestRejected) {
                        if (!err && requestRejected) {
                            var users = [];
                            if (originalRequest.state == sails.config.constants.REQUEST_STATUS.ACCEPTED &&
                                new Date(originalRequest.activity.date) >= DateHelper.createUTCDate()) {
                                users = [originalRequest.requester.id, originalRequest.activity.creator];
                            };
                            User.updatePoint({ users: users, offset: -2 }, function() {
                                requestRejected.requester = originalRequest.requester;
                                requestRejected.activity = originalRequest.activity;

                                createJsonRequestResponse(requestRejected, function(response) {
                                    res.json(response);
                                    next();
                                });
                            });
                        } else {
                            if (err) {
                                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                            } else {
                                res.badRequest(ErrorManagerHelper.createNotFoundError());
                            }
                        }
                    })
                } else {
                    if (err) {
                        res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                    } else if (!request) {
                        res.badRequest(ErrorManagerHelper.createNotFoundError());
                    } else {
                        res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "id of the request does not exists." }));
                    }
                }
            })
        } else {
            res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "id of the request is missing." }));
        }
    },


    /**
     * Cancel a request invitation.
     *
     * @description Cancel a request invitation from a user. The Request must has state = ACCEPTED.
     * @return The Request invitation canceled if state is ACCEPTED, else error message.
     */
    cancel: function(req, res, next) {

        var reqId = req.body.id;
        if (reqId) {
            var filter = {};
            filter.id = reqId;
            //filter.state = sails.config.constants.REQUEST_STATUS.ACCEPTED;
            filter.state = [sails.config.constants.REQUEST_STATUS.PENDING, sails.config.constants.REQUEST_STATUS.ACCEPTED];
            var newStatus = {};
            newStatus.state = sails.config.constants.REQUEST_STATUS.CANCELLED;
            Request.find(filter).populate("requester").populate("activity").exec(function(err, request) {
                if (!err && request && request.length > 0) {
                    originalRequest = request[0];

                    Request.update(filter, newStatus).exec(function(err, requestCanceled) {
                        if (!err && requestCanceled) {
                            var users = [];
                            if (originalRequest.state == sails.config.constants.REQUEST_STATUS.ACCEPTED &&
                                new Date(originalRequest.activity.date) >= DateHelper.createUTCDate()) {
                                users = [originalRequest.requester.id, originalRequest.activity.creator];
                            };
                            User.updatePoint({ users: users, offset: -2 }, function() {

                                var notificationData = {
                                    alert: "Sorry, " + originalRequest.requester.firstName + " canceled " +
                                        (originalRequest.requester.gender == "male" ? "his" : "her") + " request",
                                    cd: {
                                        type: "request",
                                        action: "cancel",
                                        refer: originalRequest.activity.id
                                    }
                                };

                                NotificationService.sendNotification(originalRequest.activity.creator, notificationData, function() {
                                    requestCanceled.requester = originalRequest.requester;
                                    requestCanceled.activity = originalRequest.activity;

                                    createJsonRequestResponse(requestCanceled, function(response) {
                                        res.json(response);
                                        next();
                                    })
                                });
                            });
                        } else {
                            if (err) {
                                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                            } else {
                                res.badRequest(ErrorManagerHelper.createNotFoundError());
                            }
                        }
                    })
                } else {
                    if (err) {
                        res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                    } else if (!request) {
                        res.badRequest(ErrorManagerHelper.createNotFoundError());
                    } else {
                        res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "id of the request does not exists." }));
                    }
                }
            })
        } else {
            res.badRequest(ErrorManagerHelper.createMissingParameterError({ summary: "id of the request is missing." }));
        }
    },


    /**
     * Create a request invitation.
     *
     * @description Creates a request invitation.
     * @return The Request invitation created with the creator and activity populated in the response.
     */
    create: function(req, res) {
        if (!req.body.requesterFbId || !req.body.activity || !req.body.creatorFbId) {
            return (res.json(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error sending requester, activity or creator parameter." })))
        }
        var creator = req.body.creatorFbId;
        var requester = req.body.requesterFbId;
        var activityId = req.body.activity;

        var newRequestData = {
            note: req.body.note ? req.body.note : "",
            activity: activityId
        };
        var filter = {};
        filter.fbId = [requester, creator];
        User.find(filter).exec(function(err, users) {
            if (!err && users) {
                if (users.length == 2) {
                    checkIfUserIsBlocked(users, requester, function(requesterIsBlocked, userRequesterIndex) {
                        if (!requesterIsBlocked) {
                            newRequestData.requester = users[userRequesterIndex].id;
                            Request.create(newRequestData).exec(function(err, requestCreated) {
                                if (!err && requestCreated) {
                                    Request.find({ id: requestCreated.id }).populate("requester").populate("activity").exec(function(err, requests) {
                                        if (!err && requests) {
                                            if (requests.length == 1) {
                                                User.updatePoint({ users: [requests[0].activity.creator], offset: 1 }, function() {
                                                    var notificationData = {
                                                        alert: "You've got a new request.",
                                                        cd: {
                                                            type: "request",
                                                            action: "create",
                                                            refer: activityId
                                                        }
                                                    };
                                                    NotificationService.sendNotification(users[1 - userRequesterIndex].id, notificationData, function() {
                                                        res.status(201);
                                                        createJsonRequestResponse(requests, function(response) {
                                                            return (res.json(response));
                                                        })
                                                    });
                                                });
                                            } else {
                                                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving the request created. More than one user found." })));
                                            }
                                        } else {
                                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving the request created." })));
                                        }
                                    })
                                } else {
                                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error creating request invitation." })))
                                }
                            })
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Requester user can not send a request to activity passed in the parameters because it has been blocked by the creator of the activity." })))
                        }
                    })
                } else {
                    return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving user. More than one user with specified fbId" })))
                }
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving user." })))
            }
        })
    }

};


/**
 * Filter requests passed as parameter by userId.
 *
 * @description Returns the requests that belongs to user with id=userId or that where sent by other users to an activity that the user with id=userId
 * 				created and with status=ACCEPTED.
 * @return The requests filtered by user.
 *
 */
function filterRequestsByUser(requests, fbId, cb) {
    try {
        var requestsToShow = [];
        User.find({ fbId: fbId }).exec(function(err, user) {
            if (!err && user) {
                var userId = user[0].id;
                for (var i = 0; i < requests.length; i++) {
                    if (!requests[i].activity) {
                        sails.log.debug("Request with wrong activity attributes: Activity does not exist. RequestId : " + requests[i].id);
                    } else if (!requests[i].requester) {
                        sails.log.debug("Request with wrong requester attributes: Requester does not exist. RequestId : " + requests[i].id);
                    } else {
                        if (requests[i].requester.id == userId || (requests[i].activity.creator == userId && (requests[i].state == sails.config.constants.REQUEST_STATUS.ACCEPTED ||
                                requests[i].state == sails.config.constants.REQUEST_STATUS.PENDING))) {

                            requestsToShow[requestsToShow.length] = requests[i];
                            console.log("RequestID: " + requests[i].id);
                        }
                    }
                }
                return cb(requestsToShow);
            } else {
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving user." })))
            }
        })
    } catch (err) {
        throw ("Filtering Requests error: " + err);
    }
}



/**
 * Filter requests to show only the ones that are related to an activity that is currently active.
 *
 * @description Filter request to show the ones related to an activity with date equal or bigger than actual date.
 * @return The requests filtered.
 *
 */
function filterRequestsByActivityDate(requests, cb) {
    var requestsToShow = [];
    var actualDate = new Date(DateHelper.createActualDateWithFormat_yyyyMMdd());
    for (var i = 0; i < requests.length; i++) {
        var activityEndDate = new Date(requests[i].activity.endDate);
        if (activityEndDate >= actualDate) {
            requestsToShow[requestsToShow.length] = requests[i];
        }
    }
    return (cb(requestsToShow));
}


/**
 * Check if the activity owner has blocked the user.
 *
 * @description Check if the activity owner has blocked the user.
 * @return The requests filtered.
 *
 */
function checkIfUserIsBlocked(users, requester, cb) {
    var userRequesterIndex;
    if (users[0].fbId == requester) {
        userRequesterIndex = 0;
    } else {
        userRequesterIndex = 1;
    }
    var userCreatorIndex = (userRequesterIndex + 1) % 2;
    var requesterIsBlocked = false;
    for (var i = 0; i < users[userCreatorIndex].blocked_users.length; i++) {
        if (users[userCreatorIndex].blocked_users[i] == requester) {
            requesterIsBlocked = true;
            break;
        }
    }
    cb(requesterIsBlocked, userRequesterIndex);
}


/**
 * Filter requests by block user filter. Requests from users that have been blocked by the logged user or requests of the logged user to activities
 * which has a creator that has blocked the logged user won´t be added.
 * @return The requests filtered.
 */
function checkBlockedUserRequestValidation(res, loggedUserFbId, userId, requests, cb) {
    var usersIdsToCompareIfBlocked = [];
    var indexOfRequestUser = [];
    for (var i = 0; i < requests.length - 1; i++) {
        indexOfRequestUser[i] = [];
        for (var j = 0; j < requests.length; j++) {
            indexOfRequestUser[i][j] = null;
        }
    }
    //Save all other users id.
    //console.log("Cant Requests starting checkBlockedUserRequestValidation: " + requests.length);
    for (var i = 0; i < requests.length; i++) {
        if (requests[i].requester.fbId == loggedUserFbId) {
            usersIdsToCompareIfBlocked[i] = requests[i].activity.creator;
            if (!indexOfRequestUser[requests[i].activity.creator]) {
                indexOfRequestUser[requests[i].activity.creator] = new Array(requests.length);
            }
            indexOfRequestUser[requests[i].activity.creator][i] = i;
            /*console.log("usersIdsToCompareIfBlocked[" + i + "]: " + requests[i].activity.creator);
            console.log("indexOfRequestUser[" + requests[i].activity.creator + "]: " + i);*/
        } else {
            usersIdsToCompareIfBlocked[i] = requests[i].requester.id;
            if (!indexOfRequestUser[requests[i].requester.id]) {
                indexOfRequestUser[requests[i].requester.id] = new Array(requests.length);
            }
            indexOfRequestUser[requests[i].requester.id][i] = i;
            /*console.log("usersIdsToCompareIfBlocked[" + i + "]: " + requests[i].requester.id);
            console.log("indexOfRequestUser[" + requests[i].requester.id + "]: " + i);*/
        }
    }
    usersIdsToCompareIfBlocked.push(userId);
    var filter = {};
    filter.id = usersIdsToCompareIfBlocked;
    User.find(filter).exec(function(err, usersToCompare) {
        if (!err && usersToCompare) {
            filterRequestsOfNonBlockingUsers(loggedUserFbId, requests, userId, indexOfRequestUser, usersToCompare, function(requestsToShow) {
                //console.log("Cant Requests Final: " + requestsToShow.length);
                /*for (var i = 0; i < requestsToShow.length; i++) {
                	console.log("Request Id: " + requestsToShow[i].id);
                }*/
                return (cb(requestsToShow));
            })
        } else {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving requests: cannot compare if users are blocked." })))
        }
    })
}



function filterRequestsOfNonBlockingUsers(loggedUserFbId, requests, userId, indexOfRequestUser, usersToCompare, cb) {
    var requestsToShow = [];
    var usersToCheckIfLoggedUserHasBlockedIt = [];
    var loggedUserBlockedUsers = [];
    //Check if the other user have or have not blocked the logged user.
    for (var i = 0; i < usersToCompare.length; i++) {
        if (usersToCompare[i].id != userId) {
            var isBlocked = false;
            for (var j = 0;
                (j < usersToCompare[i].blocked_users.length && !isBlocked); j++) {
                if (usersToCompare[i].blocked_users[j] == loggedUserFbId) {
                    //console.log("Bloqueado por : " + usersToCompare[i].id);
                    isBlocked = true;
                }
            }
            if (!isBlocked) {
                //console.log("Agrego usersToCheckIfLoggedUserHasBlockedIt : " + usersToCompare[i].id);
                usersToCheckIfLoggedUserHasBlockedIt[usersToCheckIfLoggedUserHasBlockedIt.length] = usersToCompare[i].id;
            }
        } else {
            loggedUserBlockedUsers = usersToCompare[i].blocked_users;
        }
    }
    //Check if the logged user has blocked some of the users.
    //console.log("CANT SEMIFINAL: " + requests.length);
    for (var i = 0; i < usersToCheckIfLoggedUserHasBlockedIt.length; i++) {
        isBlocked = false;
        //console.log("UserToCheck: " + usersToCheckIfLoggedUserHasBlockedIt[i]);
        for (var j = 0;
            (j < loggedUserBlockedUsers.length && !isBlocked); j++) {
            //console.log("loggedUserBlockedUsers: " + loggedUserBlockedUsers[j]);
            if (loggedUserBlockedUsers[j] == usersToCheckIfLoggedUserHasBlockedIt[i]) {
                isBlocked = true;
            }
        }
        if (!isBlocked) {
            for (var m = 0; m < requests.length; m++) {
                if (requests[indexOfRequestUser[usersToCheckIfLoggedUserHasBlockedIt[i]][m]]) {
                    requestsToShow[requestsToShow.length] = requests[indexOfRequestUser[usersToCheckIfLoggedUserHasBlockedIt[i]][m]];
                }
            }
        }
    }
    return (cb(requestsToShow));
}


/**
 * Filter requests by block user filter. Requests from users that have been blocked by the logged user or requests of the logged user to activities
 * which has a creator that has blocked the logged user won´t be added.
 * @return The requests filtered.
 */
function filterIfActivityOfRequestHasBeenDeleted(requests, cb) {
    var requestsToShow = [];
    for (var i = 0; i < requests.length; i++) {
        if (!requests[i].activity.deleted) {
            requestsToShow.push(requests[i]);
        }
    }
    return (cb(requestsToShow));
}




/**
 * Creates customized json response for requests.
 *
 * @description Creates the customized json structure for all request responses.
 * @return The json structure for requests responses.
 *
 */
function createJsonRequestResponse(requests, cb) {
    console.log('requests: ' + requests.length);

    var creators = [];
    for (var i = 0; i < requests.length; i++) {
        if (requests[i] && requests[i].activity) {
            creators.push(requests[i].activity.creator);
        }
    }

    User.find({ id: creators }).exec(function(err, users) {
        if (!err && users) {
            for (var i = 0; i < requests.length; i++) {
                for (var j = 0; j < users.length; j++) {
                    if (users[j].id == requests[i].activity.creator) {
                        requests[i].activity.creator = users[j];
                        break;
                    }
                };
            };
        };

        var requestsToShow = [];

        for (var i = 0; i < requests.length; i++) {
            var request = {
                requester: requests[i].requester,
                userFbId: requests[i].requester.fbId ? requests[i].requester.fbId : null,
                userName: requests[i].requester.firstName ? requests[i].requester.firstName : null,
                userAge: requests[i].requester.age,
                userId: requests[i].requester.id ? requests[i].requester.id : null,
                activity: requests[i].activity,
                activityName: requests[i].activity.name ? requests[i].activity.name : null,
                activityDate: requests[i].activity.date ? requests[i].activity.date : null,
                activityId: requests[i].activity.id ? requests[i].activity.id : null,
                activityType: requests[i].activity.type ? requests[i].activity.type : null,
                requestCreatedAt: requests[i].createdAt ? requests[i].createdAt : null,
                requestId: requests[i].id ? requests[i].id : null,
                requestState: requests[i].state ? requests[i].state : null,
                requestUpdatedAt: requests[i].updatedAt ? requests[i].updatedAt : null,
                requestNote: requests[i].note ? requests[i].note : null
            }
            requestsToShow[i] = request;
        }

        return (cb(requestsToShow));
    });


}