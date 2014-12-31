(function() {
	'use strict';


	var Symbol = require('./symbol');


	var ITERATOR = Symbol('@@iterator');


	function iterator(object) {
		var create = object.constructor[ITERATOR];
		if (!create) { throw new Error('Not an iterator'); }
		var iter = create(object);
		iter.iterator = function() { return value; };
		return iter;
	}


	iterator.register = function(constructor, iterator) {
		constructor[ITERATOR] = iterator;
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