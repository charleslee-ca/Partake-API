/**
* @module Policy : logger
* @description Policy to log each request
*/
module.exports = function(req, res, next) {
	var b = "";
	if (req.body) {
		b = " < Body > " + JSON.stringify(req.body);
	};
	sails.log.debug("Request > " + req.originalUrl + b);
  	next();
};