(function() {


	var Name = require('structure/name');


	describe('name', function() {


		it('should be defined when required', function() {
			(Name == null).should.be.false;
		});

		it('should allow creation of hidden data associated with objects', function() {
			var name = new Name();

			var object	= {},
				mine	= {};

			name.set(object, mine);
			name.get(object).should.be.exactly(mine);
		});

		it('should allow removal of hidden data', function() {
			var name = new Name();

			var object	= {},
				mine	= {};

			name.set(object, mine);
			name.get(object).should.be.exactly(mine);

			name.delete(object);
			(name.get(object) == null).should.be.true;
		});


	});

})();