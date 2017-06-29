/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {



    /***************************************************************************
     *                                                                          *
     * Custom routes here...                                                    *
     *                                                                          *
     *  If a request to a URL doesn't match any of the custom routes above, it  *
     * is matched against Sails route blueprints. See `config/blueprints.js`    *
     * for configuration options and examples.                                  *
     *                                                                          *
     ***************************************************************************/

    /*
     *   Request
     */
    "POST /request/accept/:reqId": { controller: "RequestController", action: "accept" },
    "POST /request/deny/:reqId": { controller: "RequestController", action: "deny" },
    "POST /request/cancel/:reqId": { controller: "RequestController", action: "cancel" },

    /*
     *   Manager
     */
    "GET /manager": { controller: "ManagerController", action: "manager" },
    "GET /manager/createActivity": { controller: "ManagerController", action: "createActivityGet" },
    "GET /manager/editActivityList": { controller: "ManagerController", action: "editActivityListGet" },
    "GET /manager/editActivity": { controller: "ManagerController", action: "editActivityGet" },
    "GET /manager/deleteActivity": { controller: "ManagerController", action: "deleteActivityList" },
    "GET /manager/login": { controller: "ManagerController", action: "getLogin" },
    "GET /manager/updateDb": { controller: "ManagerController", action: "updateDatabaseGet" },
    "GET /manager/updateActivityModel": { controller: "ManagerController", action: "updateActivityModel" },
    "POST /manager/login": { controller: "ManagerController", action: "doLogin" },
    "POST /manager/createActivity": { controller: "ManagerController", action: "createActivity" },
    "POST /manager/editActivity": { controller: "ManagerController", action: "editActivity" },
    "POST /manager/deleteActivity": { controller: "ManagerController", action: "deleteActivity" },
    "POST /manager/updateDb": { controller: "ManagerController", action: "updateDatabase" },

    /*
     *   Activity
     */
    "GET /activity/attendance": { controller: "ActivityController", action: "getAttendanceList" },
    "GET /activity/createdByUser": { controller: "ActivityController", action: "activitiesCreatedByUser" },
    "GET /activity/findByQuery": { controller: "ActivityController", action: "findByQuery" },
    "POST /activity/edit": { controller: "ActivityController", action: "editActivity" },
    "POST /activity/like": { controller: "ActivityController", action: "likeActivity" },
    "POST /activity/unlike": { controller: "ActivityController", action: "unlikeActivity" },

    /*
     *   User
     */
    "GET /user/login": { controller: "UserController", action: "getLogin" },
    "GET /user/mutualFriends": { controller: "UserController", action: "getUsersMutualFriends" },
    "GET /user/bannedUsers": { controller: "UserController", action: "getBannedUsers" },
    "POST /user/editPictures": { controller: "UserController", action: "editUserPictures" },
    "POST /user/edit": { controller: "UserController", action: "editUserProfile" },
    "POST /user/saveDefaultPreferences": { controller: "UserController", action: "saveUserDefaultPreferences" },
    "POST /user/resetBadge": { controller: "UserController", action: "resetBadgeCounter" },
    "POST /user/registerDevice": { controller: "UserController", action: "registerDeviceToken" },
    "POST /user/blockUser": { controller: "UserController", action: "blockUser" },
    "POST /user/banUser": { controller: "UserController", action: "banUser" },
    "POST /user/unBanUser": { controller: "UserController", action: "unBanUser" },
    "POST /user/shared": { controller: "UserController", action: "didShare" },
    "DELETE /user": { controller: "UserController", action: "destroyUser" },
    /* "POST /user/permissions"            : {controller : "UserController", action : "usersPermissions"}*/

    /*
     *   Report
     */
    "POST /report": { controller: "ReportController", action: "create" }


};