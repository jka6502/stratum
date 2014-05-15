(function(root) {
	"use strict";


	var BLACK		= 'color: black;',
		RED			= 'color: red;',
		BLUE		= 'color: blue;',
		GREEN		= 'color: green;',
		CYAN		= 'color: cyan;',
		YELLOW		= 'color: yellow;',
		DARK_YELLOW	= 'color: darkkhaki',
		MAGENTA		= 'color: magenta;',
		ORANGE		= 'color: orange;',
		OLIVE		= 'color: olive',

		BOLD		= 'font-weight: bold';

	function combine() { return Array.prototype.join.apply(arguments, [',']); }


	var QUEUE	= combine(BLUE),
		FAILED	= combine(RED, BOLD),
		LOADED	= combine(GREEN),
		DEPEND	= combine(DARK_YELLOW),
		STOP	= combine(BLACK),
		REQUIRE	= combine(CYAN),
		LOAD	= combine(MAGENTA),
		NEXT	= combine(BLACK),
		USE		= combine(ORANGE, BOLD),
		DEFINE	= combine(OLIVE),
		ALLOW	= combine(RED);


	var stratum = root.stratum.classes;


	function s(item) {
		if (item instanceof stratum.Script) {
			return '[' + item.loader.id + '] ' + item.loader.relative(item.id);
		}else if (item instanceof stratum.Loader) {
			return '[' + item.id + ']';
		}else return new String(item).toString();
	}

	var colour = (window.console && window.console.firebug) || window.chrome;

	function output(style) {

		if (colour) {
			var format = '%c';
			var out = [format, style];
		}else{
			var format = '';
			var out = [];
		}
		for(var index = 1; index < arguments.length; index++) {
			if (typeof arguments[index]  === 'string') {
				format += ' %s';
			}else{
				format += ' %o';
			}
			out.push(arguments[index]);
		}
		if (colour) { out[0] = format; }
		console.log.apply(console, out);
	}

	function intercept(constructor, method, style, callback, direct) {
		var proto = constructor.prototype ? constructor.prototype : constructor,
			original = proto[method];

		if (direct) {
			proto		= constructor;
			original	= proto[method];
		}

		proto[method] = function() {
			var out = callback.apply(this, arguments);
			if (out instanceof Array) {
				out.unshift(style);
				output.apply(this, out);
			}else if (out !== false) {
				output(style, out);
			}
			var result = original.apply(this, arguments);
			return result;
		};

	}


	intercept(stratum.Loader, 'load', QUEUE, function(script) {
		return [s(this), 'queued: ', s(script)]; });

	intercept(stratum.Loader, 'onfail', FAILED, function(script) {
		return [s(this), 'failed: ', s(script)]; });

	intercept(stratum.Loader, 'onload', LOADED, function(script) {
		return script.stopped ? false : [s(this), 'loaded: ', s(script)]; });

	intercept(stratum.Loader, 'require', REQUIRE, function(url) {
		return [s(this), 'require:', url]; });

	intercept(stratum.Loader, 'next', NEXT, function(script) {
		return [(stratum.Loader.loading ? ('Loader.next - skipping, already loading: '
			+ s(stratum.Loader.loading)) : 'Loader.next')]; }, true);

	intercept(stratum.Loader, 'use', USE, function(script) {
		return [s(this), 'use loader, with paths: [', this.paths.join(', '), ']']; });

	intercept(stratum.Loader, 'define', DEFINE, function(name) {
		return [s(this), 'define:', name]; });

	intercept(stratum.Script, 'depend', DEPEND, function(script) {
		return [s(this.loader), 'script: (', s(this), ') depend:', s(script)]; });

	intercept(stratum.Script, 'stop', STOP, function(script) {
		return [s(this.loader), 'stopped:', s(this)]; });

	intercept(stratum.Script, 'load', LOAD, function(script) {
		return [s(this.loader), 'loading:', s(this)]; });

	intercept(stratum.Script, 'allow', ALLOW, function(script) {
		return [s(this.loader), 'script: (', s(this), ') allow:', s(script)]; });


})(this);
