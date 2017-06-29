var apn = require('apn');

var sendAPN = function(tokens, data, next) {
	if(tokens.length === 0) {
		next();
		return;
	}

	console.log('---Sending APN to ' + tokens.join());
	var i;
	for(i =0 ; i < tokens.length; i++) {
        var device = new apn.Device(tokens[i]);

        var note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = data.badge;
        note.sound = "ping.aiff";
        note.alert = data.alert;
        note.payload = data;

        sails.apnConnection.pushNotification(note, device);
	}

	next();
};

exports.sendNotification = function(userId, data, next) {
	sails.log.debug("-----Sending push notification to the user-----" + userId);

	var filter = {id : userId};
	User.find(filter).exec(function(err, users) {
		if (!err && users && users.length){
			var user = users[0];
			if (user.deviceToken) {	
				sails.log.debug("User device token:" + user.deviceToken);

				var tokens = [];
				tokens.push(user.deviceToken);
				var badge = user.badge_counter ? user.badge_counter + 1 : 1;
				data.badge = badge;					
				var newUser = {
					badge_counter : badge
				};
				User.update(filter, newUser).exec(function(err, userUpdated) {
					sendAPN(tokens, data, next);
				    sails.log.debug(data);
				    sails.log.debug("-----Push notification sent-----");
				});				
			} else {
				console.log("Error: Device token not found");
				next();
			};			
		} else {
			console.log("Error: " + err);
			next();
		}
	})
};