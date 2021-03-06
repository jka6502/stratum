(function() {
	'use strict';


	// ##							Augment
	// -------------------------------------------------------------------------
	//
	// Like extending, but dumber.
	//
	// This function applies all of the properties and methods of any supplied
	// objects to the `dest` object specified.
	//
	// Similar in functionality to the `extend` function, though differs in that
	// augment does not attempt to detect constructors, or ensure prototypical
	// inheritance, or adjust the prototype - it just copies all the things.
	// 
	// To use it, simply supply a destination, and one or more source objects:
	//
	// ``` js
	// var augment = require('stratum/lib/augment');
	//
	// var augmented = augment({a: 1}, {b: 'hello'});
	// ```
	// The returned object, `augmented` will be:
	//
	// ``` js
	//	{
	//		a: 1,
	//		b: 'hello'
	//	}
	// ```
	function augment(dest) {
		for(var index = 1, length = arguments.length; index < length; index++) {
			var source = arguments[index];
			for(var name in source) {
				dest[name] = source[name];
			}
		}

		return dest;
	};


	// Export the agument function.
	module.exports = augment;


})();