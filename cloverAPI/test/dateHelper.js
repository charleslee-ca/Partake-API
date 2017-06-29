var expect = require('expect.js');

describe('Tests date validations', function() {

    describe('Test different combinations', function() {
        it('shouldn\'t fail', function(done) {

            expect(DateHelper.isValidDate("2014-02-12")).to.be(true);
            expect(DateHelper.isValidDate("2014-12-02")).to.be(true);
            expect(DateHelper.isValidDate("2014-02-12")).to.be(true);
            expect(DateHelper.isValidDate("2014-12-22")).to.be(true);
            expect(DateHelper.isValidDate("2014-02-31")).to.be(true);

            expect(DateHelper.isValidDate("201-02-31")).to.be(false);
            expect(DateHelper.isValidDate("2011-0-31")).to.be(false);
            expect(DateHelper.isValidDate("2011-01-3")).to.be(true);

            expect(DateHelper.isValidDate("2011-21-13")).to.be(false);
            expect(DateHelper.isValidDate("2011-11-43")).to.be(false);
            expect(DateHelper.isValidDate("2011-11-35")).to.be(false);

            expect(DateHelper.isValidDate("2011-00-05")).to.be(false);
            expect(DateHelper.isValidDate("2011-08-00")).to.be(false);

            expect(DateHelper.isValidDate("adasd")).to.be(false);
            expect(DateHelper.isValidDate(null)).to.be(false);
            expect(DateHelper.isValidDate("")).to.be(false);

            expect(DateHelper.isValidDate("2011-08-0022")).to.be(true);

            done();
        })
    })

})