(function() {
	'use strict';


	require('structure/iterator');


	var Set = require('structure/set'),
		Map	= require('structure/map');


	describe('set', function() {


		it('should be defined if required', function() {
			(Set != null).should.be.true;
		});

		it('should instantiate correctly, and without error', function() {
			var set = new Set();
			(set != null).should.be.true;
			set.size.should.equal(0);
		});

		it('should accept an array as a construction parameter', function() {
			var set = new Set([1]);
			set.size.should.equal(1);
			set.has(0).should.be.false;
			set.has(1).should.be.true;
			set.has(2).should.be.false;

			var set = new Set([1, 2, 3]);
			set.size.should.equal(3);
			set.has(0).should.be.false;
			set.has(1).should.be.true;
			set.has(2).should.be.true;
			set.has(3).should.be.true;
			set.has(4).should.be.false;

			var set = new Set([]);
			set.size.should.equal(0);
			set.has(0).should.be.false;
		});

		it('should accept another Set as a construction parameter', function() {
			var set = new Set([1]);

			var copy = new Set(set);
			copy.size.should.equal(1);
			copy.has(0).should.be.false;
			copy.has(1).should.be.true;
			copy.has(2).should.be.false;

			var set = new Set([1, 2, 3]);
			var copy = new Set(set);
			copy.size.should.equal(3);
			copy.has(0).should.be.false;
			copy.has(1).should.be.true;
			copy.has(2).should.be.true;
			copy.has(3).should.be.true;
			copy.has(4).should.be.false;

		});

		it('should add() elements specified', function() {
			var set = new Set([1]);

			set.size.should.equal(1);
			set.has(0).should.be.false;
			set.has(1).should.be.true;
			set.has(2).should.be.false;
			set.has(NaN).should.be.false;
			set.has('test').should.be.false;


			set.add(NaN);
			set.add('test');

			set.has(NaN).should.be.true;
			set.has('test').should.be.true;
		});

		it('should be able to create an array of contained values', function() {
			var source	= [2, 1, {}, 'test', false],
				index	= 0,
				set		= new Set(source),
				values	= set.toArray();

			for(var index = 0, length = values.length; index < length; index++) {
				values[index].should.be.exactly(source[index]);
			}
		});

	});


})();