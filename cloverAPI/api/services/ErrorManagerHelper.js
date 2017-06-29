
/**

@module Helper : ErrorManagerHelper
@description : Manage the error messages returned to the client.
<ul>
	<li> Customize the Waterline errors that are generated automatically </li>
	<li> Generate customized errors </li>
</ul>

*/
/**

* @description Receive a Waterline Error object and customize it <br>
Customizations : 
<ul>
	<li> Change messages based on rules </li>
</ul>
Customized rules : 
<ul>
	<li> required </li>
	<li> string </li>
	<li> date </li>
	<li> is_time </li>
	<li> in </li>
</ul>

* @param waterlineErrorObject {Object} The automatically generated error object
* @returns {Object} The received object but with some customizations ( see Customzations list above )
*/
exports.customizeErrorObject = function(waterlineErrorObject) {

	var invalidAttributes = waterlineErrorObject.invalidAttributes;
	
	// if there are no invalid attributes just return the original error
	if (!invalidAttributes) {
		return waterlineErrorObject;
	};
	
	for (var fieldName in invalidAttributes) {
	  	if (invalidAttributes.hasOwnProperty(fieldName)) {
		  	var fieldErrors = invalidAttributes[fieldName];
		  	for (var i = 0; i < fieldErrors.length; i++) {
		  		var error = fieldErrors[i];
		  		if (!error) {
		  			return;
		  		};
		  		error.message = getCustomizedMessageFromError(fieldName,error);
		  	}
		}
	}

	return waterlineErrorObject;

}
/**
Create error of type "Missing Parameter"
@param params {{summary : string}} Object containing differents options to customize the response , by the moment only summary is customizable
* @returns {Object} An object representing a Missing Parameter error
*/
exports.createMissingParameterError = function(params) {
	params = params || {};
	return {
		error : sails.config.constants.ERRORS.MISSING_PARAMETER,
		status : 400,
		summary : params.summary ? params.summary : "Missing parameters",
	}

}

/**
Create error of type "Incorrect Bussiness Logic."
@param params {{summary : string}} Object containing differents options to customize the response , by the moment only summary is customizable
* @returns {Object} An object representing a Missing Parameter error
*/
exports.customizeBussinesLogicError = function(params) {
	params = params || {};
	return {
		error : sails.config.constants.ERRORS.BUSSINESS_LOGIC,
		status : 400,
		summary : params.summary ? params.summary : "Incorrect Bussiness Logic.",
	}

}

/**
Alter the message based on rule
@param fieldName {string} the field's name that has an error
@param error {{rule : string , message : string }} the error related to that field
* @returns {String} A customized message based on the rule
*/
function getCustomizedMessageFromError(fieldName,error)
{
	if (!error.rule) { return error.message };

	switch (error.rule) {
		case sails.config.constants.VALIDATION.REQUIRED :
			return fieldName + " is required"; 
		case sails.config.constants.VALIDATION.STRING_TYPE :
			return "Invalid type for field " + fieldName + ". Expected 'string'";
		case sails.config.constants.VALIDATION.IN :
			return "Value for " + fieldName + " isn't a valid value";
		case sails.config.constants.VALIDATION.DATE_TYPE :
			return "Invalid date format should be yyyy-MM-dd";
		case sails.config.constants.VALIDATION.IS_TIME :
			return "Invalid time format should be hh:mm or one of the following [Anytime,Morning,Afternoon,Evening]";
		default :
			sails.log.debug("Unkown rule : " + error.rule + " field name : " + fieldName);
			return error.message;
	}
}


exports.createNotFoundError = function (params) {
	params = params || {};
	return {
		error : sails.config.constants.ERRORS.NOT_FOUND,
		status : 404,
		summary : params.summary ? params.summary : "Not found record with specified params"
	}
}
