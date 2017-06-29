var request = require('superagent');
var expect = require('expect.js');
var path = "http://localhost:1337";
var FB_ID2 = "thereisnowaythatthiscouldbeafacebookid2";
var FB_ID3 = "thereisnowaythatthiscouldbeafacebookid6";
var fbToken = 'GHhfFBeF4xB7nXDNA21';

var userReporter;
var userToReport;
var createdReportId;


describe('Create reports.', function() {

    /*
     **	Initializing and finalizing functions.
     */

    before(function(done) {
        User.create({
            fbId: FB_ID2,
            fbToken: fbToken,
            firstName: 'Martin',
            lastName: 'Zanetti',
            gender: 'male',
            age: 25,
            default_limit_search_results: 80000,
            default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
            default_activities_age_from: 15,
            default_activities_age_to: 99
        }).exec(function created(err, newInstance) {
            if (!err && newInstance) {
                userReporter = newInstance;
                User.create({
                    fbId: FB_ID3,
                    fbToken: fbToken,
                    firstName: 'Pablo',
                    lastName: 'Episcopo',
                    gender: 'male',
                    age: 25,
                    default_limit_search_results: 80000,
                    default_activities_created_by: sails.config.constants.ACTIVITY_GENDER_FILTER.BOTH,
                    default_activities_age_from: 15,
                    default_activities_age_to: 99
                }).exec(function created(err, newInstance) {
                    if (!err && newInstance) {
                        userToReport = newInstance;
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


    after(function(done) {
        var criteria = {
            id: [userReporter.id, userToReport.id]
        }
        User.destroy(criteria).exec(function(err) {
            if (err) {
                done(err);
            } else {

                done();
            }
        })
    })


    beforeEach(function() {

    })


    afterEach(function() {

    })



    describe('Creates a new report from Martin to Pablo.', function(done) {
        it("Should creates the report successfully.", function(done) {
            var newReportData = {
                reason: sails.config.constants.REPORT_USER_REASON.PHOTOS,
                additionalComments: "Horrible photos!",
                userReporterId: userReporter.id,
                userToReportId: userToReport.id
            }
            request.post(path + "/report").set("fbtoken", fbToken).send(newReportData).end(function(err, res) {
                if (!err && res) {
                    expect(res).to.exist;
                    expect(res.status).to.equal(201);
                    expect(res.body).to.not.be.empty();
                    expect(res.body.reportedReason).to.equal(sails.config.constants.REPORT_USER_REASON.PHOTOS);
                    expect(res.body.reportedNotes).to.equal("Horrible photos!");
                    expect(res.body.reporterUser.id).to.equal(userReporter.id);
                    expect(res.body.reportedUser.id).to.equal(userToReport.id);
                    createdReportId = res.body.id;
                    done();
                } else {
                    done(err);
                }
            })
        })
    })



























})