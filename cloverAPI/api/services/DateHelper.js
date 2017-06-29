/**

@module Helper : DateHelper
@description : Manage all things related to dates
*/

var Moment = require('moment');

/**
* @description 
	Receive a string that that is expected to represent a time and check if it is valid <br>
	It will be vaild if has the format "hh:mm(AM/PM)" and represents a real time ( 55:92 ) is not valid. <br>
	It uses a regular expression.
* @param time {string} String to validate
* @returns {boolean} Indicate if the provided string is valid or not
*/
exports.isValidTime = function(time) {
	var patt = /^(?:[0-9]|1[0-2]):[0-5][0-9]\s(?:AM|PM)$/;
	return patt.test(time);
}

/**
* @description 
	Receive a string that that is expected to represent a date and check if it is valid <br>
	It will be vaild if has the format "yyyy-MM-dd"<br>
* @param date {string} String to validate
* @returns {boolean} Indicate if the provided string is valid or not
*/
exports.isValidDate = function(date) {
	if (!date) {return false};
	
	try {
		var dateToValidate = new Date(date);
		if (!dateToValidate) {
			return false;
		} else {
			var dateStringToValidate = dateToValidate.getUTCFullYear() + "-" + (dateToValidate.getUTCMonth() + 1) + "-" + dateToValidate.getUTCDate();
			//var dateStringToValidate2 = dateToValidate.getFullYear() + "-" + (dateToValidate.getMonth() + 1) + "-" + dateToValidate.getDate();
			//console.log("Date To Validate: " + dateStringToValidate);
			//console.log("Date To Validate 2: " + dateStringToValidate2);
			var patt = /^(\d\d\d\d)-([1-9]|1[0-2])-([1-9]|[1-2][0-9]|3[0-1])$/;
			var matches = dateStringToValidate.match(patt);
			return (matches && (matches.length > 0)) ? true : false;
		}
	} catch (error) {
		sails.log.debug("Error validatig date: " + error);
	}
	return false;
}

/**
* @description Creates actual date of type string with the format "yyyy-MM-dd"
* @returns {string} Actual date
*/
exports.createActualDateWithFormat_yyyyMMdd = function() {
	var actualDate = new Date();
	// var actualDateFormatString = actualDate.getUTCFullYear().toString() + '-' + (actualDate.getUTCMonth() + 1).toString() + '-' + actualDate.getUTCDate().toString();
	// return actualDateFormatString;
	return Moment.utc(actualDate).format("YYYY-MM-DD");
}

/**
* @description Creates a date of type string, with the date of type string passed as parameter, with the format "yyyy-MM-dd".
* @returns {string} Date passed as parameter.
*/
exports.createDateWithFormat_yyyyMMdd = function(date) {
	var dateToFormat = new Date(date);
	var dateFormatString = Moment.utc(dateToFormat).format("YYYY-MM-DD");
	return dateFormatString;
}


/**
* @description Creates a UTC date. If date parameter in not null then creates the UTC date based on date passed as parameter. Else creates actual UTC date.
*
*/
exports.createUTCDate = function(date) {
	var dateToFormat;
	var formattedDate;
	try {
		if (date) {
			dateToFormat = new Date(date);
			formattedDate = new Date(dateToFormat.getUTCFullYear(), dateToFormat.getUTCMonth(), dateToFormat.getUTCDate(),
								     dateToFormat.getUTCHours(), dateToFormat.getUTCMinutes(), dateToFormat.getUTCSeconds());
		} else {
			dateToFormat = new Date();
			formattedDate = new Date(dateToFormat.getUTCFullYear(), dateToFormat.getUTCMonth(), dateToFormat.getUTCDate(), 0, 0, 0);
		}
	} catch (error) {
		sails.log.debug("Error creating UTC date: " + error);
	}
	return formattedDate;
}







