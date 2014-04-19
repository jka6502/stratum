(function(root) {
	"use strict";



	// ##				Shortcuts and polyfills
	// ------------------------------------------------------------------------

	// Empty array tolerant `each` function.  Iterate over an array, invoking
	// the `callback` specified on each item, using `Array.prototype.forEach` if
	// available, or a polyfill, if not.
	var each = Array.prototype.forEach
		? function each(array, callback) {
			if (array) { array.forEach(callback); }
		} : function each(array, callback) {
			var	length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				callback(array[index], index);
			}
		};


	// Empty array tolerant `filter` function.  Return a copy of a specified
	// array filtered by the `callback` specified, using `Array.prototype.filter`
	// if available, or a polyfill, if not.
	var filter = Array.prototype.filter
		? function filter(array, callback) {
			return array ? array.filter(callback) : array;
		} : function filter(array, callback) {
			var result	= [],
				length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				if (callback(array[index])) { result.push(array[index]); }
			}
			return result;
		}


	// Empty array tolerant `every` function. Test whether every element in the
	// array specified passes the test provided by the `callback` given.
	var every = Array.prototype.every
		? function every(array, callback) {
			if (array) { array.every(callback); }
			else { return true; }
		} : function every(array, callback) {
			var	length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				if (!callback(array[index], index)) { return false; }
			}
			return true;
		};


	// Empty array tolerant `some` function. Test whether any single element in
	// the array specified passes the test provided by the `callback` given.
	var some = Array.prototype.some
		? function some(array, callback) {
			if (array) { array.some(callback); }
			else { return false; }
		} : function some(array, callback) {
			var	length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				if (!callback(array[index], index)) { return true; }
			}
			return false;
		};


	// Create a clone of the object specified.  If `deep` is truthy, clone any
	// referenced properties too.
	function clone(object, deep) {
		if (!object) { return object; }
		var clone = object.prototype
						? Object.create(object.prototype.constructor) : {};

		for(var key in object) {
			if (!object.hasOwnProperty(key)) { continue; }
			clone[key] = deep ? clone(object[key], deep) : object[key];
		}
		return clone;
	}




	// ##								Loader
	// ------------------------------------------------------------------------
	// Context handler for script loading.  All `Script` instances are owned by
	// a particular `Loader`.  Typically, an app developer should not need to
	// care about this, but may use it to create a new context for dependency
	// management.  An example of this would be in unit tests, where scripts may
	// need to be loaded multiple times, in different contexts, in order to
	// prevent the test environment influencing the actual code under test.

	function Loader() {}

	Loader.prototype = {


		init: function(config) {
			config = config || {};

			this.paths		= this.makePaths(config.paths || ['./']);
			this.loaded		= clone(config.loaded) || {};
			this.loading	= {};
		},


		// Resolve supplied paths relative to the current URL, to configure a
		// `Loader` instance.
		makePaths: function(paths) {
			var base = Script.current(this).absolute;
			each(paths, function(item, index) {
				paths[index] = URL.absolute(item, base);
			});
			return paths;
		},


		// Load the next viable `Script`, with dependencies that are satisfied.
		next: function() {
			var complete = true;
			some(this.loading, function(script) {
				complete = false;
				if (script.satisfied()) {
					script.load();
					return true;
				}
				return false;
			});

			if (!complete) {
				// Dependency cycle detected.
			}
		}


	};




	// ##							  Script
	// ------------------------------------------------------------------------
	// Convenience wrapper for all of the abstract concepts of a 'script' to be
	// loaded.

	var SCRIPT_MARKER = 'requireScript';

	function Script() {}

	Script.prototype = {


		init: function(config) {
			this.loader		= config.loader;
			this.callback	= config.callback;
			this.tag		= config.tag;
			this.requester	= config.requester;

			this.url		= config.url
								|| URL.absolute(this.tag ? this.tag.src : null);

			this.absolute	= config.absolute || this.url;
			this.content	= this.tag ? this.tag.innerHTML : null;
			this.depends	= [];
			this.allowed	= {};

			this.module		= config.module || new Module().init(
								{ name: config.moduleName || this.url });

			if (this.tag) { this.tag[SCRIPT_MARKER] = this; }

			return this;
		},


		// Select the next viable `path` from the owning `Loader` to try and
		// load this script from, returns true if another path is viable,
		// false if there are no remaining acceptable paths.
		next: function() {
			if (!this.remain.length) { return false; }
			var next = this.remain.unshift();
			this.absolute = URL.absolute(this.url, next);
			return true;
		},


		// Attempt to load this `Script`.
		load: function() {
			this.module.install();
			if (this.callback) {
				try{
					this.callback();
				}catch(e) {
					return this.onfail();
				}
				return this.onload();
			}else{
				this.create();
				this.bind();
				document.head.appendChild(this.tag);
			}
		},


		// Create a `<script>` tag representing this `Script` instance.
		create: function() {
			if (this.tag) { return this.tag; }

			if (!this.absolute && !this.content) { return null; }

			var tag = this.tag = document.createElement('script');
			tag.type = 'text/javascript';

			if (this.absolute) { tag.src = this.absolute; }
			else {
				try{
					tag.innerHTML = this.content;
				}catch(e) {
					// IE < 9 doesn't like setting the content of script tags
					// using innerHTML, and setting tag.text doesn't work on
					// 'sensible' browsers.
					tag.text = this.content;
				}
			}

			return tag;
		},


		// Remove and destroy any `<script>` tags associated with this `Script`
		// instance, effectively preventing them from loading, if they were
		// queued.
		destroy: function() {
			var tag = this.tag;

			if (!tag) { return false; }

			this.unbind();
			if (tag.parentNode) { tag.parentNode.removeChild(tag); }

			delete this.tag;
			return true;
		},


		// Bind events to indicate success, or failure, of loading this
		// `Script` instance.
		bind: function() {
			var tag		= this.tag,
				script	= this,
				prefix	= '',
				method	= 'addEventListener';

			// The alternative is nuking Redmond from orbit, its the only way to
			// be sure...
			if (!tag.addEventListener) {
				prefix = 'on';
				method = 'attachEvent';
			}

			function loaded(event) {
				if (script.onload) script.onload(script, script.requester);
				return Event.cancel(event);
			}

			function failed(event) {
				if (script.onfail) script.onfail(script, script.requester);
				return Event.cancel(event);
			}

			function state(event) {
				if (tag.readyState == 'complete') {
					return loaded(event);
				}else if (tag.readyState == 'error') {
					return failed(event);
				}
			}

			tag[method](prefix + 'error', failed, false);
			tag[method](prefix + 'load', loaded, false);
			tag[method](prefix + 'readystatechange', state, false);

			this.events = {
				loaded:	loaded,
				failed:	failed,
				state:	state
			};

			return this;
		},


		// Remove event listeners attached to the `<script>` tag associated with
		// this `Script` instance.
		unbind: function() {
			var events	= this.events,
				tag		= this.tag,
				prefix	= '',
				method	= 'removeEventListener';

			if (!state) { return this; }

			// Round and round we go...
			if (!tag.removeEventListener) {
				prefix = 'on';
				method = 'detachEvent';
			}

			tag[method](prefix + 'error', events.failed, false);
			tag[method](prefix + 'load', events.loaded, false);
			tag[method](prefix + 'readystatechange', events.state, false);

			delete this.events;
			return this;
		},


		// Event endpoint for a successfully loaded script.
		onload: function() {
			this.module.uninstall();
			this.loader.next();
		},


		// Event endpoint for a failed script load.
		onfail: function() {
			this.module.uninstall();
			if (!this.next()) {
				throw new Exception('Failed to load ' + this.url
						+ ', included from ' + this.requester.url);
			}
			this.loader.next();
		},


		// Check whether this `Script`'s dependencies have been satisfied.
		satisfied: function() {
			var loader	= this.loader,
				depends	= this.depends,
				allowed	= this.allowed;

			return every(depends, function(depend) {
				return loader.loaded[depend.url] || allowed[depend.url];
			});
		},


		// Mark a dependency as allowed to load, even if this `Script` has not
		// yet completely loaded, to resolve cyclic dependencies.
		allow: function(script) {
			this.allowed[script.url] = true;
		},


		// Stop this `Script` from executing, even if this function has been
		// called from within this script.
		stop: function(before) {

			this.loaded		= false;
			this.stopped	= true;

			// Unbind and remove the relevant tag, if any.
			this.destroy();

			// Execute a supplied callback after scrapping the script, but
			// before halting execution.
			if (before) {
				var value = before();
				if (value) return value;
			}

			if (Script.current(this.loader) !== this) { return; }

			// Welcome traveller!  You've discovered the ugly truth!  This is
			// the 'magic' of the require script, allowing execution to be
			// halted until dependencies have been satisfied.  Basically it:
			//
			// * Sets up top level error handlers
			// * throws an error
			// * catches that error at the top level
			// * reverts the handling functionality back to its original state
			//
			// It is definitely not pretty, but by doing so we can halt
			// execution of a script at an arbitrary point, as long as the stack
			// does not have any `try{}catch{}`'s along the way.
			var existing = window.onerror;
			function handler(event) {
				if (root.removeEventListener) {
					root.removeEventListener('error', handler, true);
				}else root.detachEvent('onerror', handler);

				window.onerror = existing;
				return Event.cancel(event);
			}

			if (root.addEventListener) {
				root.addEventListener('error', handler, true);
			}else root.attachEvent('onerror', handler);
			window.onerror = handler;

			throw 'Script abort';

		}


	};


	// Obtain the currently running `Script`.
	Script.current = function(loader) {
		loader = loader || Loader.default;
		if (loader.current) { return loader.current; }
		var scripts	= document.getElementsByTagName('script'),
			tag		= scripts[scripts.length - 1];
		return loader.current = Script.tag(tag);
	};


	// Obtain a `Script` instance representing the dom `tag` specified.
	Script.tag = function(tag, loader) {
		loader = loader || Loader.default;
		if (tag[SCRIPT_MARKER]) { return tag[SCRIPT_MARKER]; }
		return new Script().init({
			loader:		loader,
			tag:		tag,
		});
	};


	// Obtain a `Script` instance representing the `url` specified.
	Script.url = function(url, loader) {
		loader = loader || Loader.default;
		var relative	= url.charAt(0) === '.',
			current		= Script.current(loader),
			base		= relative ? current.url : loader.paths[0],
			remain		= relative ? [] : loader.paths.slice(1),
			absolute	= URL.absolute(url, base);

		if (relative) { url = absolute; }

		var script = loader.loaded[url];
		script = script || loader.loading[url];
		return script || new Script().init({
			loader:		loader,
			url:		url,
			absolute:	absolute,
			remain:		remain,
			requester:	current
		});
	};


	// Obtain a `Script` instance wrapping the `callback` specified.
	Script.callback = function(callback, name, loader) {
		loader = loader || Loader.default;
		return new Script().init({
			loader:		loader,
			callback:	callback,
			name:		name || 'unknown'
		});
	};




	// ##							  Module
	// ------------------------------------------------------------------------
	// Container class for the `module` object in a CommonJS require style
	// environment.

	function Module() {}

	Module.prototype = {

		init: function(config) {
			this.exports	= config.exports || {};
			this.name		= config.name || 'unknown';

			return this;
		},

		// Set this `Module` as the current, pushing any existing instances to
		// the stack.
		install: function() {
			if (Module.current) {
				Module.stack.push(root.module);
				Module.current = this;
			}
		},

		// Remove this `Module` from the current state, popping the previous
		// `Module` from the stack to replace it.
		uninstall: function() {
			Module.current = Module.stack.pop();
		}

	};

	Module.stack = [];

	// Install automagic handlers, to redirect global references to `module` and
	// `exports` to the relevant `Module` instance, and `Module.exports` for the
	// current context.

	// This is mainly to allow the CommonJS require test suite to work in the
	// browser - because it uses a terrible design pattern of assuming that the
	// `module` and `exports` globals are in fact scoped to the current file,
	// and therefore subsequently available after the initial load and execution
	// of the script, which cannot be consistently achieved in every browser.
	Module.install = function() {
		function module() {
			var error = new Error(),
				stack = error.stack,
				split = stack.split(/[\n|\r|\n\r|\r\n]/)[2],
				match = split ? split.match(/\(.*?\):/) : null;

			if (match) {
				return Script.url(URL.absolute(match[1])).module
					|| Module.current;
			}else{
				return null;
			}
		}

		// Resolve global `module` access to the relevant instance.
		Object.defineProperty(root, 'module', {
			get: function() {
				return module();
			},
			set: function() {
				throw 'Setting module is a BAD idea';
			}
		});

		// Resolve global `exports` access to property on the relevant module.
		Object.defineProperty(root, 'exports', {
			get: function() {
				var mod = module();
				return mod ? mod.exports : null;
			},
			set: function(value) {
				module.exports = value;
			}
		})
	};




	// ##								URL
	// ------------------------------------------------------------------------

	var URL = {

		// Convert a relative url to an absolute, relative to the `base` url
		// specified.
		absolute: function(url, base) {
			if (!url || url.indexOf('://') !== -1) { return url; }

			base = this.path(base || location.href).match(
						/(?:(\w+:\/\/)([\w\.]*(?::\d+)?))?([^?#].*)/);

			var	protocol	= base[1] || '',
				host		= base[2] || '',
				parts		= filter(base[3].split('/'),
								function(item) { return item !== ''; });

			each(url.split('/'), function(part, index) {
				switch(part) {
					case '..':	parts.length--; break;
					case '.':	break;
					default:	parts.push(part); break
				}
			});
			return protocol + host + '/' + parts.join('/');
		},

		// Remove the filename from a url, if possible, returning the url
		// describing only the parent 'path'.
		path: function(url) {
			var index = url ? url.lastIndexOf('/') : -1;
			return index == -1 ? url : url.substring(0, index + 1);
		}

	};




	// ##							Event
	// ------------------------------------------------------------------------

	var Event = {

		cancel: function(event) {
			if (!event) event = window.event;
			if (!event) { return false; }

			// Try EVERYTHING to prevent an event from being processed.
			event.cancelBubble = true;
			if (event.preventDefault) { event.preventDefault(); }
			else event.returnValue = true;
			if (event.stop) { event.stop() };
			if (event.stopPropagation) { event.stopPropagation(); }

			return false;
		}

	};




	// ##						Initialisation
	// ------------------------------------------------------------------------


	// Set up global `module` and `exports` properties.
	Module.install();


	// Expose internal classes, for masochists.
	root.stratum = {

		classes: {
			Loader:		Loader,
			Script:		Script,
			Module:		Module,
			URL:		URL,
			Event:		Event
		},

		// Initialise the default `Loader` context.
		loader: Loader.default = new Loader()
	};




})(this);