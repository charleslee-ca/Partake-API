/**
 * LocationController
 *
 * @description :: Server-side logic for managing locations
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    find: function(req, res) {
        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Cannot access to location resources." })));
    },


    findOne: function(req, res) {
        return (res.badRequest(ErrorManagerHelper.customizeBussinesLogicError({ summary: "Cannot access to location resource." })));
    }

};