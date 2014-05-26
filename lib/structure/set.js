(function(root) {
	"use strict";


	var Map			= require('./map'),
		iterator	= require('./iterator');


	var Set = Map.extend(function Set(iterable) {
		this.container = Object.create ? Object.create(null) : {};
		if (iterable) {
			var iter = iterator(iterable);
			for(var next = iter.next(); !next.done; next = iter.next()) {
				this.add(next.value);
			}
		}

	}, {

		add: function(value) {
			if (!this.has(value)) { this.set(value, value); }
			return this;
		},

		toArray: function() {
			var out	= [];
			for(var current = this.first; current; current = current.next) {
				out.push(current.key);
			}
			return out;
		}

	});


	iterator.register(Set, function(set) { return set.keys(); });


	root.Set = root.Set || Set;


	module.exports = Set;


})(this);