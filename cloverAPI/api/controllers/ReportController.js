/**
 * ReportController
 *
 * @description :: Server-side logic for managing reports
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {


    /*
     * @description Reports a user. Service used to report a user. It must include the reason why the user is reported.
     * @return The created report.
     */
    create: function(req, res) {
        sails.log.debug("-----Starting Create Report Service-----");
        if (!req.body.userReporterId) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Param userReporterId not supplied." })));
        }
        if (!req.body.userToReportId) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Param userToReportId not supplied." })));
        }
        if (!req.body.reason) {
            return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Param reason not supplied." })));
        }
        var newReportData = {
            reporterUser: req.body.userReporterId,
            reportedUser: req.body.userToReportId,
            reportedReason: req.body.reason,
            reportedNotes: req.body.additionalComments ? req.body.additionalComments : null
        }
        Report.create(newReportData).exec(function(err, reportCreated) {
            if (!err && reportCreated) {
                sails.log.debug("->New Report Created.");
                Report.find({ id: reportCreated.id }).populate("reporterUser").populate("reportedUser").exec(function(err, report) {
                    if (!err && report) {
                        sails.log.debug("-----Create Report Service executed successfully-----");
                        res.status(201);
                        return (res.json(report[0]));
                    } else {
                        sails.log.debug("->Error retrieving new created report.");
                        sails.log.debug("-->User Reporter Id: " + newReportData.userReporterId);
                        sails.log.debug("-->User To Report Id: " + newReportData.userToReportId);
                        sails.log.debug("-->Reason: " + newReportData.reason);
                        sails.log.debug("-->Additional Comments: " + newReportData.additionalComments);
                        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error retrieving new report created." })));
                    }
                })
            } else {
                sails.log.debug("->Error creating new report.");
                sails.log.debug("-->User Reporter Id: " + newReportData.userReporterId);
                sails.log.debug("-->User To Report Id: " + newReportData.userToReportId);
                sails.log.debug("-->Reason: " + newReportData.reason);
                sails.log.debug("-->Additional Comments: " + newReportData.additionalComments);
                return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Error creating a new report to report a user." })));
            }
        })
    }

};