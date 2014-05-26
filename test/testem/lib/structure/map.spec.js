(function() {

	require('structure/iterator');

	var Map = require('structure/map');


	describe('Map shim', function() {


		it('should be defined if required', function() {
			(Map != null).should.be.true;
		});

		it('should instantiate correctly, and without error', function() {
			var map = new Map();
			(map != null).should.be.true;
			map.size.should.equal(0);
		});

		it('should accept an array of arrays as a construction parameter', function() {
			var map = new Map([[1,2]]);
			map.size.should.equal(1);
			map.has(0).should.be.false;
			map.has(1).should.be.true;
			map.has(2).should.be.false;
			map.get(1).should.equal(2);

			var map = new Map([[1, 'a'], [2, 'b'], [3, 'c']]);
			map.size.should.equal(3);
			map.has(0).should.be.false;
			map.has(1).should.be.true;
			map.has(2).should.be.true;
			map.has(3).should.be.true;
			map.has(4).should.be.false;

			map.get(1).should.equal('a');
			map.get(2).should.equal('b');
			map.get(3).should.equal('c');

			var map = new Map([]);
			map.size.should.equal(0);
			map.has(0).should.be.false;
		});

		it('should accept a Map as a construction parameter', function() {
			var map = new Map([[1, 2]]);

			var copy = new Map(map);
			copy.size.should.equal(1);
			copy.has(0).should.be.false;
			copy.has(1).should.be.true;
			copy.has(2).should.be.false;

			copy.get(1).should.equal(2);

			var map = new Map([[1, 'a'], [NaN, 'b'], [3, 'c']]);
			var copy = new Map(map);
			copy.size.should.equal(3);
			copy.has(0).should.be.false;
			copy.has(1).should.be.true;
			copy.has(NaN).should.be.true;
			copy.has(3).should.be.true;
			copy.has(4).should.be.false;

			copy.get(1).should.equal('a');
			copy.get(NaN).should.equal('b');
			copy.get(3).should.equal('c');

		});

		it('should be capable of using an integer as a key', function() {
			var map = new Map([[62, 4]]);

			map.size.should.equal(1);
			map.has(62).should.be.true;
			map.get(62).should.equal(4);
		});

		it('should be capable of using a float as a key', function() {
			var map = new Map([[-1.73, 4]]);

			map.size.should.equal(1);
			map.has(-1.73).should.be.true;
			map.get(-1.73).should.equal(4);
		});

		it('should be capable of using a string as a key', function() {
			var map = new Map([['somestring', 42]]);

			map.size.should.equal(1);
			map.has('somestring').should.be.true;
			map.get('somestring').should.equal(42);
		});

		it('should be capable of using NaN as a key', function() {
			var map = new Map([[NaN, 4]]);

			map.size.should.equal(1);
			map.has(NaN).should.be.true;
			map.get(NaN).should.equal(4);
		});

		it('should be capable of using Infinity as a key', function() {
			var map = new Map([[Infinity, 4]]);

			map.size.should.equal(1);
			map.has(Infinity).should.be.true;
			map.get(Infinity).should.equal(4);
			map.has(-Infinity).should.be.false;
		});

		it('should be capable of using undefined as a key', function() {
			var map = new Map([[undefined, 'test']]);

			map.size.should.equal(1);
			map.has(undefined).should.be.true;
			map.get(undefined).should.equal('test');
			map.has(null).should.be.false;
			map.has(false).should.be.false;
		});

		it('should be capable of using null as a key', function() {
			var map = new Map([[null, 'test']]);

			map.size.should.equal(1);
			map.has(null).should.be.true;
			map.get(null).should.equal('test');
			map.has(undefined).should.be.false;
			map.has(false).should.be.false;
		});

		it('should be capable of using a boolean as a key', function() {
			var map = new Map([[false, 'value']]);

			map.size.should.equal(1);
			map.has(false).should.be.true;
			map.get(false).should.equal('value');
			map.has(undefined).should.be.false;
			map.has(null).should.be.false;
		});

		it('should be capable of using an array as a key', function() {
			var array = [1, 2, 3];

			var map = new Map([[array, 'e']]);
			map.size.should.equal(1);
			map.has(array).should.be.true;
			map.get(array).should.equal('e');
		});

		it('should be capable of using objects as keys', function() {
			var o1 = {},
				o2 = {},
				o3 = {};

			var map = new Map([[o1, 'a'], [o2, 'b']]);
			map.size.should.equal(2);
			map.has(o1).should.be.true;
			map.has(o2).should.be.true;
			map.has(o3).should.be.false;

			map.get(o1).should.equal('a');
			map.get(o2).should.equal('b');
		});

		it('should be capable of using host objects as keys', function() {
			var host = new RegExp(/.*/);
			var map = new Map([[host, 'a']]);
			map.size.should.equal(1);
			map.has(host).should.be.true;

			map.get(host).should.equal('a');
		});

		it('should has() the things it actually contains', function() {
			var mine = {blah: 7};

			var map = new Map([[42, 1], [NaN, 1], ['test', 1], [mine, 1]]);

			map.size.should.equal(4);
			map.has(42).should.be.true;
			map.has(NaN).should.be.true;
			map.has('test').should.be.true;
			map.has(mine).should.be.true;

			map.has(Infinity).should.be.false;
			map.has('test2').should.be.false;
			map.has({blah: 7}).should.be.false;
		});

		it('should set() new items', function() {
			var map = new Map([[1, 2], [2, 3], [3, 4]]);
			map.size.should.equal(3);
			map.has(1).should.be.true;
			map.has(2).should.be.true;
			map.has(3).should.be.true;
			map.has(4).should.be.false;

			map.set(4, 'a');
			map.has(4).should.be.true;
			map.get(4).should.equal('a');
			map.size.should.equal(4);

			map.set(-Infinity, NaN);
			map.has(-Infinity).should.be.true;
			map.get(-Infinity).should.be.NaN;
			map.size.should.equal(5);
		});

		it('should delete() items', function() {
			var map = new Map([[1, 2], [NaN, 3], ['test', 4]]);
			map.size.should.equal(3);
			map.has(1).should.be.true;
			map.has(NaN).should.be.true;
			map.has('test').should.be.true;
			map.has(4).should.be.false;

			map.delete(NaN);
			map.has(NaN).should.be.false;
			map.size.should.equal(2);

			map.delete('test');
			map.has('test').should.be.false;
			map.size.should.equal(1);
		});

		it('should return undefined when a key is not found', function() {
			var map = new Map([[1, 2], [NaN, 3], ['test', 4]]);
			(map.get(4) === undefined).should.be.true;
		});

		it('should forEach over key/value pairs, in insertion order', function() {
			var source	= [[2, 1], [1, 2], [{}, 3], ['test', 4]],
				index	= 0,
				map		= new Map(source);

			map.forEach(function(value, key, ref) {
				ref.should.equal(map);
				key.should.equal(source[index][0]);
				value.should.equal(source[index++][1]);
			});
		});

		it('should return an iterator for values, in insertion order', function() {
			var source	= [[2, 1], [1, 2], [{}, 3], ['test', 4]],
				index	= 0,
				map		= new Map(source),
				values	= map.values();

			for(var next = values.next(); !next.done; next = values.next()) {
				next.value.should.equal(source[index++][1]);
			}
		});

		it('should return an iterator for keys, in insertion order', function() {
			var source	= [[2, 1], [1, 2], [{}, 3], ['test', 4]],
				index	= 0,
				map		= new Map(source),
				values	= map.keys();

			for(var next = values.next(); !next.done; next = values.next()) {
				next.value.should.equal(source[index++][0]);
			}
		});

		it('should return an iterator for entries, in insertion order', function() {
			var source	= [[2, 1], [1, 2], [{}, 3], ['test', 4]],
				index	= 0,
				map		= new Map(source),
				values	= map.entries();

			for(var next = values.next(); !next.done; next = values.next()) {
				next.value[0].should.equal(source[index][0]);
				next.value[1].should.equal(source[index++][1]);
			}
		});

		it('should return an iterator in insertion order', function() {
			var source	= [[2, 1], [1, 2], [{}, 3], ['test', 4]],
				index	= 0,
				map		= new Map(source),
				values	= map.iterator();

			for(var next = values.next(); !next.done; next = values.next()) {
				next.value[0].should.equal(source[index][0]);
				next.value[1].should.equal(source[index++][1]);
			}
		});

		it('should be able to create an array of contained values', function() {
			var source	= [[2, 1], [1, 2], [{}, 3], ['test', 4]],
				index	= 0,
				map		= new Map(source),
				values	= map.toArray();

			for(var index = 0, length = values.length; index < length; index++) {
				values[index][0].should.equal(source[index][0]);
				values[index][1].should.equal(source[index][1]);
			}
		});


	});

})();
