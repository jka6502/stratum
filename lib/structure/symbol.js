(function(root) {
	'use strict';



	if (root.Symbol) {

		// Use the browser variant, if it exists.
		module.exports = root.Symbol;

	}else{

		// Otherwise shim in a polyfill.
		var unique = require('./unique');


		var Symbol = function Symbol(name) {
			this.name	= name;
			this.id		= unique.id(name);
		};

		Symbol.prototype = {

			toString: function() {
				return this.id;
			}

		};


		module.exports = root.Symbol = function(name) {
			return new Symbol(name);
		};

	}


})(this);