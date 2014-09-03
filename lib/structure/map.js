(function(root) {
	"use strict";


	var extend		= require('../extend'),
		unique		= require('./unique'),
		iterator	= require('./iterator');


	var Map = extend(function Map(iterable) {
		this.container = Object.create ? Object.create(null) : {};
		if (iterable) {
			var iter = iterator(iterable);
			for(var next = iter.next(); !next.done; next = iter.next()) {
				this.set(next.value[0], next.value[1]);
			}
		}

	}, {

		first:	null,
		last:	null,
		size:	0,

		set: function(key, value) {
			var container = this.container;
			if (!this.last) {
				this.last = this.first = container[unique(key)] = {
					next:	null,
					prev:	null,
					key:	key,
					value:	value
				};
			}else{
				var id = unique(key);
				if (container[id]) { this.delete(key); }
				var entry = {
					next:	null,
					prev:	this.last,
					key:	key,
					value:	value
				};
				if (this.last) { this.last.next = entry; }
				this.last = container[id] = entry;
			}
			this.size++;
			return this;
		},

		get: function(key) {
			var item = this.container[unique(key)];
			return item ? item.value : undefined;
		},

		clear: function() {
			this.first = this.last = null;

			this.size		= 0;
			this.container	= Object.create ? Object.create(null) : {};
		},

		delete: function(key) {
			var	container	= this.container,
				id			= unique(key),
				entry		= container[id];

			if (!entry) { return false; }

			if (entry.next) { entry.next.prev = entry.prev; }
			else this.last = entry.prev;
			if (entry.prev) { entry.prev.next = entry.next; }
			else this.first = entry.next;

			delete container[id];
			this.size--;
			return true;
		},

		has: function(key) {
			return !!this.container[unique(key)];
		},

		entries: function() {
			var list	= this,
				current	= {next: this.first};

			function next() {
				current		= current ? current.next : null;
				next.value	= current ? [current.key, current.value] : undefined;
				next.done	= !current;
				return next;
			};

			return { next: next };
		},

		keys: function() {
			var list	= this,
				current	= {next: this.first};

			function next() {
				current		= current ? current.next : null;
				next.value	= current ? current.key : undefined;
				next.done	= !current;
				return next;
			};

			return { next: next };
		},

		values: function() {
			var list	= this,
				current	= {next: this.first};

			function next() {
				current		= current ? current.next : null;
				next.value	= current ? current.value : undefined;
				next.done	= !current;
				return next;
			};

			return { next: next };
		},

		forEach: function(callback, thisArg) {
			if (thisArg) {
				for(var current = this.first; current; current = current.next) {
					callback.call(thisArg, current.value, current.key, this);
				}
			}else{
				for(var current = this.first; current; current = current.next) {
					callback(current.value, current.key, this);
				}
			}
		},

		toArray: function() {
			var out	= [];
			for(var current = this.first; current; current = current.next) {
				out.push([current.key, current.value]);
			}
			return out;
		},

	});


	iterator.register(Map, function(map) { return map.entries(); });


	root.Map = root.Map || Map;


	module.exports = Map;


})(this);