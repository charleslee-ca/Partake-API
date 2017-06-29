var Sails = require('sails');

var FB_ID1 = "thereisnowaythatthiscouldbeafacebookid1";
var FB_ID2 = "thereisnowaythatthiscouldbeafacebookid2";

before(function(done) {

    Sails.lift({
        adapters: {
            default: 'localdb_test'
        },
        log: {
            level: 'debug'
        }

    }, function(err, sails) {
        User.destroy({ fbId: FB_ID1 }).exec(function(err, users) {
            done();
        })
    });
})

after(function(done) {
    User.destroy({ fbId: FB_ID1 }).exec(function(err, users) {
        User.destroy({ fbId: FB_ID2 }).exec(function(err, users) {
            Sails.lower(done);
        })
    })
})

beforeEach(function() {

})
afterEach(function() {

})