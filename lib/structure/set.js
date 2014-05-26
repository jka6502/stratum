(function(root) {
	"use strict";


	var Map		= require('./map'),
		set		= Map.prototype.set;


	var Set = Map.extend(function Set(iterator) {
		this.container = Object.create ? Object.create(null) : {};
		if (iterator) {
			if (iterator.iterator) { iterator = iterator.iterator(); }
			for(var next = iterator.next(); !next.done; next = iterator.next()) {
				this.add(next.value);
			}
		}

	}, {

		set: function() {},

		add: function(value) {
			if (!this.has(value)) { set.call(this, value, value); }
			return this;
		},

		iterator: function() {
			return this.keys();
		},

		toArray: function() {
			var out	= [];
			for(var current = this.first; current; current = current.next) {
				out.push(current.key);
			}
			return out;
		}

	});


	root.Set = root.Set || Set;


	module.exports = Set;


})(this);