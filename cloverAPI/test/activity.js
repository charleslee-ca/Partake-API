var request = require('superagent');
var expect = require('expect.js');
var path = "http://localhost:1337";

var newActivity;
var creator;
var activities;
var requesterUser;
var firstRequesterUser;
var anotherUser;
var activity1;
var activity2;
var activity3;
var activity4;

var FB_ID1 = "thereisnowaythatthiscouldbeafacebookid1";
var FB_ID2 = "thereisnowaythatthiscouldbeafacebookid2";
var FB_ID3 = "thereisnowaythatthiscouldbeafacebookid3";
var FB_ID4 = "thereisnowaythatthiscouldbeafacebookid4";
var FB_ID5 = "thereisnowaythatthiscouldbeafacebookid5";
var FB_ID6 = "thereisnowaythatthiscouldbeafacebookid6";
var FB_ID7 = "thereisnowaythatthiscouldbeafacebookid7";
var fbToken = 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD';

describe('Create activity', function() {

    before(function(done) {
        User.destroy({}, function(e, result) {
            User.create({
                fbId: FB_ID2,
                fbToken: fbToken,
                firstName: 'Jhon',
                lastName: 'Banderas',
                gender: 'male',
                age: 18,
                default_limit_search_results: 60,
                default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                default_activities_age_from: 15,
                default_activities_age_to: 99
            }).exec(function created(err, newInstance) {
                if (!err && newInstance) {
                    creator = newInstance;
                    done();
                } else {
                    done(err);
                }
            })
        });
    })

    after(function(done) {
        done();
    })
    beforeEach(function() {

    })
    afterEach(function() {

    })


    describe('successfull scenario', function() {
        it('an Activity with all data provided is created successfully', function(done) {

            var newActivityData = {
                name: "Testy's birthday",
                details: "A really funny test",
                date: "2016-02-12",
                toTime: null,
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }

            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(201);
                    checkActivityData(res, newActivityData);
                    newActivityData
                    done();
                } else {
                    done(err);
                }
            });
        })
    })

    describe('successfull scenario', function() {
        it('an Activity with no optional data provided is created successfully', function(done) {

            var newActivityData = {
                name: "Testy's birthday2",
                details: "A really funny test",
                date: "2016-02-12",
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(201);
                    newActivityData.toTime = null;
                    newActivityData.fromTime = "Afternoon";
                    checkActivityData(res, newActivityData);
                    done();
                } else {
                    done(err);
                }
            });
        })
    })

    describe('Missing activity name', function() {
        it('Should throw 400 error', function(done) {
            var newActivityData = {
                details: "A really funny test",
                date: "2016-02-12",
                creator: creator.id,
                fromTime: "Afternoon",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    expect(res.body.error).to.equal("E_BUSSINESS_LOGIC");
                    done();
                } else {
                    done(err);
                }
            });
        })
    })

    describe('Wrong date', function() {
        it('Should throw 400 error', function(done) {
            var newActivityData = {
                name: "Party at Testy house",
                details: "A really funny test",
                date: "2016 March",
                fromTime: "Afternoon",
                creator: creator.id,
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    expect(res.body.error).to.equal("E_BUSSINESS_LOGIC");
                    done();
                } else {
                    done(err);
                }
            });
        })
    })

    describe('Wrong address', function() {
        it('an Activity is not created because the address passed as parameter is not correct', function(done) {

            var newActivityData = {
                name: "AddressNotCorrect1",
                details: "A really funny test",
                date: "2016-02-12",
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "thisisnotacorrectaddress",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    request.get(path + "/activity?lat=33.640302&lon=-117.769442").set("fbtoken", fbToken).end(function(err, res) {
                        if (!err && res) {
                            expect(activityInJsonCollection(res.body, "thisisnotacorrectaddress")).to.be.ok();
                            done();
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Correct activity created and obtained', function() {

        it('Should create and get the activity with the correct information', function(done) {

            var newActivityData = {
                name: "ACTIVITY TO COMPARE",
                details: "Created and Obtained",
                date: "2016-02-12",
                toTime: "12:12 PM",
                fromTime: "3:00 AM",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(201);
                    request.get(path + "/activity/" + res.body.id).set("fbtoken", fbToken).end(function(err, res) {
                        if (!err && res) {
                            expect(res).to.exist;
                            expect(res.status).to.equal(200);
                            var data = newActivityData;
                            expect(res.body.name).to.equal(data.name);
                            expect(res.body.details).to.equal(data.details);
                            expect(res.body.date).to.equal(DateHelper.createUTCDate(data.date).toISOString());
                            expect(res.body.toTime).to.equal(data.toTime);
                            expect(res.body.creator.id).to.equal(creator.id);
                            expect(res.body.fromTime).to.equal(data.fromTime);
                            done();
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Correct activity created and try to obtain an incorrect one', function() {
        it('Should create and not get the activity with the wrong id throwing error 404', function(done) {
            var newActivityData = {
                name: "Activity",
                details: "Created and not Obtained",
                date: "2016-02-12",
                toTime: "00:12 AM",
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(201);
                    var incorrectId = "thisisnotacorrectid";
                    request.get(path + "/activity/" + incorrectId).set("fbtoken", fbToken).end(function(err, res) {
                        if (!err && res) {
                            expect(res).to.exist;
                            expect(res.status).to.equal(404);
                            done();
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    })

});


describe('List activities', function() {

    before(function(done) {
        done();
    })

    after(function(done) {
        done();
    })
    beforeEach(function() {

    })
    afterEach(function() {

    })

    describe('successfull scenario', function() {
        it('All activities are obtained', function(done) {
            var newActivityData = {
                name: "Activity",
                details: "Created and not Obtained",
                date: "2016-02-12",
                toTime: "00:12 PM",
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 1,
                age_filter_to: 90,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(201);
                    request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=25&userGender=male&fbId=" + FB_ID2).set("fbtoken", fbToken).end(function(err, res) {
                        if (!err && res) {
                            expect(res).to.exist;
                            expect(res.status).to.equal(200);
                            expect(res.body.length).to.be.greaterThan(0);
                            expect(res.body[0].location.stateShort).to.equal("DC");
                            done();
                        } else {
                            done(false);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    })


    describe('Check for activities filtered by type and range of dates', function() {
        it('Should list activities of type "Sports" and date in the range of dates', function(done) {
            var newActivityData = {
                name: "Activity",
                details: "Created and not Obtained",
                date: "2015-07-12",
                toTime: "00:12 AM",
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 1,
                age_filter_to: 90,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            };

            var newActivityData2 = {
                name: "Activity2",
                details: "Created and not Obtained",
                date: "2015-07-12",
                toTime: "00:12 AM",
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Recreation",
                address: "Washington",
                age_filter_from: 1,
                age_filter_to: 90,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err1, res1) {
                request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData2).end(function(err2, res2) {

                    if (!err2 && res2) {
                        expect(res2).to.exist;
                        expect(res2.status).to.equal(201);
                        request.get(path + "/activity?lat=38.907192&lon=-77.036871&type1=Sports&type2=Recreation&dayStart=0&dayEnd=365&userAge=25&userGender=male&fbId=" + FB_ID2 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, res) {

                            if (!err && res) {
                                expect(res).to.exist;
                                expect(res.status).to.equal(200);
                                expect(res.body).to.not.be.empty();
                                expect(res.body.length).to.be.greaterThan(0);
                                for (var i = 0; i < res.body.length; i++) {
                                    if (res.body[i]["type"] != "Sports" && res.body[i]["type"] != "Recreation") {
                                        expect(0).to.be.equal(1);
                                    }
                                }
                                done();
                            } else {
                                done(false);
                            }
                        })
                    }
                })
            })
        })
    })


    describe('Check for activities filtered by type and range of dates', function() {
        it('Should not list activities of type "Sports" and date out the range of dates', function(done) {
            request.get(path + "/activity?lat=33.640302&lon=-117.769442&type1=Sports&dayStart=0&dayEnd=5&userAge=25&userGender=male&fbId=" + FB_ID2 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.body).to.have.length(0);
                    done();
                } else {
                    done(false);
                }
            });
        });
    });


    describe("Delete one of the activities in the db.", function() {
        it("Should delete an activity from the db", function(done) {
            Activity.find().populate("creator").exec(function(err, activities) {
                if (!err & activities && activities.length > 0) {
                    console.log('=========' + activities[0]);
                    var activityIdToDelete = activities[0].id;
                    var activityCreator = activities[0].creator.fbId;
                    request.del(path + "/activity/" + activityIdToDelete).set("fbtoken", fbToken).send({ requesterFbId: activityCreator }).end(function(err, res) {
                        if (!err && res) {
                            Activity.find({ id: activityIdToDelete }).exec(function(err, activity) {
                                if (!err && activity) {
                                    expect(activity).to.exist;
                                    expect(activity).to.have.length(1);
                                    expect(activity[0].deleted).to.equal(true);
                                    done();
                                } else {
                                    done(err);
                                }
                            })
                        } else {
                            done(err);
                        }
                    })

                } else {
                    done(err);
                }
            })
        })
    })


    describe("Delete one of the activities in the db.", function() {
        it("Should not delete an activity from the db because the requester is not the same user as the creator.", function(done) {
            var newActivityData = {
                name: "Activity",
                details: "Created and not Obtained",
                date: "2016-02-12",
                toTime: "00:12 AM",
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 1,
                age_filter_to: 90,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            };
            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                var activityIdToDelete = res.body.id;
                request.del(path + "/activity/" + activityIdToDelete).set("fbtoken", fbToken).send({ requesterFbId: "1422674734713251" }).end(function(err, res) {
                    if (!err && res) {
                        expect(res.status).to.equal(400);
                        Activity.find({ id: activityIdToDelete }).exec(function(err, activity) {
                            if (!err && activity) {
                                expect(activity).to.exist;
                                expect(activity).to.have.length(1);
                                expect(activity[0].deleted).to.equal(false);
                                done();
                            } else {
                                done(err);
                            }
                        })
                    } else {
                        done(err);
                    }
                })
            })
        })
    })



});






describe('Test service to get attendance list for an activity', function() {

    before(function(done) {
        User.create({
            fbId: FB_ID4,
            fbToken: fbToken,
            firstName: 'Martin',
            lastName: 'Jolio',
            gender: 'male',
            age: 18,
            default_limit_search_results: 60,
            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
            default_activities_age_from: 15,
            default_activities_age_to: 99
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                requesterUser = newInstance;
                Activity.create({
                    name: "Activity for male",
                    details: "Good",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: creator.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: 91,
                    age_filter_to: 99,
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.MALE,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                }).exec(function created(err, newInstance) {
                    if (!err && newInstance) {
                        newActivity = newInstance;
                        done();
                    } else {
                        console.log("Error: " + err);
                        done(err);
                    }
                })
            } else {
                done(err);
            }
        })
    })


    after(function(done) {
        User.destroy({ id: requesterUser.id }).exec(function(err) {
            if (err) {
                done(err);
            } else {
                done();
            }
        })
    })

    beforeEach(function() {})

    afterEach(function() {})


    describe('Test that there are is only one attendance to a created activity', function() {
        it('Must return only the creator of the activity.', function(done) {
            var newActivityData = {
                name: "Super attendance",
                details: "How many people?",
                date: "2016-02-12",
                toTime: null,
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }

            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    request.get(path + "/activity/attendance?id=" + res.body.id).set("fbtoken", fbToken).end(function(err, users) {
                        if (!err && users) {
                            expect(users.body).to.exist;
                            expect(users.body.users).to.exist;
                            expect(users.body.users).to.not.be.empty();
                            expect(users.body.users.length).to.be.equal(1);
                            expect(users.body.users[0].id).to.be.equal(creator.id);
                            done();
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    });

    describe('Test that there are two attendance to a created activity', function() {
        it('Must return the creator and another user that are attending to the activity.', function(done) {
            var newActivityData = {
                name: "Super attendance 2",
                details: "How many people 2?",
                date: "2016-02-12",
                toTime: null,
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: "15",
                age_filter_to: "30",
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            };

            var newRequestData = {
                note: "I would like to join you!",
                requesterFbId: requesterUser.fbId,
                creatorFbId: creator.fbId
            };

            var acceptRequestInvitationData = {
                id: ""
            };

            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    newRequestData.activity = res.body.id;
                    //newRequestData.requester = requesterUser.id;
                    request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, requestCreated) {
                        if (!err && requestCreated) {
                            acceptRequestInvitationData.id = requestCreated.body[0].requestId;
                            request.post(path + "/request/accept").set("fbtoken", fbToken).send(acceptRequestInvitationData).end(function(err, acceptedRequest) {
                                if (!err && acceptedRequest) {
                                    request.get(path + "/activity/attendance?id=" + newRequestData.activity).set("fbtoken", fbToken).end(function(err, users) {
                                        if (!err && users) {
                                            expect(users.body).to.exist;
                                            expect(users.body.users).to.exist;
                                            expect(users.body.users).to.not.be.empty();
                                            expect(users.body.users.length).to.be.equal(2);
                                            expect(users.body.users[0].id).to.be.equal(creator.id);
                                            expect(users.body.users[1].id).to.be.equal(requesterUser.id);
                                            done();
                                        } else {
                                            done(err);
                                        }
                                    })
                                } else {
                                    done(err);
                                }
                            })
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    });


});



describe('Test service to edit an activity', function() {

    before(function(done) {
        User.create({
            fbId: FB_ID4,
            fbToken: fbToken,
            firstName: 'Martin',
            lastName: 'Jolio',
            gender: 'male',
            age: 18,
            default_limit_search_results: 60,
            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
            default_activities_age_from: 15,
            default_activities_age_to: 99
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                requesterUser = newInstance;
                done();
            } else {
                console.log("Error: " + err);
                done(err);
            }
        })
    })

    after(function(done) {
        User.destroy({ id: requesterUser.id }).exec(function(err) {
            if (err) {
                done(err);
            } else {
                done();
            }
        })
    })

    beforeEach(function() {})

    afterEach(function() {})



    describe('Test to edit an activity without editing the address.', function() {
        it('Must return the activity with edited data fields with new values.', function(done) {
            var createActivityData = {
                name: "Super attendance",
                details: "How many people?",
                date: "2016-02-12",
                toTime: null,
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            };

            var editActivityData = {
                name: "Edited Activity",
                details: "Edited without address",
                date: "2016-02-25",
                toTime: "12:09 AM",
                fromTime: "12:30 AM",
                creator: creator.id,
                type: "Sports",
                age_filter_from: 16,
                age_filter_to: 35,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: false,
                location: "",
                id: ""
            };

            request.post(path + "/activity").set("fbtoken", fbToken).send(createActivityData).end(function(err, activityCreated) {
                if (!err && activityCreated) {
                    editActivityData.id = activityCreated.body.id;
                    editActivityData.location = activityCreated.body.location;
                    request.post(path + "/activity/edit").set("fbtoken", fbToken).send(editActivityData).end(function(err, activityEdited) {
                        if (!err && activityEdited) {
                            expect(activityEdited.body).to.exist;
                            request.get(path + "/activity/" + activityCreated.body.id).set("fbtoken", fbToken).end(function(err, activity) {
                                if (!err && activity) {
                                    checkActivityData(activity, editActivityData, "edit");
                                    done();
                                } else {
                                    done(err);
                                }
                            })
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    });


    describe('Test to edit an activity editing the address.', function() {
        it('Must return the activity with edited data fields with new values.', function(done) {

            var createActivityData = {
                name: "Super attendance",
                details: "How many people?",
                date: "2016-02-12",
                toTime: null,
                fromTime: "Afternoon",
                creator: creator.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            };

            var editActivityData = {
                name: "Edited Activity",
                details: "Edited WITH address edited",
                date: "2016-02-25",
                toTime: "12:09 AM",
                fromTime: "12:30 AM",
                creator: creator.id,
                type: "Sports",
                age_filter_from: 16,
                age_filter_to: 35,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: false,
                address_edited: "yes",
                address: "Denver",
                location: ""

            };

            request.post(path + "/activity").set("fbtoken", fbToken).send(createActivityData).end(function(err, activityCreated) {
                if (!err && activityCreated) {
                    editActivityData.id = activityCreated.body.id;
                    editActivityData.location = activityCreated.body.location;
                    request.post(path + "/activity/edit").set("fbtoken", fbToken).send(editActivityData).end(function(err, activityEdited) {
                        if (!err && activityEdited) {
                            expect(activityEdited.body).to.exist;
                            request.get(path + "/activity/" + activityCreated.body.id).set("fbtoken", fbToken).end(function(err, activity) {
                                if (!err && activity) {
                                    editActivityData.location.id += 1; //Because address was edited so a new location is created.
                                    checkActivityData(activity, editActivityData, "edit");
                                    done();
                                } else {
                                    done(err);
                                }
                            })
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    });

});

describe('Test service to get all activities created by a user', function() {

    before(function(done) {
        User.create({
            fbId: FB_ID4,
            fbToken: fbToken,
            firstName: 'Martin',
            lastName: 'Jolio',
            gender: 'male',
            age: 18,
            default_limit_search_results: 60,
            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
            default_activities_age_from: 15,
            default_activities_age_to: 99
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                requesterUser = newInstance;
                done();
            } else {
                console.log("Error: " + err);
                done(err);
            }
        })
    })

    after(function(done) {
        User.destroy({ id: requesterUser.id }).exec(function(err) {
            if (err) {
                done(err);
            } else {
                done();
            }
        })
    })

    beforeEach(function() {})

    afterEach(function() {})



    describe('Test to retrieve all activities created by a user.', function() {
        it('Must return no activity because the user has not created any.', function(done) {
            request.get(path + "/activity/createdByUser?creator=" + requesterUser.id).set("fbtoken", fbToken).end(function(err, activityCreated) {
                if (!err && activityCreated) {
                    expect(activityCreated.body).to.exist;
                    expect(activityCreated.body.length).to.be.equal(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Test to retrieve all activities created by a user.', function() {
        it('Must return one activity because the use has created one.', function(done) {
            var newActivityData = {
                name: "Created by user",
                details: "Good test",
                date: "2016-02-12",
                toTime: null,
                fromTime: "Afternoon",
                creator: requesterUser.id,
                type: "Sports",
                address: "Washington",
                age_filter_from: 15,
                age_filter_to: 30,
                gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                isAtendeeVisible: true
            }

            request.post(path + "/activity").set("fbtoken", fbToken).send(newActivityData).end(function(err, res) {
                if (!err && res) {
                    request.get(path + "/activity/createdByUser?creator=" + requesterUser.id).set("fbtoken", fbToken).end(function(err, activityCreated) {
                        if (!err && activityCreated) {
                            expect(activityCreated.body).to.exist;
                            expect(activityCreated.body.length).to.be.equal(1);
                            expect(activityCreated.body[0].id).to.be.equal(res.body.id)
                            done();
                        } else {
                            done(err);
                        }
                    })
                } else {
                    done(err);
                }
            })
        })
    })



});


describe('Test service to get activities filtered by activity privacy and default preferences', function() {

    before(function(done) {
        Activity.create({
            name: "Activity for male",
            details: "Good",
            date: "2016-02-12",
            toTime: null,
            fromTime: "Afternoon",
            creator: creator.id,
            type: "Sports",
            address: "Washington",
            age_filter_from: 91,
            age_filter_to: 99,
            gender: sails.config.constants.ACTIVITY_GENDER_FILTER.MALE,
            visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
            isAtendeeVisible: true
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                activity1 = newInstance;
                Activity.create({
                    name: "Activity for male",
                    details: "Good",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: creator.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: 91,
                    age_filter_to: 99,
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.FEMALE,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                }).exec(function created(err, newInstance) {
                    if (!err && newInstance) {
                        activity2 = newInstance;
                        User.create({
                            fbId: FB_ID5,
                            fbToken: fbToken,
                            firstName: 'Martin',
                            lastName: 'Koko',
                            gender: 'male',
                            age: 91,
                            default_limit_search_results: 60,
                            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.MALE,
                            default_activities_age_from: 15,
                            default_activities_age_to: 99
                        }).exec(function created(err, newInstance) {
                            if (!err && newInstance) {
                                anotherUser = newInstance;
                                User.create({
                                    fbId: FB_ID7,
                                    fbToken: fbToken,
                                    firstName: 'Martin',
                                    lastName: 'Koko',
                                    gender: 'male',
                                    age: 91,
                                    default_limit_search_results: 60,
                                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                                    default_activities_age_from: 15,
                                    default_activities_age_to: 99
                                }).exec(function created(err, newInstance) {
                                    if (!err && newInstance) {
                                        done();
                                    } else {
                                        done(err);
                                    }
                                })
                            } else {
                                done(err);
                            }
                        })
                    } else {
                        done(err);
                    }
                })
            } else {
                done(err);
            }
        })
    })

    after(function(done) {
        User.destroy({ id: anotherUser.id }).exec(function(err) {
            if (err) {
                done(err);
            } else {
                done();
            }
        })
    })

    beforeEach(function() {})

    afterEach(function() {})



    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must return two activities because its privacy is by gender male and age equal to ageFrom.', function(done) {
            var newDataUser = {
                default_activities_age_from: 15,
                default_activities_age_to: 99
            };
            User.update({ fbId: FB_ID5 }, newDataUser).exec(function(err, userUpdated) {
                request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=91&userGender=male&fbId=" + FB_ID5 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                    if (!err && activities) {
                        for (var i = 0; i < activities.body.length; i++) {
                            console.log("Activity[" + i + "]: " + activities.body[i].id);
                        }
                        expect(activities.body).to.exist;
                        expect(activities.status).to.equal(200);
                        expect(activities.body.length).to.be.equal(2);

                        //To comprobate that the three activities are correct this code can be uncommented.
                        /*console.log("CANT ACTIVITIES: " + activities.body.length);
                        for (var i = 0; i < activities.body.length; i++) {
                          console.log("Name[" + i + "]: " + activities.body[i].name);
                          console.log("Gender created by[" + i + "]: " + activities.body[i].gender);
                        }*/
                        for (var i = 0; i < activities.body.length; i++) {
                            expect(activities.body[i].name).to.be.equal("Activity for male");
                            expect(activities.body[i].details).to.be.equal("Good");
                            expect(activities.body[i].gender).to.be.equal("male");
                        }
                        done();
                    } else {
                        done(err);
                    }
                })
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must return two activities because its privacy is by gender male and age between 91 and 99.', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=95&userGender=male&fbId=" + FB_ID5 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities.body).to.exist;
                    expect(activities.status).to.equal(200);
                    expect(activities.body.length).to.be.equal(2);
                    for (var i = 0; i < activities.body.length; i++) {
                        expect(activities.body[i].name).to.be.equal("Activity for male");
                        expect(activities.body[i].details).to.be.equal("Good");
                        expect(activities.body[i].gender).to.be.equal("male");
                    }
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must return two activities because its privacy is by gender male and age equal to ageTo.', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=99&userGender=male&fbId=" + FB_ID5 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities.body).to.exist;
                    expect(activities.status).to.equal(200);
                    expect(activities.body.length).to.be.equal(2);
                    for (var i = 0; i < activities.body.length; i++) {
                        expect(activities.body[i].name).to.be.equal("Activity for male");
                        expect(activities.body[i].details).to.be.equal("Good");
                        expect(activities.body[i].gender).to.be.equal("male");
                    }
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must not return an activity because its privacy is by gender male and age is below ageFrom.', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=0&userGender=male&fbId=" + FB_ID5 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities.body).to.exist;
                    expect(activities.status).to.equal(200);
                    expect(activities.body.length).to.be.equal(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must not return an activity because its privacy is by gender male and age is above ageTo.', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=100&userGender=male&fbId=" + FB_ID5 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities.body).to.exist;
                    expect(activities.status).to.equal(200);
                    expect(activities.body.length).to.be.equal(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must not return an activity because its privacy is by gender male.', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=100&userGender=female&fbId=" + FB_ID5 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities.body).to.exist;
                    expect(activities.status).to.equal(200);
                    expect(activities.body.length).to.be.equal(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must return an activity because its default preferences are in the correct age range.', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=95&userGender=male&fbId=" + FB_ID7 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities.body).to.exist;
                    expect(activities.status).to.equal(200);
                    expect(activities.body.length).to.be.equal(2);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must not return an activity because its default preferences are not in the correct age range.', function(done) {
            var newDataUser = {
                default_activities_age_from: 9,
                default_activities_age_to: 17
            };

            User.update({ fbId: FB_ID7 }, newDataUser).exec(function(err, userUpdated) {
                request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=95&userGender=male&fbId=" + FB_ID7 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                    if (!err && activities) {
                        expect(activities.body).to.exist;
                        expect(activities.status).to.equal(200);
                        expect(activities.body.length).to.be.equal(0);
                        done();
                    } else {
                        done(err);
                    }
                })
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must not return an activity because its default preferences are not in the correct age range.', function(done) {
            var newDataUser = {
                default_activities_age_from: 100,
                default_activities_age_to: 101
            };

            User.update({ fbId: FB_ID7 }, newDataUser).exec(function(err, userUpdated) {
                request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=95&userGender=male&fbId=" + FB_ID7 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                    if (!err && activities) {
                        expect(activities.body).to.exist;
                        expect(activities.status).to.equal(200);
                        expect(activities.body.length).to.be.equal(0);
                        done();
                    } else {
                        done(err);
                    }
                })
            })
        })
    })

    describe('Test to retrieve the activity that the user can see.', function() {
        it('Must return an activity because its default preferences are in the correct age range.', function(done) {
            var newDataUser = {
                default_activities_age_from: 18,
                default_activities_age_to: 101
            };

            User.update({ fbId: FB_ID7 }, newDataUser).exec(function(err, userUpdated) {
                request.get(path + "/activity?lat=38.907192&lon=-77.036871&userAge=95&userGender=male&fbId=" + FB_ID7 + "&page=0&index=0").set("fbtoken", fbToken).end(function(err, activities) {
                    if (!err && activities) {
                        expect(activities.body).to.exist;
                        expect(activities.status).to.equal(200);
                        expect(activities.body.length).to.be.equal(2);
                        done();
                    } else {
                        done(err);
                    }
                })
            })
        })
    })


});




describe('GET /activity/findByQuery', function() {

    var jennifer = null;
    var susan = null;
    var mark = null;
    var lise = null;
    var susanActivity = null;
    var markActivity = null;

    before(function(done) {
        Location.destroy()
            .then(function() {
                return Activity.destroy();
            })
            .then(function() {
                return User.destroy();
            })
            .then(function() {
                return User.create({
                    fbId: '1422674734713252',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Lisa',
                    lastName: 'Amibbgeidibb Shepardson',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                });
            })
            .then(function(newInstance) {
                lisa = newInstance;

                return User.create({
                    fbId: '1422674734713251',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Jennifer',
                    lastName: 'Amichegdedde Thurnescu',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                });
            })
            .then(function(newInstance) {
                jennifer = newInstance;

                return User.create({
                    fbId: '1386069875045982',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Susan',
                    lastName: 'Amibhidhaeaa Liberg',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                susan = newInstance;

                return Activity.create({
                    name: "Susan Activity",
                    details: "Susan Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: susan.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                susanActivity = newInstance;

                return User.create({
                    fbId: '1392676184383201',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Mark',
                    lastName: 'Amibbdihfced Liwitz',
                    gender: 'male',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                mark = newInstance;

                return Activity.create({
                    name: "Testy's birthday2",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: mark.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {

                return Activity.create({
                    name: "Columbia",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: mark.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {

                return Activity.create({
                    name: "Testy's",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: mark.id,
                    type: "Sports",
                    address: "District of Columbia, United States",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                markActivity = newInstance;

                done();
            })
            .catch(function(err) {
                console.log(err);
            })
    })

    after(function(done) {
        done();
    })

    beforeEach(function() {})

    afterEach(function() {})

    describe('There are no activities with name or location city containing "Minnee"', function() {
        it('must return no activities', function(done) {
            request.get(path + '/activity/findByQuery?fbId=' + jennifer.fbId).set('fbtoken', jennifer.fbToken).query({ q: 'Minnee', limit: 5, offset: 0 }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.activities.length).to.be.equal(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('There are activities with city containing "Columbia"', function() {
        it('must return them all', function(done) {
            request.get(path + '/activity/findByQuery?fbId=' + jennifer.fbId).set('fbtoken', jennifer.fbToken).query({ q: 'Columbia', limit: 10, offset: 0 }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.activities.length).to.be.greaterThan(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('There are activities with city containing "Columbia"', function() {
        it('must return just one using limit 1', function(done) {
            request.get(path + '/activity/findByQuery?fbId=' + jennifer.fbId).set('fbtoken', jennifer.fbToken).query({ q: 'Columbia', limit: 1, offset: 0 }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.activities.length).to.be.equal(1);
                    expect(res.body.activities[0].location.city).to.be.equal('District of Columbia');
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Activities that matches only for name "Testy"', function() {
        it('Return them all', function(done) {
            request.get(path + '/activity/findByQuery?fbId=' + jennifer.fbId).set('fbtoken', jennifer.fbToken).query({ q: 'Testy', limit: 1, offset: 0 }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.activities.length).to.be.greaterThan(0);
                    expect(res.body.activities[0].name).to.be.equal('Testy\'s');
                    done();
                } else {
                    done(err);
                }
            })
        })
    })
});

describe('GET /activity/findByKeywords', function() {

    var jennifer = null;
    var susan = null;
    var mark = null;
    var susanActivity = null;
    var markActivity = null;

    before(function(done) {

        Location.destroy()
            .then(function() {
                return Activity.destroy();
            })
            .then(function() {
                return User.destroy();
            })
            .then(function(newInstance) {
                return User.create({
                    fbId: '1379209252401920',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Jennifer',
                    lastName: 'Amichegdedde Thurnescu',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                });
            })
            .then(function(newInstance) {
                jennifer = newInstance;

                return User.create({
                    fbId: '1386069875045982',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Susan',
                    lastName: 'Amibhidhaeaa Liberg',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                susan = newInstance;

                return Activity.create({
                    name: "Susan Activity",
                    details: "Susan Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: susan.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: 15,
                    age_filter_to: 30,
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                susanActivity = newInstance;

                return User.create({
                    fbId: '1392676184383201',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Mark',
                    lastName: 'Amibbdihfced Liwitz',
                    gender: 'male',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                mark = newInstance;

                return Activity.create({
                    name: "Testy's birthday2",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: mark.id,
                    type: "Sports",
                    address: "3525 State Street, Santa Barbara, CA",
                    age_filter_from: 15,
                    age_filter_to: 30,
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {

                return Activity.create({
                    name: "Columbia",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: mark.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {

                return Activity.create({
                    name: "Testy's",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: mark.id,
                    type: "Sports",
                    address: "District of Columbia, United States",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                markActivity = newInstance;

                done();
            })
            .catch(function(err) {
                console.log(err);
            })
    })

    after(function(done) {
        done();
    })

    beforeEach(function() {})

    afterEach(function() {})

    describe('There are no activities with name or location containing "Minnee"', function() {
        it('must return no activities', function(done) {
            request.get(path + '/activity/findByKeywords').set('fbtoken', jennifer.fbToken).query({ q: 'Minnee' }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.resultKeywords.length).to.be.equal(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('There are activities with city containing "Columbia" on their city or state', function() {
        it('must return them all', function(done) {
            request.get(path + '/activity/findByKeywords').set('fbtoken', jennifer.fbToken).query({ q: 'Columbia' }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.resultKeywords.length).to.be.greaterThan(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('There are activities with the address containing "State"', function() {
        it('must return just one using limit 1', function(done) {
            request.get(path + '/activity/findByKeywords').set('fbtoken', jennifer.fbToken).query({ q: 'State' }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.resultKeywords.length).to.be.equal(1);
                    expect(res.body.resultKeywords[0]).to.be.equal('3525 State Street, Santa Barbara, CA 93105, USA');
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Activities that matches only for name "Testy"', function() {
        it('Return them all', function(done) {
            request.get(path + '/activity/findByKeywords').set('fbtoken', jennifer.fbToken).query({ q: 'Testy' }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.resultKeywords.length).to.be.equal(2);
                    expect(res.body.resultKeywords[0]).to.be.equal('Testy\'s birthday2');
                    done();
                } else {
                    done(err);
                }
            })
        })
    })
});

describe('List activities filtered by createdBy', function() {

    var jennifer = null;
    var susan = null;
    var mark = null;
    var lise = null;
    var susanActivity = null;
    var markActivity = null;

    before(function(done) {

        Activity.destroy()
            .then(function() {
                return User.destroy();
            })
            .then(function() {
                return User.create({
                    fbId: '1391181267866112',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Lisa',
                    lastName: 'Amibbgeidibb Shepardson',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                });
            })
            .then(function(newInstance) {
                lisa = newInstance;

                return User.create({
                    fbId: '1379209252401920',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Jennifer',
                    lastName: 'Amichegdedde Thurnescu',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                });
            })
            .then(function(newInstance) {
                jennifer = newInstance;

                return User.create({
                    fbId: '10101268076755827',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Susan',
                    lastName: 'Amibhidhaeaa Liberg',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                susan = newInstance;

                return Activity.create({
                    name: "Susan Activity",
                    details: "Susan Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: susan.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: 1,
                    age_filter_to: 90,
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                susanActivity = newInstance;

                return User.create({
                    fbId: '1392676184383201',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Mark',
                    lastName: 'Amibbdihfced Liwitz',
                    gender: 'male',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                mark = newInstance;

                return Activity.create({
                    name: "Mark Activity",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: mark.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: 1,
                    age_filter_to: 90,
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                markActivity = newInstance;

                done();
            })
            .catch(function(err) {
                console.log(err);
            })

        // Friendships
        // Jennifer friends: Susan Amibhidhaeaa Liberg
        // Susan friends: Susan Amibhidhaeaa Liberg, Mark Amibbdihfced Liwitz
        // Mark friends: Susan Amibhidhaeaa Liberg

    })

    after(function(done) {
        done();
    })
    beforeEach(function() {

    })
    afterEach(function() {

    })

    describe('Everyone parameter on request', function() {
        it('All activities are obtained', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&createdBy=everyone&userAge=25&userGender=male&fbId=" + jennifer.fbId + "&page=0&index=0").set("fbtoken", jennifer.fbToken).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.length).to.be.equal(2);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Friends parameter on request with the friend having an activity', function() {
        it('must return only the activity created by Susan', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&createdBy=friends&userAge=25&userGender=male&fbId=" + jennifer.fbId + "&page=0&index=0").set("fbtoken", jennifer.fbToken).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.length).to.be.equal(1);
                    expect(res.body[0].creator.fbId).to.be.equal(susan.fbId);
                    expect(res.body[0].name).to.be.equal(susanActivity.name);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Friends parameter on request and a user that does not have friends', function() {
        it('must return only the activity created by Susan', function(done) {
            request.get(path + "/activity?lat=38.907192&lon=-77.036871&createdBy=friends&userAge=25&userGender=female&fbId=" + lisa.fbId + "&page=0&index=0").set("fbtoken", lisa.fbToken).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.length).to.be.equal(0);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    // describe('Friends of friends parameter on request', function(){
    //   it('must return one activity related to Mark', function(done){
    //     request.get(path + "/activity?lat=38.907192&lon=-77.036871&createdBy=friends_of_friends").set("fbtoken", jennifer.fbToken).end(function(err, res) {
    //       if (!err && res) {
    //         expect(res).to.exist;
    //         expect(res.status).to.equal(200);
    //         expect(res.body.length).to.be.equal(1);
    //         expect(res.body[0].creator.fbId).to.be.equal(mark.fbId);
    //         expect(res.body[0].name).to.be.equal(markActivity.name);
    //         done();
    //       } else {
    //         done(err);
    //       }
    //     })
    //   })
    // })
});



describe('List activities using block user service.', function() {

    var jennifer = null;
    var susan = null;
    var mark = null;
    var lise = null;
    var susanActivity = null;
    var markActivity = null;

    before(function(done) {

        Location.destroy()
            .then(function() {
                return Activity.destroy();
            })
            .then(function() {
                return User.destroy();
            })
            .then(function() {
                return User.create({
                    fbId: '1391181267866113',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Lisa',
                    lastName: 'Amibbgeidibb Shepardson',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                });
            })
            .then(function(newInstance) {
                lisa = newInstance;

                return User.create({
                    fbId: '1379209252401920',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Jennifer',
                    lastName: 'Amichegdedde Thurnescu',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99,
                    blocked_users: [lisa.fbId]
                });
            })
            .then(function(newInstance) {
                jennifer = newInstance;

                return User.create({
                    fbId: '1386069875045982',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Susan',
                    lastName: 'Amibhidhaeaa Liberg',
                    gender: 'female',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                susan = newInstance;

                return Activity.create({
                    name: "Susan Activity",
                    details: "Susan Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: jennifer.id,
                    type: "Sports",
                    address: "Dupont Circle, Washington, DC, USA",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                susanActivity = newInstance;

                return User.create({
                    fbId: '1392676184383201',
                    fbToken: 'CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD',
                    firstName: 'Mark',
                    lastName: 'Amibbdihfced Liwitz',
                    gender: 'male',
                    age: 18,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                })
            })
            .then(function(newInstance) {
                mark = newInstance;

                return Activity.create({
                    name: "Testy's birthday2",
                    details: "Mark Activity",
                    date: "2016-02-12",
                    toTime: null,
                    fromTime: "Afternoon",
                    creator: jennifer.id,
                    type: "Sports",
                    address: "Washington",
                    age_filter_from: "15",
                    age_filter_to: "30",
                    gender: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                    isAtendeeVisible: true
                })
            })
            .then(function(newInstance) {
                jenniferActivity = newInstance;
                done();
            })
            .catch(function(err) {
                console.log(err);
            })
    })

    after(function(done) {
        done();
    })

    beforeEach(function() {})

    afterEach(function() {})



    describe('Return activities: block user filter.', function() {
        it('Must return activities included one created by Jennifer.', function(done) {
            request.get(path + "/activity?lat=38.9096936&lon=-77.043339&userAge=25&userGender=male&fbId=" + susan.fbId).set("fbtoken", jennifer.fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities).to.exist;
                    expect(activities.status).to.equal(200);
                    var found = false;
                    for (var i = 0;
                        (i < activities.body.length && !found); i++) {
                        if (activities.body[i].creator.id == jennifer.id) {
                            found = true;
                        }
                    }
                    if (found) {
                        done();
                    } else {
                        done(false);
                    }
                } else {
                    done(err);
                }
            })
        })
    })


    describe('Return activities: block user filter.', function() {
        it('Must not return activities included created by Jennifer because Jeniffer has blocked Lisa.', function(done) {
            request.get(path + "/activity?lat=38.9096936&lon=-77.043339&userAge=25&userGender=male&fbId=" + lisa.fbId).set("fbtoken", jennifer.fbToken).end(function(err, activities) {
                if (!err && activities) {
                    expect(activities).to.exist;
                    expect(activities.status).to.equal(200);
                    var found = false;
                    for (var i = 0;
                        (i < activities.body.length && !found); i++) {
                        if (activities.body[i].creator.id == jennifer.id) {
                            found = true;
                        }
                    }
                    if (!found) {
                        done();
                    } else {
                        done(false);
                    }
                } else {
                    done(err);
                }
            })
        })
    })


});






function checkActivityData(res, data, edit) {
    expect(res.body.name).to.equal(data.name);
    expect(res.body.details).to.equal(data.details);
    expect(res.body.date).to.equal(DateHelper.createUTCDate(data.date).toISOString());
    expect(res.body.toTime).to.equal(data.toTime);
    if (edit == "edit") {
        expect(res.body.creator.id).to.equal(creator.id);
        if (data["address_edited"]) {
            expect(res.body.location.id).not.equal(data.location.id);
        } else {
            expect(res.body.location.id).to.equal(data.location.id);
        }
    } else {
        expect(res.body.creator.id).to.equal(creator.id);
    }
    expect(res.body.fromTime).to.equal(data.fromTime);
    expect(res.body.type).to.equal(data.type);
    expect(res.body.visibility).to.equal(data.visibility);
    expect(res.body.isAtendeeVisible).to.equal(data.isAtendeeVisible);
    expect(res.body.gender).to.equal(data.gender);
    expect(res.body.age_filter_from).to.equal(data.age_filter_from);
    expect(res.body.age_filter_to).to.equal(data.age_filter_to);
}

function activityInJsonCollection(jsonCollection, address) {
    for (var i = 0; i < jsonCollection.length; i++) {
        var activity = jsonCollection[i];
        var location = activity["location"];
        if ((typeof location != "undefined") && (location["formatted_address"].indexOf(address) != -1)) {
            return false;
        }
    }
    return true;
}