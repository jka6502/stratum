(function() {


	var Name = require('./name');


	var property = new Name('@@iterator');


	function iterator(object) {
		var create = property.get(object.constructor);
		if (!create) { throw new Error('Not an iterator'); }
		var iter = create(object);
		iter.iterator = function() { return value; };
		return iter;
	}


	iterator.register = function(constructor, iterator) {
		property.set(constructor, iterator);
	};


	iterator.register(Array, function ArrayIterator(array) {
		var length	= array.length,
			index	= 0;

		function next() {
			next.value	= array[index++];
			next.done	= index > length;
			return next;
		}

		return { next: next };
	});


	module.exports = iterator;


})();