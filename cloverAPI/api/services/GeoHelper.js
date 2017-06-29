/**

@module Helper : GeoHelper
@description : Manage all things related to Google Maps Geocode, addresses, location, distances ... etc
*/


/**
* @description 
	Receive a string representing an address and try to find a location from Google database, finally creates a Location <br>
* @param time {string} String to validate
* @callback cb Callback to be invoked when Location is created
*/
exports.getAndCreateLocationForAddress = function(address, cb) {
	sails.log.debug("GeoHelper > Creating location from " + address);
	getGoogleMapsGeocodeResponseFor(address, function(json) {
    createLocationFromGoogleMapsGeocodeResponse(json, cb);
  });
}

/**
* @description  Generates the latitude and longitude of a location.
* @param address String address to query.
* @callback cb Callback to be invoked when latitude and longitude are locationFound.
*/
exports.getLatitudeAndLongitudeFromAddress = function(address, cb){
  getGoogleMapsGeocodeResponseFor(address, cb);
}

/**
* @description 
  Receive a string representing a response from Google Maps Geocode object, then create a Location resource.
* @param response {Object} Object from Google Maps Geocode
* @callback cb Callback to be invoked when Location is created
*/
function createLocationFromGoogleMapsGeocodeResponse(json, cb) {
  // Only create locations inside US
  if (json.country !== 'United States') {
    return cb(false);
  }
  var madison = require('madison');
  var stateAbbreviation = madison.getStateAbbrevSync(json.state);
  Location.create({
    formatted_street: json.route,
    locality: json.locality,
    neighborhood: json.neighborhood,
    city: json.city,
    state: json.state,
    zip: json.postalCode,
    formatted_address: json.formattedAddress,
    lat: json.lat,
    lon: json.lng,
    stateShort: stateAbbreviation
  }).exec(function created (err, newInstance) {
    if (err) {
      sails.log.debug("GeoHelper > Error creating location > " + err);
      return cb(false);
    };
    return cb(newInstance);
  })
}

/**
* @description Calls Google Maps Geocode to retrieve the address info
* @param address String address to que
* @callback cb Callback to be invoked when Location is created.
*/
function getGoogleMapsGeocodeResponseFor(address, cb) {
  
  var googleMapsGeocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json'
  var options = {
    url: googleMapsGeocodeUrl,
    qs: { address: address, key: sails.config.constants.GOOGLE_MAPS_API_KEY }
  }
  request(options, function (error, response, body) {
    try{
    sails.log.debug("GeoHelper > Address > " + address );
    sails.log.debug("GeoHelper > Location > " + response );
    if (!error && response.statusCode == 200) {
      return parseGoogleMapsGeocodeResponse(body, cb);
    } else {
      sails.log.debug("GeoHelper > Error " + error);
      cb(false);
    }
  } catch (err){
    console.log("Error");
    console.log("Error: " + err);
  } 
  })
}

/**
* @description Return a json object from the response of Google Maps Geocode.
* As the user can enter anything on the search box, like a full address, a street, or a city, Google returns a lot of
* results with different types ordered from the most precise ones to the least precise ones.
* For example the ordered types may be: address, street, city, state, and so on.
*
* So, initially we don't know what types are going to be returned, so we have to iterate through the results and get the ones that we want.
*
* For example: https://maps.googleapis.com/maps/api/geocode/json?address=93101&key=AIzaSyDdaClW5ZQIwSkGeDb0Qr9N4oxH2KPjHMA
*
* @param coordinatesA JSON representing latitude and longitude. Format example: {latitude: 51.5103, longitude: 7.49347}
* @callback cb Callback to be invoked when Location is created.
*/
function parseGoogleMapsGeocodeResponse(response, cb) {
  try {
    response = JSON.parse(response);
  }
  catch(err){
    return cb(false);
  }

  if (response.status !== 'OK' || !response.results || response.results.length == 0) {
    sails.log.debug("GeoHelper > Location > No valid results");
    return cb(false);
  };

  var locationFound = response.results[0]; //TODO : consider more thant 1 result , at the moment we use the first one.

  var streetNumber = null;
  var route = null;
  var neighborhood = null;
  var locality = null;
  var city = null;
  var state = null;
  var country = null;
  var postalCode = null;
  var formattedAddress = locationFound.formatted_address;
  var lat = locationFound.geometry.location.lat;
  var lng = locationFound.geometry.location.lng;

  for ( j = 0; j < locationFound.address_components.length; j++) {

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 1 && locationFound.address_components[j].types[0] === 'street_number') {
     streetNumber = locationFound.address_components[j].long_name;
     continue;
    }

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 1 && locationFound.address_components[j].types[0] === 'route') {
      route = locationFound.address_components[j].long_name;
      continue;
    }

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 2 && locationFound.address_components[j].types[0] === 'neighborhood') {
      neighborhood = locationFound.address_components[j].long_name;
      continue;
    }

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 2 && locationFound.address_components[j].types[0] === 'locality') {
      locality = locationFound.address_components[j].long_name;
      continue;
    }

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 2 && locationFound.address_components[j].types[0] === 'administrative_area_level_2') {
      city = locationFound.address_components[j].long_name;
      continue;
    }

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 2 && locationFound.address_components[j].types[0] === 'administrative_area_level_1') {
      state = locationFound.address_components[j].long_name;
      continue;
    }

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 2 && locationFound.address_components[j].types[0] === 'country') {
      country = locationFound.address_components[j].long_name;
      continue;
    }

    if (locationFound.address_components[j].types !== null && locationFound.address_components[j].types.length === 1 && locationFound.address_components[j].types[0] === 'postal_code') {
      postalCode = locationFound.address_components[j].long_name;
      continue;
    }
  }

  cb({
    streetNumber: streetNumber,
    route: route,
    neighborhood: neighborhood,
    locality: locality,
    city: city,
    state: state,
    country: country,
    postalCode: postalCode,
    formattedAddress: formattedAddress,
    lat: lat,
    lng: lng
  });
}

/**
* @description 
	Receive two JSON objects representing each the latitude and longitude of a location and retrieves de distance between them.
  @see https://github.com/manuelbieh/Geolib	
	
* @param coordinatesA JSON representing latitude and longitude. Format example: {latitude: 51.5103, longitude: 7.49347}
* @param coordinatesB JSON representing latitude and longitude. Format example: {latitude: 51.5103, longitude: 7.49347}
* @callback cb Callback to be invoked when Location is created.
*/

var geolib = require('geolib');


exports.calculateDistanceBetweenCoordinates = function(coordinatesA, coordinatesB, cb){

	if (coordinatesA == null || coordinatesA["latitude"] == null || coordinatesA["longitude"] == null
		|| coordinatesB == null || coordinatesB["latitude"] == null || coordinatesB["longitude"] == null) {
		sails.log.debug("GeoHelper > Coordinates for distance > No valid coordinates");
		return cb(false);
	};
	
	return cb(geolib.getDistance(coordinatesA, coordinatesB));
}

















