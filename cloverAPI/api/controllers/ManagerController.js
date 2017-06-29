/**
 * ManagerController
 *
 * @description :: Server-side logic for managing managers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = {


    /**
     * @description service to start manager panel of the app.
     * @param  req
     * @param  res
     * @return The main view of the manager panel.
     */

    manager: function(req, res) {
        res.view("manager", {});
    },

    createActivityGet: function(req, res) {
        User.find().exec(function(err, users) {
            if (!err && users) {
                res.view("createActivity", { users: users });
            } else {
                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
            }
        })
    },

    editActivityListGet: function(req, res) {
        Activity.find().populate('location').exec(function(err, activities) {
            if (!err && activities) {
                res.view("editActivityListGet", { activities: activities });
            } else {
                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
            }
        })
    },

    deleteActivityList: function(req, res) {
        Activity.find().exec(function(err, activities) {
            if (!err && activities) {
                res.view("deleteActivityListGet", { activities: activities });
            } else {
                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
            }
        })
    },

    editActivityGet: function(req, res) {
        res.view("editActivity", {});
    },

    editActivity: function(req, res) {
        var filter = {};
        var newStatusActivity = {};
        filter.id = req.body.activity_id;
        newStatusActivity.date = req.body.date ? req.body.date : "";
        newStatusActivity.name = req.body.activity_name ? req.body.activity_name : "";
        newStatusActivity.details = (req.body.activity_details).trim();
        newStatusActivity.fromTime = req.body.from_time ? req.body.from_time : "";
        newStatusActivity.toTime = req.body.to_time ? req.body.to_time : "";
        newStatusActivity.isAtendeeVisible = req.body.is_atendee_visible ? req.body.is_atendee_visible : "";
        newStatusActivity.type = req.body.activity_type;
        newStatusActivity.creator = req.body.creator_id;
        newStatusActivity.visibility = req.body.activity_visibility;
        newStatusActivity.gender = req.body.activity_gender;
        newStatusActivity.age_filter_from = req.body.activity_age_filter_from;
        newStatusActivity.age_filter_to = req.body.activity_age_filter_to;
        var newStatusLocation = {};
        newStatusLocation.formatted_address = req.body.activity_address;
        newStatusLocation.lat = req.body.activity_lat;
        newStatusLocation.lon = req.body.activity_lon;
        Activity.update(filter, newStatusActivity).exec(function(err, updatedActivity) {
            if (!err && updatedActivity && updatedActivity.length > 0) {
                filter.id = req.body.id_location;
                Location.update(filter, newStatusLocation).exec(function(err, updatedLocation) {
                    if (!err && updatedLocation.length > 0) {
                        Activity.find().populate('location').exec(function(err, updatedActivities) {
                            if (!err && updatedActivities) {
                                res.view("editActivityListGet", { activities: updatedActivities });
                            } else {
                                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                            }
                        })
                    } else {
                        res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                    }
                })
            } else {
                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
            }
        })
    },

    deleteActivity: function(req, res) {
        var filter = {};
        filter.id = req.body.activity_id;
        Activity.destroy(filter).exec(function(err) {
            if (!err) {
                Activity.find().exec(function(err, activities) {
                    if (!err) {
                        res.view("editActivityListGet", { activities: activities });
                    } else {
                        res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
                    }
                })
            } else {
                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
            }
        })
    },

    createActivity: function(req, res) {
        var fbToken = "GHhfFBeF4xB7nXDNA213";
        Activity.create({
            creator: req.body.creator_id,
            fbToken: fbToken,
            date: req.body.date ? req.body.date : "",
            name: req.body.activity_name ? req.body.activity_name : "",
            details: req.body.activity_details ? req.body.activity_details : "",
            fromTime: req.body.from_time ? req.body.from_time : "",
            toTime: req.body.to_time ? req.body.to_time : "",
            type: req.body.activity_type ? req.body.activity_type : "",
            address: req.body.activity_address ? req.body.activity_address : "",
            visibility: req.body.activity_visibility ? req.body.activity_visibility : "",
            gender: req.body.activity_gender ? req.body.activity_gender : "",
            age_filter_from: req.body.activity_age_filter_from ? req.body.activity_age_filter_from : "",
            age_filter_to: req.body.activity_age_filter_to ? req.body.activity_age_filter_to : ""
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                res.view("manager", {});
            } else {
                res.badRequest(ErrorManagerHelper.customizeErrorObject(err));
            }
        })
    },

    getLogin: function(req, res) {
        res.view("login", { failed: false });
    },

    doLogin: function(req, res) {
        if (!req.param("user") || !req.param("pass") || req.param("user") == null || req.param("pass") == null) {
            res.view("login", { failed: true });
        } else {
            var filter = {};
            filter.user = req.param("user");
            filter.password = req.param("pass");
            Admin_user.find(filter).exec(function(err, user) {
                if (!err && user) {
                    if (user.length == 1) {
                        req.session.authenticated = true;
                        res.view("manager", {});
                    } else {
                        res.view("login", { failed: true });
                    }
                } else {
                    res.view("login", { failed: true });
                }
            })
        }
    },

    updateDatabaseGet: function(req, res) {
        res.view("updateDB", {});
    },

    updateDatabase: function(req, res) {
        var model = req.body.model_name;
        var attribute = req.body.model_attribute_name;
        var default_value = req.body.model_attribute_value;
        console.log("default_value: " + default_value);
        if (model !== null && typeof model !== "undefined" && attribute !== null && typeof attribute !== "undefined") {
            if (model == "Activity") {
                updateActivities(req, res, attribute);
            } else if (model == "User") {
                console.log("entro");
                updateUsers(req, res, attribute, default_value);
            } else if (model == "Location") {
                updateLocations(req, res, attribute);
            } else if (model == "Request") {
                updateRequests(req, res, attribute);
            }
        } else {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error: attributes model or attribute can´t be null." })));
        }
    },


    updateActivityModel: function(req, res) {
        Activity.find().exec(function(err, activities) {
            if (!err && activities) {
                var cantActivitiesUpdated = 0;
                for (var i = 0; i < activities.length; i++) {
                    var activityId = activities[i].id;
                    var activityName = activities[i].name;
                    activityName = activityName.toUpperCase();
                    Activity.update({ id: activityId }, { name: activityName }).exec(function(err, activityUpdated) {
                        if (!err && activityUpdated) {
                            cantActivitiesUpdated++;
                            if (cantActivitiesUpdated == activities.length) {
                                return (res.json({ cantActivitiesUpdated: cantActivitiesUpdated }));
                            }
                        } else {
                            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error updating activity name. Activity id: " + activityId })));
                        }
                    })
                }
            }
        })
    }




};


function updateUsers(req, res, attribute, default_value) {
    /*User.find().exec(function(err, users) {
      if (!err && users){
        User.update({}, {'$set': {'newAttribute' : default_value}}, false, true).exec(function(err, user){
          if (!err && user) {
            console.log("Users updated: " + user.length);
            console.log("Success");
            return(res.view("manager",{}));
          } else {
            return(res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({summary : "Error updating user."})));
          }
        })
      } else {
        return (res.badRequest(ErrorManagerHelper.customizeErrorObject(err)));
      }
    })*/
}


function updateActivities(req, res, attribute) {}

function updateLocations(req, res, attribute) {}

function updateRequests(req, res, attribute) {}