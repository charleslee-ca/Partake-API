var request = require('superagent');
var expect = require('expect.js');
var path = "http://localhost:1337";
var FB_ID2 = "thereisnowaythatthiscouldbeafacebookid2";
var FB_ID3 = "thereisnowaythatthiscouldbeafacebookid6";
var fbToken = 'GHhfFBeF4xB7nXDNA21';
var requester;
var creator;
var activity;
var otherActivity;
var user;
var requestDone;


describe('Retrieve requests', function() {

    before(function(done) {
        User.create({
            fbId: FB_ID2,
            fbToken: fbToken,
            firstName: 'Jhon',
            lastName: 'Banderas',
            gender: 'male',
            age: 18,
            default_limit_search_results: 100000,
            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
            default_activities_age_from: sails.config.constants.AGE_FILTER_RANGE.MIN,
            default_activities_age_to: sails.config.constants.AGE_FILTER_RANGE.MAX,
            blocked_users: []
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                requester = newInstance;
                User.create({
                    fbId: FB_ID3,
                    fbToken: fbToken,
                    firstName: 'Will',
                    lastName: 'Smith',
                    gender: 'male',
                    age: 20,
                    default_limit_search_results: 100000,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: sails.config.constants.AGE_FILTER_RANGE.MIN,
                    default_activities_age_to: sails.config.constants.AGE_FILTER_RANGE.MAX,
                    blocked_users: []
                }).exec(function created(err, newInstance) {
                    if (!err && newInstance) {
                        creator = newInstance;
                        Activity.create({
                            name: "Activity for male",
                            details: "Good",
                            date: "2016-02-12",
                            toTime: null,
                            fromTime: "Afternoon",
                            creator: creator.id,
                            type: "Sports",
                            address: "Washington",
                            age_filter_from: "91",
                            age_filter_to: "99",
                            gender: sails.config.constants.ACTIVITY_GENDER_FILTER.MALE,
                            visibility: sails.config.constants.ACTIVITY_VISIBILITY.EVERYONE,
                            isAtendeeVisible: true
                        }).exec(function created(err, newInstance) {
                            if (!err && newInstance) {
                                activity = newInstance;
                                Request.create({
                                    requester: requester.id,
                                    activity: activity.id,
                                    note: "amazing request!"
                                }).exec(function created(err, newInstance) {
                                    if (!err && newInstance) {
                                        requestDone = newInstance;
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
        done();
    })


    beforeEach(function() {

    })
    afterEach(function() {

    })

    /*
	describe('Get all requests', function(done){
		it("Should list all requests with correct date.", function(done){
			request.get(path + "/request").set("fbtoken",fbToken).end(function(err, res){
				if (!err && res) {
					expect(res).to.exist;
	          		expect(res.status).to.equal(200);
	          		expect(res.body).to.not.be.empty();
	          		var actualDate = new Date(DateHelper.createActualDateWithFormat_yyyyMMdd());
	          		for (var i = 0; i < res.body.length; i++) {
	          			var activityDate = new Date(res.body[i].activityDate);
						var biggerOrEqual = (activityDate >= actualDate);
						expect(biggerOrEqual).to.be.ok();
	          		}
	          		done();
				} else {
					done(false);
				}
			})
		})
	})
	*/
    describe("Create a request with data provided", function(done) {
        it("Should create succesfully a Request invitation", function(done) {
            var newRequestData = {
                note: "I would like to join you",
                state: sails.config.constants.REQUEST_STATUS.PENDING,
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                date: DateHelper.createActualDateWithFormat_yyyyMMdd()
            };

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

            //request.post(path + "/activity").set("fbtoken",fbToken).send(newActivityData).end(function(err, res) {
            //if (!err && res) {
            //newRequestData.activity = res.body.id;
            newRequestData.activity = activity.id;
            //request.post(path + "/user").set("fbtoken",fbToken).send(newUserData).end(function(err, userCreated) {
            //if(!err && userCreated) {
            //newRequestData.requester = userCreated.body.id;
            //newRequestData.requester = requester.id;
            request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                    if (!err && res) {
                        expect(res).to.exist;
                        expect(res.status).to.equal(201);
                        expect(res.body).to.not.be.empty();
                        newRequestData.date = DateHelper.createActualDateWithFormat_yyyyMMdd();
                        checkActivityData(res, newRequestData);
                        done();
                    } else {
                        done(err);
                    }
                })
                //} else {
                //	done(err);
                //}
                //})
                //} else {
                //	done(err);
                //}
                //})
        })
    })

    describe('Accept request', function(done) {
        it("Should accept Request invitation.", function(done) {

            var newRequestData = {
                note: "I would like to join you",
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                activity: activity.id
            }

            request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.body).to.not.be.empty();
                    request.post(path + "/request/accept").set("fbtoken", fbToken).send({ id: res.body[0].requestId }).end(function(err, result) {
                        if (!err && result) {
                            expect(result).to.exist;
                            expect(result.status).to.equal(200);
                            expect(result.body).to.not.be.empty();
                            expect(result.body[0].requestState).to.equal(sails.config.constants.REQUEST_STATUS.ACCEPTED);
                            done();
                        } else {
                            done(false);
                        }
                    })

                } else {
                    done(false);
                }
            })
        })
    })

    describe('Accept request', function(done) {
        it('Should not accept the Request invitation because the state of the request is not "Pending".', function(done) {

            var newRequestData = {
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                activity: activity.id
            }

            request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                if (!err && res) {
                    expect(res.body).to.exist;
                    expect(res.body).to.not.be.empty();
                    var newStatus = {};
                    newStatus.state = sails.config.constants.REQUEST_STATUS.ACCEPTED;
                    var filter = {};
                    filter.id = res.body[0].requestId;
                    Request.update(filter, newStatus).exec(function(err, requestApproved) {
                        if (!err && requestApproved) {
                            request.post(path + "/request/accept").set("fbtoken", fbToken).send({ id: res.body[0].requestId }).end(function(err, result) {
                                if (!err && result) {
                                    expect(result).to.exist;
                                    expect(result.status).to.equal(400);
                                    expect(result.body).to.not.be.empty();
                                    expect(result.body.status).to.equal(400);
                                    expect(result.body.error).to.equal(sails.config.constants.ERRORS.BUSSINESS_LOGIC);
                                    done();
                                } else {
                                    done(false);
                                }
                            })
                        } else {
                            done(false);
                        }
                    })
                } else {
                    done(false);
                }
            })
        })
    })

    describe('Deny request', function(done) {
        it("Should deny Request invitation.", function(done) {

            var newRequestData = {
                note: "I would like to join you",
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                activity: activity.id
            }

            request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.body).to.not.be.empty();
                    request.post(path + "/request/deny").set("fbtoken", fbToken).send({ id: res.body[0].requestId }).end(function(err, result) {
                        if (!err && result) {
                            expect(result).to.exist;
                            expect(result.status).to.equal(200);
                            expect(result.body).to.not.be.empty();
                            expect(result.body[0].requestState).to.equal(sails.config.constants.REQUEST_STATUS.REJECTED);
                            done();
                        } else {
                            done(false);
                        }
                    })
                } else {
                    done(false);
                }
            })
        })
    })

    describe('Deny request', function(done) {
        it('Should deny the Request invitation because the state of the request is "Pending".', function(done) {

            var newRequestData = {
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                activity: activity.id
            }

            request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                if (!err && res) {
                    expect(res.body).to.exist;
                    expect(res.body).to.not.be.empty();
                    var newStatus = {};
                    newStatus.state = sails.config.constants.REQUEST_STATUS.ACCEPTED;
                    var filter = {};
                    filter.id = res.body[0].requestId;
                    Request.update(filter, newStatus).exec(function(err, requestApproved) {
                        if (!err && requestApproved) {
                            request.post(path + "/request/deny").set("fbtoken", fbToken).send({ id: res.body[0].requestId }).end(function(err, result) {
                                if (!err && result) {
                                    expect(result).to.exist;
                                    expect(result.status).to.equal(200);
                                    expect(result.body).to.not.be.empty();
                                    /*expect(result.body.status).to.equal(400);
                                    expect(result.body.error).to.equal(sails.config.constants.ERRORS.BUSSINESS_LOGIC);*/
                                    done();
                                } else {
                                    done(false);
                                }
                            })
                        } else {
                            done(false);
                        }
                    })
                } else {
                    done(false);
                }
            })
        })
    })

    describe('Cancel request', function(done) {
        it('Should cancel Request invitation because the state of the request is "Accepted".', function(done) {

            var newRequestData = {
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                activity: activity.id
            }

            request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                if (!err && res) {
                    expect(res.body).to.exist;
                    expect(res.body).to.not.be.empty();
                    var newStatus = {};
                    newStatus.state = sails.config.constants.REQUEST_STATUS.ACCEPTED;
                    var filter = {};
                    filter.id = res.body[0].requestId;
                    Request.update(filter, newStatus).exec(function(err, requestApproved) {
                        if (!err && requestApproved) {
                            request.post(path + "/request/cancel").set("fbtoken", fbToken).send({ id: res.body[0].requestId }).end(function(err, result) {
                                if (!err && result) {
                                    expect(result.status).to.equal(200);
                                    expect(result.body).to.exist;
                                    expect(result.body).to.not.be.empty();
                                    expect(result.body[0].requestState).to.equal(sails.config.constants.REQUEST_STATUS.CANCELLED);
                                    done();
                                } else {
                                    done(false);
                                }
                            })
                        } else {
                            done(false);
                        }
                    })
                } else {
                    done(false);
                }
            })
        })
    })

    describe('Cancel request', function(done) {
        it('Should not cancel Request invitation because the state of the request invitation is not "Accepted".', function(done) {

            var newRequestData = {
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                activity: activity.id
            }

            request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                if (!err && res) {
                    expect(res.body).to.exist;
                    expect(res.body).to.not.be.empty();
                    request.post(path + "/request/cancel").set("fbtoken", fbToken).send({ id: res.body[0].requestId }).end(function(err, result) {
                        if (!err && result) {
                            expect(result).to.exist;
                            expect(result.status).to.equal(200);
                            expect(result.body).to.not.be.empty();
                            /*expect(result.body.status).to.equal(400);
                            expect(result.body.error).to.equal(sails.config.constants.ERRORS.BUSSINESS_LOGIC);*/
                            done();
                        } else {
                            done(false);
                        }
                    })
                } else {
                    done(false);
                }
            })
        })
    })

    describe('Try to send request.', function(done) {
        it('Should not send request because the requester have been blocked by the creator of the activity.', function(done) {
            var blocked_users = [requester.fbId];
            var newRequestData = {
                requesterFbId: requester.fbId,
                creatorFbId: creator.fbId,
                activity: activity.id
            }
            User.update({ id: creator.id }, { blocked_users: blocked_users }).exec(function(err, user) {
                if (!err && user) {
                    request.post(path + "/request").set("fbtoken", fbToken).send(newRequestData).end(function(err, res) {
                        if (!err && res) {
                            expect(res.body).to.exist;
                            expect(res.status).to.equal(400);
                            expect(res.body.error).to.equal("E_BUSSINESS_LOGIC");
                            expect(res.body.status).to.equal(400);
                            expect(res.body.summary).to.equal("Requester user can not send a request to activity passed in the parameters because it has been blocked by the creator of the activity.");
                            done();
                        } else {
                            done(false);
                        }
                    })
                } else {
                    done(false);
                }
            })
        })
    })



});




function checkActivityData(res, data) {
    expect(res.body[0].requestNote).to.equal(data.note);
    expect(res.body[0].requestState).to.equal(data.state);
    expect(res.body[0].userFbId).to.equal(data.requesterFbId);
    expect(res.body[0].activityId).to.equal(data.activity);
    var requestDate = DateHelper.createDateWithFormat_yyyyMMdd(res.body[0].requestCreatedAt);
    expect(requestDate).to.equal(data.date);
}