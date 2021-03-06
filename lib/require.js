(function(root) {
	'use strict';


	var STOP_EVENT = 'Dependency abort';



	// ##				Shortcuts and polyfills
	// ------------------------------------------------------------------------

	// Generic iterator.  Iterate over array elements, or object properties,
	// invoking the `callback` specified on each item, using
	// `Array.prototype.forEach` when available, or a polyfill, when not.
	function each(object, callback) {
		if (!object) { return true; }
		if (object.forEach) { return object.forEach(callback); }
		if (object instanceof Array) {
			var	length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				callback(array[index], index);
			}
		}else{
			for(var key in object) {
				if (!object.hasOwnProperty(key)) { continue; }
				callback(object[key], key);
			}
		}
		return false;
	}


	// Generic 'filter' function, return a copy of the array or object passed,
	// with only the elements/properties that have successfully passed the
	// `callback` function's validation.
	function filter(object, callback) {
		if (!object) { return true; }
		if (object.filter) { return object.filter(callback); }
		if (object instanceof Array) {
			var result = [],
				length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				if (callback(array[index], index)) {
					result.push(array[index]);
				}
			}
		}else{
			var result = {};
			for(var key in object) {
				if (!object.hasOwnProperty(key)) { continue; }
				if (callback(object[key], key)) {
					result[key] = object[key];
				}
			}
		}
		return false;
	}


	// Generic 'every' function.  Tolerant of null 'objects' and works on arrays
	// or arbitrary objects.
	function every(object, callback) {
		if (!object) { return true; }
		if (object.every) { return object.every(callback); }
		if (object instanceof Array) {
			var	length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				if (!callback(array[index], index)) { return false; }
			}
		}else{
			for(var key in object) {
				if (!object.hasOwnProperty(key)) { continue; }
				if (!callback(object[key], key)) { return false; }
			}
		}
		return true;
	}


	// Empty array tolerant `some` function. Test whether any single element in
	// the array specified passes the test provided by the `callback` given.
	function some(object, callback) {
		if (!object) { return true; }
		if (object.some) { return object.some(callback); }
		if (object instanceof Array) {
			var	length	= array ? array.length : 0;
			for(var index = 0; index < length; index++) {
				if (callback(array[index], index)) { return true; }
			}
		}else{
			for(var key in object) {
				if (!object.hasOwnProperty(key)) { continue; }
				if (callback(object[key], key)) { return true; }
			}
		}
		return false;
	}


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
	// one, and only one, `Loader`.  Typically, an app developer should not need
	// to care about this, but may use it to create new contexts, if required.

	var LOADER_ID = 1;

	function Loader() {}

	Loader.prototype = {


		init: function(config) {
			config = config || {};

			this.id			= LOADER_ID++;

			this.paths		= this.resolve(config.paths || ['./']);
			this.loaded		= clone(config.loaded) || {};
			this.failed		= clone(config.failed) || {};
			this.pending	= {};

			Loader.LOADERS.push(this);
			return this;
		},

		// Create a new `Loader`.  This method actually ensures that the loader
		// requested is a singleton, and locked to the config/source file it was
		// declared in.  This ensures that an application cannot accidentally
		// end up in an infinite loop of creating new `Loader` instances, due
		// to the abort/retry cycle approach of this implementation.
		clone: function(config) {
			var name = Script.current(this).id + '-'
						+ (config.paths || this.paths).join(',');

			if (!Loader.SINGLETONS[name]) {
				Loader.SINGLETONS[name] = new Loader().init({
					paths:	config.paths || this.paths,
					loaded:	config.loaded || this.loaded,
					parent: this
				});
			}

			return Loader.SINGLETONS[name];
		},

		// Resolve supplied paths relative to the current script, or page URL,
		// to configure absolute base paths of a `Loader` instance.
		resolve: function(paths) {
			var base = Script.current(this).absolute;
			each(paths, function(item, index) {
				var path = paths[index] = URL.absolute(URL.clean(item), base);
				if (path[path.length - 1] !== '/') {
					paths[index] += '/';
				}
			});
			return paths;
		},


		// Check whether a `Script` with the id supplied is already cached in
		// this `Loader`'s pipeline.
		cached: function(id) {
			return this.loaded[id] || this.failed[id] || this.pending[id];
		},


		// Queue the `Script` specified for loading.
		load: function(script) {
			if (script.loader !== this) { return script.loader.load(script); }

			Loader.loaded = false;
			if (this.loaded[script.id]) { return true; }
			if (this.failed[script.id]) {
				throw new Error('No such file: ' + script.url);
			}
			this.pending[script.id] = script;
			return false;
		},


		// Begin loading the next viable `Script`.
		next: function() {
			if (Loader.loading) { return false; }

			var count	= 0;

			if (some(this.pending, function(script) {
				count++;
				if (script.satisfied()) {
					Loader.loading = script;
					script.module.install();
					script.load();
					return true;
				}
				return false;
			}) || count === 0) { return true; }
			return false;
		},


		// Resolve a cyclic dependency between queued `Script`s.
		cycle: function() {
			var pending	= this.pending,
				script;

			for(var name in pending) {
				if (!pending.hasOwnProperty(name)) { continue; }
				var cycle = pending[name].cycle();
				if (cycle) {
					cycle[0].allow(cycle[1]);
					this.load(cycle[0]);
					return true;
				}
			}
		},


		// Event fired when a `Script` managed by this `Loader` has loaded.
		onload: function(script) {
			script.module.uninstall();
			if (script.stopped || (!script.callback && Loader.loading !== script)) {
				script.loader.load(script);
				Loader.next();
				return;
			}
			this.loaded[script.id] = script;
			delete this.pending[script.id];
			Loader.loading = null;
			Loader.next();
		},


		// Even fired when a `Script` managed by this `Loader` has failed.
		onfail: function(script) {
			script.module.uninstall();
			if (Loader.loading === script) {
				Loader.loading = null;
			}
			script.destroy();
			if (!script.next()) {
				delete this.pending[script.id];
				this.failed[script.id] = script;
			}
			Loader.next();
		},


		// Find the first `Script` that matches the `url` passed, resolving
		// possible base path relative urls.
		find: function(url) {
			var loaded		= this.loaded,
				pending		= this.pending,
				failed		= this.failed,
				relative	= this.relative(url);

			return loaded[relative] || pending[relative] || [failed[relative]];
		},


		require: function(module) {
			var current	= Script.current(this),
				script	= Script.url(module + '.js', this);

			if (current === script) {
				return current.module.exports;
			}

			if (this.loaded[script.id]) {
				return script.module.exports;
			}

			if (current.allowed[script.id]) {
				script.loader.load(script);
				return script.module.exports;
			}

			current.depend(script);
			current.loader.load(current);
			script.loader.load(script);

			if (current === Loader.loading) { Loader.loading = null; }

			Loader.next();

			if (current.allowed[script.id]) {
				return script.module.exports;
			}

			current.stop();
		},


		define: function(id, depends, callback) {

			function invoke() {
				var params = [];
				each(scripts, function(script) {
					params.push(script.module.exports);
				});
				return callback.apply(root, params);
			}

			var script	= Script.callback(invoke, id + '.js', this),
				current	= Script.current(this),
				loader	= this,
				loaded	= this.loaded,
				scripts = [],
				count	= 0;

			current.depend(script);
			script.loader.load(script);

			each(depends, function(depend) {
				var dscript = Script.url(depend, loader);
				scripts.push(dscript);
				script.depend(dscript);
				if (!loaded[dscript.id]) {
					loader.load(dscript);
				}
			});

			if (script.satisfied()) {
				script.load();
			}else{
				Loader.next();
				current.stop();
			}
		},


		// Use this `Loader` for the duration of the callback specified.
		use: function(callback) {
			var original = Loader.using;
			Loader.using = this;
			try{
				callback();
			}finally{
				Loader.using = original;
			}
		},


		// Find the `url` supplied, relative to the first matching base path.
		relative: function(url) {
			var paths = this.paths;
			for(var index = 0; index < paths.length; index++) {
				var path = paths[index];
				if (path === url.substring(0, path.length)) {
					return url.substring(path.length);
				}
			}
			return url;
		}



	};


	// Static API

	Loader.LOADERS		= [];
	Loader.SINGLETONS	= {};
	Loader.onready		= [];
	Loader.loaded		= true;


	Loader.next = function() {
		if (!Loader.content) { return; }
		var available = false;

		if (!some(Loader.LOADERS, function(loader) {
			available |= loader.next();
			return Loader.loading;
		}) && available) {

			if (some(Loader.LOADERS, function(loader) {
				return loader.cycle();
			})) {
				return Loader.next();
			}
		}

		if (!Loader.loading && !Loader.loaded) {
			Loader.loaded = true;
			Loader.check();
			return;
		}
	};


	Loader.check = function() {
		if (Loader.loading || !Loader.loaded || !Loader.content) { return; }
		Loader.check = function() {};
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent('DOMScriptsLoaded', true, true, null);
		document.dispatchEvent(event);
		return true;
	};


	document.addEventListener('DOMContentLoaded', function(event) {
		Loader.content = event;

		// Remove and queue any 'body' scripts that got mixed in by the content
		// load, before we start dynamic loading - otherwise *some* browsers
		// return the wrong 'current' script.
		var loader	= Loader.current,
			scripts	= document.body.getElementsByTagName('script');

		for(var index = 0, length = scripts.length; index < length; index++) {
			var script = Script.tag(scripts[index]);
			script.destroy();
			loader.load(script);
		}

		Loader.next();
		Loader.check()
	});


	Loader.inlineComplete = function() {
		Script.current().onload();
	};


	Object.defineProperty(Loader, 'current', {
		get: function() { return Loader.using || Script.current().loader; }
	});


	// ##							  Script
	// ------------------------------------------------------------------------
	// Convenience wrapper for all of the abstract concepts of a 'script' to be
	// loaded.

	var SCRIPT_MARKER	= 'stratum' + new Date().getTime(),
		SCRIPT_ID		= 1;

	function Script() {}

	Script.prototype = {


		init: function(config) {
			this.loader		= config.loader;
			this.callback	= config.callback;
			this.tag		= config.tag;
			this.requester	= config.requester;
			this.remain		= config.remain || [];

			this.url		= URL.clean(config.url
								|| URL.absolute(this.tag ? this.tag.src : null));

			this.absolute	= config.absolute || this.url;
			this.content	= this.tag ? this.tag.innerHTML : null;
			this.depends	= {};
			this.allowed	= {};


			this.id			= config.id || this.url || ('inline-script-' + SCRIPT_ID++);

			this.module		= config.module || new Module().init(
								{ id: this.id.substring(0, this.id.length - 3) });


			if (this.tag) { this.tag[SCRIPT_MARKER] = this; }

			return this;
		},


		// Select the next viable `path` from the owning `Loader` to try and
		// load this script from, returns true if another path is viable,
		// false if there are no remaining acceptable paths.
		next: function() {
			if (!this.remain.length) { return false; }
			var next		= this.remain.shift();
			this.absolute	= URL.absolute(this.url, next);
			return true;
		},


		// Attempt to load this `Script`.
		load: function() {
			delete this.stopped;
			if (this.callback) {
				try{
					this.module.exports = this.callback();
				}catch(e) {
					if (e === STOP_EVENT) {
						this.onfail();
					}else{
						return this.onfail();
					}
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

			this.bind();

			if (this.absolute) { tag.src = this.absolute; }
			else {
				var terminator = ';stratum.classes.Loader.inlineComplete();';

				try{
					tag.innerHTML = this.content + terminator;
				}catch(e) {
					// IE < 9 doesn't like setting the content of script tags
					// using innerHTML, and setting tag.text doesn't work on
					// 'sensible' browsers.
					tag.text = this.content + terminator;
				}
			}

			tag.defer = false;
			tag.async = false;

			tag[SCRIPT_MARKER] = this;
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
			if (this.events) { return; }

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
				script.onload();
			}

			function failed(event) {
				script.onfail();
			}

			function state(event) {
				switch(tag.readyState) {
					case 'complete':	return loaded(event);
					case 'error':		return failed(event);
				}
			}

			if (prefix === '') {
				tag[method](prefix + 'error', failed);
				tag[method](prefix + 'load', loaded);
			}else{
				tag[method](prefix + 'readystatechange', state);
			}

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
			var events	= this.events;
			if (!events) { return this; }

			var tag		= this.tag,
				prefix	= '',
				method	= 'removeEventListener';


			// Round and round we go...
			if (!tag.removeEventListener) {
				prefix = 'on';
				method = 'detachEvent';
			}

			tag[method](prefix + 'error', events.failed);
			tag[method](prefix + 'load', events.loaded);
			tag[method](prefix + 'readystatechange', events.state);

			delete this.events;
			return this;
		},


		// Event endpoint for a successfully loaded script.
		onload: function() {
			this.loader.onload(this);
		},


		// Event endpoint for a failed script load.
		onfail: function() {
			this.loader.onfail(this);
		},


		// Add a dependency upon the `Script` specified.
		depend: function(script) {
			var depends = this.depends;
			depends[script.id] = script;
		},


		// Check whether this `Script`'s dependencies have been satisfied.
		satisfied: function() {
			var depends	= this.depends,
				allowed	= this.allowed;

			return every(depends, function(depend) {
				return depend.loader.loaded[depend.id]
					|| depend.loader.failed[depend.id]
					|| allowed[depend.id];
			});
		},


		// Mark a dependency as allowed to load, even if this `Script` has not
		// yet completely loaded, to resolve cyclic dependencies.
		allow: function(script) {
			this.allowed[script.id] = true;
		},


		// Detect cyclic dependencies between this `Script` and those it depends
		// on.
		cycle: function(requesters, parent) {
			if (this.satisfied()) { return null; }
			requesters = requesters || {};
			var id = this.id;
			if (requesters[id] && !parent.allowed[id]) {
				return [parent, this];
			}

			requesters[id] = this;

			var depends = this.depends;
			for(var name in depends) {
				if (!depends.hasOwnProperty(name)) { continue; }
				var depend = depends[name],
					result = depend.cycle(requesters, this);
				if (result) { return result; }
			}

			delete requesters[id];
			return null;
		},


		// Stop this `Script` from executing, even if this function has been
		// called from within the actual code referenced by `Script`.
		stop: function() {
			this.loaded		= false;
			this.stopped	= true;

			var current = Script.current(this.loader);

			// Unbind and remove the relevant tag, if any.
			this.destroy();

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
			// does not have any `try{ ... }catch{ ... }` blocks along the way.
			var existing	= window.onerror,
				tag			= this.tag;

			function handler(event) {
				if (event.target !== window) {
					return true;
				}

				if (root.removeEventListener) {
					root.removeEventListener('error', handler, true);
				}else root.detachEvent('onerror', handler);

				window.onerror = existing;
				return Event.cancel(event);
			}

			window.onerror = handler;
			if (root.addEventListener) {
				root.addEventListener('error', handler, true);
			}else root.attachEvent('onerror', handler);

			throw STOP_EVENT;

		}


	};


	// Obtain the currently running `Script`.
	Script.current = function() {
		if (Loader.loading) { return Loader.loading; }

		if (document.currentScript) {
			var tag = document.currentScript;
		}else{
			var tags	= document.getElementsByTagName('script'),
				tag		= tags[tags.length - 1];
		}

		return Script.tag(tag, Loader.using || Loader.default);
	};


	// Obtain a `Script` instance representing the dom `tag` specified.
	Script.tag = function(tag, loader) {
		// Include the `Loader` id, to prevent cross talk.
		return tag[SCRIPT_MARKER]
			? tag[SCRIPT_MARKER] : tag[SCRIPT_MARKER] = new Script().init({
				loader:		loader,
				tag:		tag,
			});
	};


	// Obtain a `Script` instance representing the `url` specified.
	Script.url = function(url, loader) {
		url = URL.clean(url);

		var relative	= url.charAt(0) === '.',
			current		= Script.current(loader),
			base		= relative ? URL.path(current.absolute === ''
							? location.href : current.absolute) : loader.paths[0],
			remain		= relative ? [] : loader.paths.slice(1),
			absolute	= URL.absolute(url, base);

		// Resolve `url` relative to `Loader` paths, to ensure consistency, so
		// that mixing relative and absolute paths does not lead to multiple
		// `Script` instances referencing the same resource.

		url = loader.relative(absolute);
		var cached = loader.cached(url);

		// Use the current `Loader` cached instance, if it already exists.

		return cached ? cached : new Script().init({
			loader:		loader,
			url:		url,
			absolute:	absolute,
			remain:		remain,
			requester:	current
		});
	};


	// Obtain a `Script` instance wrapping the `callback` specified.
	Script.callback = function(callback, id, loader) {
		return new Script().init({
			loader:		loader,
			callback:	callback,
			id:			id || 'unknown'
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
			this.id			= config.id || 'unknown';

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
	// `exports` to the relevant `Module` instance, and its `exports` property
	// for the current context.

	// This is mainly to allow the CommonJS require test suite to work in the
	// browser - because it uses a terrible design pattern of assuming that the
	// `module` and `exports` globals are in fact scoped to the current file,
	// and therefore subsequently available after the initial load and execution
	// of the script, which cannot be consistently achieved in every browser.
	Module.install = function() {
		var module;

		if (root.printStackTrace) {
			module = function module() {
				var loader	= Script.current().loader,
					stack	= printStackTrace({ guess: false }),
					index	= 0,
					match	= stack[5].match(/@([^()]+):\d+:\d+/)
								|| stack[5].match(/@([^()]+):\d+/);

				if (match) {
					var script = loader.find(match[1]) || Script.current();
					return script.module;
				}else{
					return null;
				}
			}
		}else{
			module = function module() {
				return Script.current().module;
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
				var mod = module();
				mod.exports = value;
			}
		});

	};




	// ##								URL
	// ------------------------------------------------------------------------

	var URL = {

		// Convert a relative url to an absolute, relative to the `base` url
		// specified.
		absolute: function(url, base) {
			if (!url || url.indexOf('://') !== -1) { return url; }

			var anchor = document.createElement('a');
			anchor.href = (base || location.href);

			var protocol	= anchor.protocol + '//',
				host		= anchor.host,
				path		= anchor.pathname,
				parts		= filter(path.split('/'), function(part) { return part !== ''; });

			each(url.replace(/\?.*/, '').split('/'), function(part, index) {
				switch(part) {
					case '..':
						if (!parts.length) {
							throw new Error('Path outside of root: ' + url);
						}
						parts.length--;
						break;
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
		},

		// Change back slashes to forward slashes, for FF.
		clean: function(url) {
			if (!url) { return url; }
			return url.replace(/(\\|\%5c)/gi, '/');
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

	};


	// Initialise the default `Loader` context.
	Loader.default = new Loader().init()


	// Create the global scoped `require` function.
	root.require = root.require || function(module) {
		return Loader.current.require(module);
	};

	// Stratum specific helper, for dependency abort exception handling.
	root.require.filter = function(error) {
		if (error === STOP_EVENT) { throw error; }
	};

	// Create global scoped `define` function.
	root.define = function() {
		var args = arguments;
		// Slightly looser than AMD, identify supplied parameters by type.
		function extract(type) {
			for(var index = 0; index < 3; index++) {
				if (typeof args[index] === type) { return args[index]; }
			}
		}
		var id				= extract('string') || Script.current().id,
			dependencies	= extract('object') || [],
			callback		= extract('function');

		return Loader.current.define(id, dependencies, callback);
	};


})(this);