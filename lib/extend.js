(function() {


	var root = this, slice = Array.prototype.slice,
		splice = Array.prototype.splice;


	// ##							Extend
	// -------------------------------------------------------------------------
	//
	var extend = module.exports = function extend(dest) {
		var object = dest.prototype ? dest.prototype : dest, args = arguments;

		// Discover parent class, if possible
		if (dest.prototype && this !== root && this.prototype) {
			object = dest.prototype = new this();
			args = [null, this.prototype ? this.prototype : this].concat(
					slice.call(arguments, 1));

		}else if (dest.prototype) {
			for(var index = 1, length = args.length; index < length; index++) {
				var source = args[index];
				if (source.prototype) {
					object = dest.prototype = new args[index]();
					splice.call(args, index, 1);
					break;
				}
			}
		}

		// Augment the object or constructor with each object passed.
		for(var index = 1, length = arguments.length; index < length; index++) {
			var source = arguments[index];
			if (source.prototype) { source = source.prototype; }
			for(var name in source) {
				object[name] = source[name];
			}
		}

		// Add 'extend' function to the constructor.
		if (!dest.extend) { dest.extend = extend; }

		return dest;
	};

	// ##							Augment
	// -------------------------------------------------------------------------
	//
	extend.augment = function augment(dest) {
		for(var index = 1, length = arguments.length; index < length; index++) {
			var source = arguments[index];
			for(var name in source) {
				dest[name] = source[name];
			}
		}

		return dest;
	}


})();