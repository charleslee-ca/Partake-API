var expect = require('expect.js');

describe('Tests geoHelper functions', function() {

    describe('GeoHelper test of distances between two correct coordinates', function() {
        it("Correct distance calculated", function(done) {
            var coordA = '{"latitude" : 51.5103, "longitude": 7.49347}';
            var coordB = '{"latitude" : "51° 31\' N", "longitude": "7° 28\' E"}';
            try {
                var cA = JSON.parse(coordA);
                var cB = JSON.parse(coordB);
            } catch (err) {
                console.log("Error: " + err);
            }
            GeoHelper.calculateDistanceBetweenCoordinates(cA, cB, function(distance) {
                expect(distance).to.be.equal(1991);
                done();
            })
        });
    })

    describe('GeoHelper test of Google Geocoding geocode from address to latitude and longitude', function() {
        it('Correct latitude and longitude', function(done) {
            var address = 'One Embarcadero Center, 9th Floor, San Francisco, CA 94111';
            GeoHelper.getLatitudeAndLongitudeFromAddress(address, function(json) {
                expect(json.lat).to.be.equal(37.7949973);
                expect(json.lng).to.be.equal(-122.3994346);
                done();
            });
        })
    })

    describe('GeoHelper test of creating a Location with a defined address', function() {
        it('Location created', function(done) {
            var address = 'One Embarcadero Center, 9th Floor, San Francisco, CA 94111';
            GeoHelper.getAndCreateLocationForAddress(address, function(location) {
                expect(location.lat).to.be.equal(37.7949973);
                expect(location.lon).to.be.equal(-122.3994346);
                done();
            });
        })
    })
});