/**
* Location.js
*
* @class Location
* @description  Model that represents a Location. This object is based on Google Geocoding response. <br>
				We'll have different locations even if the coordinates are exactly the same. <br>
				There is no meaning for use this resource except to be linked to an Activity. <br>
				Only US locations will be managed. <br>

* @property {string}  	id					- Location's identifier.
* @property {string}  	formatted_street	- A string representing the location's street ( optional )
* @property {string}  	city				- A string representing the location's city ( mandatory )
* @property {string}  	state				- A string representing the location's state ( mandatory )
* @property {string}  	zip					- A string representing the location's zip ( optional )
* @property {string}  	formatted_address	- A string that joins street, city, state and zip
* @property {float}  	lat					- Represents the latitude coordinate
* @property {float}  	lon					- Represents the longitude coordinate

*/

module.exports = {

    attributes: {

        formatted_street: {
            type: 'string'
        },
        neighborhood: {
            type: 'string'
        },
        locality: {
            type: 'string'
        },
        city: {
            type: 'string'
        },
        state: {
            required: true,
            type: 'string'
        },
        zip: {
            type: 'string'
        },
        formatted_address: {
            required: true,
            type: 'string'
        },
        lat: {
            required: true,
            type: "float"
        },
        lon: {
            required: true,
            type: "float"
        },
        stateShort: {
            type: 'string'
        }

    }
};