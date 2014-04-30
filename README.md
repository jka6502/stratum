# Stratum

A framework and component library for web application development.

The primary purpose is to provide a small modular basis upon which to build web
applications, providing modules to handle common glue functionality.

To this end, the whole framework is built around a single mechanism, the
modular inclusion functionality, in [require.js](./lib/require.js).

The `require` function:
* Is compatible with CommonJS Module/1.1
* Works with `file:` protocol, for rapid prototyping
* Works with cross site urls
* Retains correct file and line number mapping for debugging/error handling.
* Is tested in a wide variety of browsers
* Passes CommonJS module unit tests (though two are in passed in error)

The `define` function has the following properties:
* Is compatible with [require.js](requirejs.org) [AMD](http://requirejs.org/docs/whyamd.html)

Both `require` and `define` are interoperable, and compatible with
[require.js](requirejs.org)'s [r.js](https://github.com/jrburke/r.js)
optimiser, to build production JavaScript.

