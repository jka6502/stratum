(function() {
	"use strict";


	var unique = require('./unique');


	function Name(name) {
		this.constructors = {};
	}

	Name.prototype = {

		get: function(object) {
			return this.constructors[unique(object)];
		},

		set: function(object, value) {
			this.constructors[unique(object)] = value;
		},

		delete: function(object) {
			delete this.constructors[unique(object)];
		}

	};


	module.exports = Name;


})();