/**
* @module Policy : isLogged
* @description Policy to ensure that the user is authenticated
*/
module.exports = function(req, res, next) {
	var token = req.headers ? req.headers.fbtoken : null; 
	if (!token) {
		sails.log.debug("Unauthorizing access to " + req.originalUrl)
		return res.forbidden();
	};
	User.findOneByFbToken(token).exec(function(err, user) {
		if (user) {
			next();
		} else {
			return res.forbidden();
		}
	});
};