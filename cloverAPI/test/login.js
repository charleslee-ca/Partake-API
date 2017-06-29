var request = require('superagent');
var expect = require('expect.js');
var Sails = require('sails');

var path = "http://localhost:1337";

var FB_ID1 = "1422674734713251";
var FB_TOKEN = "CAAXLY68eypcBALpYOv4SJ1D9hkHxMHR1MgFVuXjPblibM0vS5tDxo8adbhzpW1DvxZCfTsICYtHXhKBNutCkFZCBovKaKkfvEwEcMxyB4ZBjncAAxjzdVV7REIsxwe7oOQhDPQhKIzT16jzPAYXwtxSYZBZAOwqeTuUjGxqkisav2RcIifWiaoWPcusOr0QMXjh3FnYuoC1bho2N3JBiiotNZCVJDTPxafw3FIQ5tMBwZDZD";

var testUserData = {
    fbId: FB_ID1,
    fbToken: FB_TOKEN,
    firstName: 'Jhon',
    lastName: 'Banderas',
    gender: 'male',
    profilePictureUrl: 'https://www.letslearnspanish.co.uk/wp-content/uploads/2014/01/hola-300x165.jpg',
    age: 18
}

describe('Login', function() {

    before(function(done) {
        Location.destroy()
            .then(function() {
                return Activity.destroy();
            })
            .then(function() {
                return User.destroy();
            })
            .then(function() {
                done();
            })
    })

    after(function(done) {
        Location.destroy()
            .then(function() {
                return Activity.destroy();
            })
            .then(function() {
                return User.destroy();
            })
            .then(function() {
                done();
            })
    })
    beforeEach(function() {

    })
    afterEach(function() {

    })

    describe('register', function() {
        it('user doesn\'t exists, should be created a new User', function(done) {

            request.post(path + "/user/login").send(testUserData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(201);
                    checkUserData(res, testUserData);
                    done();
                } else {
                    done(err);
                }

            });


        })
    })

    describe('login', function() {
        it('user already exists, shouldn\'t be created', function(done) {
            request.post(path + "/user/login").send(testUserData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    checkUserData(res, testUserData);
                    done();
                } else {
                    done(err);
                }

            });
        })
    })



    describe('Existing fbId and missing parameter : age', function() {
        it('There should not be error', function(done) {
            request.post(path + "/user/login").send({
                fbId: FB_ID1,
                fbToken: FB_TOKEN,
                firstName: 'Jhon',
                lastName: 'Banderas',
                gender: 'male',
            }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    checkUserData(res, testUserData);
                    done();
                } else {
                    done(err);
                }

            });
        })
    })

    describe('Existing fbId data is updated', function() {
        it('There should not be error', function(done) {
            request.post(path + "/user/login").send({
                fbId: FB_ID1,
                fbToken: FB_TOKEN,
                firstName: 'Jhonathan'
            }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(200);
                    expect(res.body).to.exist;
                    testUserData.firstName = 'Jhonathan';
                    checkUserData(res, testUserData);
                    done();
                } else {
                    done(err);
                }

            });
        })
    })

    describe('Missing parameter fbId', function() {
        it('400 error should be raised', function(done) {
            request.post(path + "/user/login").send({
                fbToken: FB_TOKEN,
                firstName: 'Jhon',
                lastName: 'Banderas',
                gender: 'male',
            }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(400);
                    expect(res.body.error).to.equal("E_MISSING_PARAMETER");
                    done();
                } else {
                    done(err);
                }

            });
        })
    })

    describe('Try to access a service without a fbToken in the headers', function() {
        it('403 forbidden error should be raised', function(done) {
            request.post(path + "/activity").send({

            }).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(403);
                    done();
                } else {
                    done(err);
                }

            });
        })
    })

    describe('Try to access a service with an invalid fbToken in the headers', function() {
        it('403 forbidden error should be raised', function(done) {
            request.post(path + "/activity").send({

            }).set("fbtoken", "arearetoken").end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(403);
                    done();
                } else {
                    done(err);
                }

            });
        })
    })

    describe('Facebook token validation with the facebook servers', function() {

        before(function(done) {
            Location.destroy()
                .then(function() {
                    return Activity.destroy();
                })
                .then(function() {
                    return User.destroy();
                })
                .then(function() {
                    done();
                })
        })

        after(function(done) {
            done();
        })
        beforeEach(function() {

        })
        afterEach(function() {

        })


        describe('fbToken validated correctly by Facebook', function() {
            it('must return 201', function(done) {
                request.post(path + "/user/login").send(testUserData).end(function(err, res) {
                    if (!err && res) {
                        expect(res).to.exist;
                        expect(res.status).to.equal(201);
                        done();
                    } else {
                        done(err);
                    }
                });
            })
        })

        describe('fbToken validated incorrectly by Facebook', function() {
            it('must return 400', function(done) {
                testUserData.fbToken = 'CAAXLY68eypcBAIIKEH56ldve52EbhXvfw1z2qL2c28eJsEpAxVybthgqlaZAguT1EqaqzyUFGwapjK0DoYkZBO5R1eeZB3N8HNweZCQYB9JMQFmZCkwn0Byc6qOzdb9exMJsEySeXJZClkEdKMSE98ZAZBN4OKYjdjkRZA4dP5tz9by7CidXc35eKuIYlBYBTcAOvWzlPVI0BcC0vuZCLLO87BllPXwiEZBNV7ODFCiS7SO0QZDZD';
                request.post(path + "/user/login").send(testUserData).end(function(err, res) {
                    if (!err && res) {
                        expect(res).to.exist;
                        expect(res.status).to.equal(400);
                        expect(res.body.error).to.equal(sails.config.constants.ERRORS.BUSSINESS_LOGIC);
                        done();
                    } else {
                        done(err);
                    }
                });
            })
        })
    })
})

function checkUserData(res, data) {
    expect(res.body.fbId).to.equal(data.fbId);
    expect(res.body.fbToken).to.equal(data.fbToken);
    expect(res.body.firstName).to.equal(data.firstName);
    expect(res.body.lastName).to.equal(data.lastName);
    expect(res.body.gender).to.equal(data.gender);
    expect(res.body.age).to.equal(data.age);
}