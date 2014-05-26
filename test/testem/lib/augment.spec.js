(function() {
	"use strict";


	var augment = require('augment');


	describe('augment', function() {


		it('should exist when required', function() {
			(augment == null).should.be.false;
		});

		it('Should augment objects in place', function() {
			var a = { foo: 42 },
				b = { bar: 'qux' };

			augment(a, b);
			a.foo.should.equal(42);
			a.bar.should.equal('qux');
		});

		it('Should allow multiple arguments', function() {
			var a = { foo: 42 },
				b = { bar: 'test' },
				c = { qux: 43 };

			augment(a, b, c);
			a.foo.should.equal(42);
			a.bar.should.equal('test');
			a.qux.should.equal(43);
		});

		it('Should not copy getters and setters, just values', function() {
			var count	= 1,
				a		= { foo: 42 },
				b		= { get bar() { return count++ } };

			augment(a, b);
			a.foo.should.equal(42);
			a.bar.should.equal(1);
			a.bar.should.equal(1);
		});

		it('Should not be dumb, with no regard to prototypes/constructors', function() {
			function Test1() {}
			function Test2() {}
			Test1.a = 'test';
			Test2.b = 42;
			Test2.prototype.c = 7;

			augment(Test1, Test2);
			Test1.a.should.be.exactly('test');
			Test1.b.should.be.exactly(42);
			var instance = new Test1();
			(instance.c != 7).should.be.true;
		});


	});


})();