# Stratum

A framework and component library for web application development.

Designed to provide a small modular basis upon which to build web applications.

To this end, the whole framework is built around a single core mechanism, the
modular inclusion functionality, in [require.js](./lib/require.js).

## Modularity

The `require` function:
* Is compatible with CommonJS Module/1.1
* Works with `file:` protocol, for rapid prototyping
* Works with cross site urls
* Retains correct file and line number mapping for debugging/error handling.
* Is tested in a wide variety of browsers
* Passes CommonJS module unit tests (though two are in passed in error)

The `define` function has the following properties:
* Is compatible with [require.js](http://requirejs.org) [AMD](http://requirejs.org/docs/whyamd.html)

Both `require` and `define` are interoperable, and compatible with
[require.js](http://requirejs.org)'s [r.js](https://github.com/jrburke/r.js)
optimiser, to build production JavaScript.

## Quickstart

To use Stratum, include the require script first:

``` HTML
	<script src='relative/stratum/lib/require.js'></script>
```

To include a component, require it, much as you would using CommonJS:

``` JS
	var someModule = require('someModule');
```

Relative paths can also be used, using the *nix style `.` (current) and
`..` (parent) prefixes for the module:

``` JS
	var other = require('./some/other/module');
```

