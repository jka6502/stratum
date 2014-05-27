(function() {


	var extend = require('extend');


	describe('extend', function() {


		it('exists when required', function() {
			(extend == null).should.be.false;
			extend.should.be.a.Function;
		});

		it('should return the constructor passed', function() {
			function Test() {}
			extend(Test).should.be.exactly(Test);
		});

		it('should prototypically extend the first constructor supplied', function() {
			function Test1() {}
			function Test2() {}
			var extended = extend(Test1, Test2);
			extended.should.be.exactly(Test1);
			var instance = new Test1();
			instance.should.be.instanceof(Test1);
			instance.should.be.instanceof(Test2);
		});

		it('should have the correct constructor property', function() {
			function Test1() {}
			function Test2() {}
			var extended = extend(Test1, Test2);
			extended.should.be.exactly(Test1);
			var instance = new Test1();
			instance.constructor.should.be.exactly(Test1);
		});

		it('should inherit properties from subsequent arguments', function() {
			function Test1() {}
			function Test2() {}
			function Test3() {}
			Test2.prototype = { foo: 42 };
			Test3.prototype = { bar: 43 };

			extend(Test1, Test2, Test3);
			var instance = new Test1();
			instance.foo.should.be.exactly(42);
			instance.bar.should.be.exactly(43);
		});

		it('should inherit properties from plain objects', function() {
			function Test1() {}

			extend(Test1, { baz: 44 }, { qux: 'test' });
			var instance = new Test1();
			instance.baz.should.be.exactly(44);
			instance.qux.should.be.exactly('test');
		});

		it('should inherit getter and setter properties', function() {
			function Test1() {}

			var mine = {};

			extend(Test1, { get foo() { return mine; }, set foo(value) {} });
			var instance = new Test1();
			instance.foo.should.be.exactly(mine);
			instance.foo = 2;
			instance.foo.should.not.equal(2);
		});

		it('should automatically identify parent in "static method" mode', function() {
			function Test2() {}
			Test2.prototype.bar = 'qux';
			Test2.extend = extend;

			function Test1() {}
			Test2.extend(Test1);

			var instance = new Test1();
			instance.bar.should.equal('qux');
			instance.should.be.instanceof(Test1);
			instance.should.be.instanceof(Test2);
		});


	});


})();