var request = require('superagent');
var expect = require('expect.js');
var path = "http://localhost:1337";
var FB_ID2 = "thereisnowaythatthiscouldbeafacebookid2";
var FB_ID8 = "thereisnowaythatthiscouldbeafacebookid8";
var fbToken = 'GHhfFBeF4xB7nXDNA21';

var firstUser;
var anotherUser;

describe('Retrieve users', function() {

    before(function(done) {

        User.create({
            fbId: FB_ID8,
            fbToken: fbToken,
            firstName: 'Jhon',
            lastName: 'Banderas',
            gender: 'male',
            age: 18,
            type: "Sports",
            aboutMe: "Bad guy",
            pictures: []
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                firstUser = newInstance;
                User.create({
                    fbId: "anotherFbId",
                    fbToken: fbToken,
                    firstName: 'Walter',
                    lastName: 'White',
                    gender: 'male',
                    age: 45,
                    aboutMe: "",
                    pictures: ["pic1", "pic2", "pic3", "pic4", "pic5"]
                }).exec(function created(err, newUser) {
                    if (!err) {
                        anotherUser = newUser;
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
        done();
    })
    beforeEach(function() {

    })
    afterEach(function() {

    })


    describe('Get all users', function(done) {
        it("Should list all users", function(done) {
            request.get(path + "/user").set("fbtoken", fbToken).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Edit user profile', function(done) {
        it("Should fail because neither aboutMe nor pictures parameter provided.", function(done) {
            var requestBody = {
                id: firstUser.id
            }
            request.post(path + "/user/edit").set("fbtoken", fbToken).send(requestBody).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    expect(res.body).to.not.be.empty();
                    expect(res.body.summary).to.equal("Missing parameter. Must provide at least one parameter for update.");
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Edit user profile pictures', function(done) {
        it("Should not set pictures because exceeded maximum number of pictures per user.", function(done) {
            var requestBody = {
                id: firstUser.id,
                pictures: ["pic1", "pic2", "pic3", "pic4", "pic5", "pic6", "pic7"]
            }
            request.post(path + "/user/edit").set("fbtoken", fbToken).send(requestBody).end(function(err, res) {
                if (!err && res) {
                    console.log(res.body.pictures);
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    expect(res.body).to.not.be.empty();
                    expect(res.body.summary).to.equal("Too many pictures.");
                    done();
                } else {
                    done(err);
                }
            })
        })

        it("Should set picture links.", function(done) {
            var requestBody = {
                id: firstUser.id,
                pictures: ["thisIsALinkOfAFbPhotoOfTheUser", "pic2", "pic3"]
            }
            request.post(path + "/user/edit").set("fbtoken", fbToken).send(requestBody).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    expect(res.body[0].id).to.equal(firstUser.id);
                    expect(res.body[0].pictures).to.not.be.empty();
                    expect(res.body[0].pictures.length).to.equal(3);
                    expect(res.body[0].pictures[0]).to.equal("thisIsALinkOfAFbPhotoOfTheUser");
                    done();
                } else {
                    done(err);
                }
            })
        })

        it("Should delete all picture links.", function(done) {
            var requestBody = {
                id: anotherUser.id,
                pictures: null
            }
            request.post(path + "/user/edit").set("fbtoken", fbToken).send(requestBody).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    expect(res.body[0].id).to.equal(anotherUser.id);
                    expect(res.body[0].pictures).to.be.empty();
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Edit user about me', function(done) {
        it("Should set user about me.", function(done) {
            var requestBody = {
                id: anotherUser.id,
                aboutMe: "Geek Guy"
            }
            request.post(path + "/user/edit").set("fbtoken", fbToken).send(requestBody).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    expect(res.body[0].aboutMe).to.equal("Geek Guy");
                    done();
                } else {
                    done(err);
                }
            })
        })

        it("Should unset user about me.", function(done) {
            var requestBody = {
                id: firstUser.id,
                aboutMe: null
            }
            request.post(path + "/user/edit").set("fbtoken", fbToken).send(requestBody).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    expect(res.body[0].aboutMe).to.equal("");
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Edit user profile', function(done) {
        it("Should edit both user pictures and aboutMe.", function(done) {
            var requestBody = {
                id: firstUser.id,
                aboutMe: "Still Bad Guy",
                pictures: ["firstPicture", "pic2"]
            }
            request.post(path + "/user/edit").set("fbtoken", fbToken).send(requestBody).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    expect(res.body[0].aboutMe).to.equal("Still Bad Guy");
                    expect(res.body[0].pictures.length).to.equal(2);
                    expect(res.body[0].pictures[0]).to.equal("firstPicture");
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

});



describe('Update user default preferences', function() {

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


    describe('Update user default preferences.', function(done) {
        it("Should update user default preferences.", function(done) {
            var newDefaultPreferencesData = {
                default_limit_search_results: 150,
                default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                default_activities_age_from: 17,
                default_activities_age_to: 45,
                fbId: FB_ID2
            }
            request.post(path + "/user/saveDefaultPreferences").set("fbtoken", fbToken).send(newDefaultPreferencesData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    expect(res.body.length).to.equal(1);
                    expect(res.body[0].default_limit_search_results).to.equal(150);
                    expect(res.body[0].default_activities_created_by).to.equal("both");
                    expect(res.body[0].default_activities_age_from).to.equal(17);
                    expect(res.body[0].default_activities_age_to).to.equal(45);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })


    describe('Update user default preferences.', function(done) {
        it("Should not update user default preferences because the created by attribute is not member of the enum.", function(done) {
            var newDefaultPreferencesData = {
                default_limit_search_results: 150,
                default_activities_created_by: "wrong!",
                default_activities_age_from: 17,
                default_activities_age_to: 45,
                fbId: FB_ID2
            }
            request.post(path + "/user/saveDefaultPreferences").set("fbtoken", fbToken).send(newDefaultPreferencesData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.not.be.empty();
                    expect(res.body.error).to.equal("E_BUSSINESS_LOGIC");
                    expect(res.body.status).to.equal(400);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

});


describe('Mutual friends and Block user test.', function() {

    var pepe = null;
    var jose = null;
    var pepe2 = null;

    before(function(done) {
        User.create({
            fbId: "10101268076755827",
            fbToken: "CAAXLY68eypcBAOZBIDCmLVa9lXz8MdKK9rdftPR3ESSBHA9eH1vCSK7C2CZCsadcT8zwAWrfbMunBKA2Qd6FOZCIZATxdrMYQMZAnx1ZC5vxZAkU4fWPSakmid0HEwenWzy3raPaDXU3XwzG6tJKtZAtZAz6G8ld3l3cjAeHWZBq0nz2S3ZCiwIAR9rUSCjoDx0HcZCABl4Uc9kW7HToO7w88j70zKYtVZAe73DnGjb8s8PWO4AZDZD",
            firstName: 'Pepe',
            lastName: 'Koko',
            gender: 'male',
            age: 91,
            default_limit_search_results: 60,
            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
            default_activities_age_from: 15,
            default_activities_age_to: 99
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                pepe = newInstance;
                User.create({
                    fbId: "10100371734338238",
                    fbToken: "CAAXLY68eypcBADXAQdHbRVQQeu3ZBlrkGuEHZBTpCMinpAh5YUi1eYxU3M0jOepRZBtEKMcPqZASoZBwy3NMSLdTeNGSZB9lNWo4Uv1BWkIBw1WZCA03o2ZAovneaTnDbhjO2QEJVRPgMZCjhaxaNSiysFavzwsLAp6gdZBzGvVzgzZBYEOqu7ga3LRVLGjKQjzQObC3gLtkZB1EqZCE6BoccfFjmvb2z3H2VUZCV2GayZAgFUPBwZDZD",
                    firstName: 'Jose',
                    lastName: 'Koko',
                    gender: 'male',
                    age: 91,
                    default_limit_search_results: 60,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                }).exec(function created(err, newInstance) {
                    if (!err && newInstance) {
                        jose = newInstance;
                        User.create({
                            fbId: "1422674734713251",
                            fbToken: "CAAXLY68eypcBAIIKEH56ldve52EbhXvfw1z2qL2c28eJsEpAxVybthgqlaZAguT1EqaqzyUFGwapjK0DoYkZBO5R1eeZB3N8HNweZCQYB9JMQFmZCkwn0Byc6qOzdb9exMJsEySeXJZClkEdKMSE98ZAZBN4OKYjdjkRZA4dP5tz9by7CidXc35eKuIYlBYBTcAOvWzlPVI0BcC0vuZCLLO87BllPXwiEZBNV7ODFCiS7SO0QZDZD",
                            firstName: 'Partake',
                            lastName: 'Koko',
                            gender: 'male',
                            age: 91,
                            default_limit_search_results: 60,
                            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                            default_activities_age_from: 15,
                            default_activities_age_to: 99
                        }).exec(function created(err, newInstance) {
                            if (!err && newInstance) {
                                pepe2 = newInstance;
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

    after(function(done) {
        User.destroy({ id: pepe.id }).exec(function(err) {
            if (err) {
                done(err);
            } else {
                User.destroy({ id: jose.id }).exec(function(err) {
                    if (err) {
                        done(err);
                    } else {
                        done();
                    }
                })
            }
        })
    })

    beforeEach(function() {})

    afterEach(function() {})


    describe('Retrieve mutual users friends.', function() {
        it('Must return one mutual user friend.', function(done) {
            request.get(path + "/user/mutualFriends?fbId=" + jose.fbId).set("fbtoken", pepe.fbToken).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body.length).to.be.equal(1);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Retrieve mutual users friends.', function() {
        it('Must not return any mutual user friend because of wrong user facebook id.', function(done) {
            request.get(path + "/user/mutualFriends?fbId=" + "WRONGFBID").set("fbtoken", pepe.fbToken).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Block user.', function() {
        it('The user Jose should be blocked by user Pepe.', function(done) {
            var postData = {
                userFbIdToBlock: jose.fbId,
                userFbIdBlocker: pepe.fbId
            };
            request.post(path + "/user/blockUser").set("fbtoken", pepe.fbToken).send(postData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body[0].blocked_users[0]).to.equal(jose.fbId);
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

    describe('Block user.', function() {
        it('The user Jose should not be blocked by user Pepe because he is already blocked by Pepe.', function(done) {
            var postData = {
                userFbIdToBlock: jose.fbId,
                userFbIdBlocker: pepe.fbId
            };
            request.post(path + "/user/blockUser").set("fbtoken", pepe.fbToken).send(postData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    expect(res.body.status).to.equal(400);
                    expect(res.body.summary).to.equal("User to block is already blocked by the user blocker.");
                    expect(res.body.error).to.equal("E_BUSSINESS_LOGIC");
                    done();
                } else {
                    done(err);
                }
            })
        })
    })

})