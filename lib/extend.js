(function(root) {
	'use strict';


	var slice	= Array.prototype.slice,
		splice	= Array.prototype.splice;


	// ##							Extend
	// -------------------------------------------------------------------------
	//
	// Extend a class or an object with the properties and methods of any of the
	// subsequent classes, or objects supplied.
	//
	// This function differs from most existing implementations of `extend` in
	// two key ways:
	//
	// * The first parameter is always the constructor or object to extend
	// * The next *constructor* parameter, or *parent* constructor is treated as
	// the actual prototype/base class.
	//
	// These differences have the following benefit:
	//
	// * The constructor being extended actually has the correctly associated
	// type - in Chrome dev tools, Firebug, etc, instances of the class are
	// correctly named, rather than all being named 'child', for instance.
	// * The newly extended class actually has its prototype set to an instance
	// of the base class (or first *constructor* parameter), so instances of the
	// returned construcotr are genuinely subclasses of that base class.  If you
	// were to execute:
	//
	// ``` js
	// function A() {}
	// var B = extend(function B() {}, A);
	// ```
	//
	// then `new B() instanceof A` will be `true`.
	//
	// ## Usage
	//
	// There are two methods of operation, as a function, and as a static
	// method.
	//
	// **As a function:**
	//
	// ``` js
	//	var B = extend(function B() {}, A);
	// ```
	//
	// The result, `B`, will be assigned function supplied, but with a base
	// class of `A`, inheriting all of the properties/methods on `B`'s prototype.
	//
	// **As a method:**
	//
	// ``` js
	//	function A() {}
	//	A.extend = extend;
	//	var B = A.extend(function B() {});
	// ```
	//
	// Which achieves the same as the example above, but automatically detects
	// the base class, when called as a static method.
	//
	// Any constructor extended by the `extend` function automatically inherits
	// the static `extend` method itself, to simplify further extension.  So,
	// following on from the above example, you could create a further subclass
	// of `B`:
	//
	// ``` js
	//	var C = B.extend(function C() {}, {d: function() { ...} });
	// ```
	//
	// The result, `C` will be a bonafide instance of both `A` and `B`, will
	// have the instance method `d`, as explicitly requested, and will
	// inherit `C.extend` as well.

	var extend = function extend(dest) {
		var object = dest.prototype ? dest.prototype : dest, args = arguments;


		// Discover static method parent class, if available
		if (dest.prototype && this !== root && this && this.prototype) {
			object = dest.prototype = Object.create(this.prototype ? this.prototype : this);
			args = [null, this.prototype ? this.prototype : this].concat(
					slice.call(arguments, 1));
			object.constructor = dest;

		// Use next constructor from arguments as base class.
		}else if (dest.prototype) {
			for(var index = 1, length = args.length; index < length; index++) {
				var source = args[index];
				if (source.prototype) {
					object = dest.prototype = Object.create(source.prototype);
					splice.call(args, index, 1);
					object.constructor = dest;
					break;
				}
			}
		}

		// Augment the object or constructor with each object passed.
		for(var index = 1, length = arguments.length; index < length; index++) {
			var item	= arguments[index],
				source	= item.prototype ? item.prototype : item,
				names	= Object.getOwnPropertyNames(source);

			for(var sub = 0, slen = names.length; sub < slen; sub++) {
				var name = names[sub];
				Object.defineProperty(object, name,
						Object.getOwnPropertyDescriptor(source, name));
			}
		}

		// Add 'extend' function to the constructor.
		if (!dest.extend) { dest.extend = extend; }

		return dest;
	};


	// Template factory function.
	extend.create = function(options) {
		return new this().create(options);
	};


	// Export the extend function.
	module.exports = extend;


})(this);