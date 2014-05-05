# Stratum

A framework and component library for web application development.

Designed to provide a small modular basis upon which to build web applications.

To this end, the whole framework is built around a single core mechanism, the
modular inclusion functionality, in [require.js](./lib/require.js).

## Modularity

The `require` function:
* Is compatible with CommonJS Module/1.1
* Works with the `file:` protocol, for rapid prototyping
* Works with cross site urls
* Retains correct file and line number mapping for debugging/error handling.
* Is tested in a wide variety of browsers
* Passes CommonJS module unit tests (though two are in passed in error)

The `define` function has the following properties:
* Is compatible with [require.js](http://requirejs.org)
[AMD](http://requirejs.org/docs/whyamd.html)

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

Remember to leave off the *'.js'* suffix, this is a module path, not a file
reference.


Relative paths can also be used, using the *nix style `.` (current) and `..`
(parent) prefixes for the module:

``` JS
	var other = require('./some/other/module');
```


To export functionality from a module, assign it to `module.exports`:

``` JS
	module.exports = { ... exported object/function ... };
```


or the global `exports` variable:

``` JS
	exports = { ... exported object/function ... };
```

Requiring modules even works in *inline* script tags!

``` HTML
	<script>
		var something = require('../library/something');
	</script>
```


## Testing

[Open the CommonJS test suite rig](./test/require/commonjs/index.html) to run
the tests. Remember to checkout the submodules required first in
[vendor](./vendor).

[printStackTrace](https://github.com/stacktracejs/stacktrace.js) is required to
allow referencing `exports` or `module.exports` after the first load and
execution of a module, a feature required for the CommonJS/module test suite.

**This practise is not recommended.**
Although possible in the browser, through some arcane trickery, this practise is
rather unintuitive - it makes assumptions about a global variable reacting
differently depending on the source file it is referenced in.  It is better to
wrap a module in a function scope (you are doing that anyway, aren't you?), and
use local variables to maintain internal relationships, then explicitly export
any functions or objects.


## Gotchas

The browser is not really suited to the CommonJS require style, so there are
some potential pitfalls/gotchas:

- **Requiring a module that has not been loaded throws an exception.**

This is the fundamental *trick* that makes the require function possible in the
browser, but it has implications:

Any `try{ ... }catch{ ... }` in the current stack trace will catch the
*dependency abort* exception, that is used to halt script execution until
dependencies have been resolved.  To avoid this, either filter any exceptions in
your handler, by calling `require.filter(exception);` in your catch handler, or
avoiding catching exceptions from your `require` calls entirely.

- **Code preceeding require calls may be executed multiple times**

The exception abort/re-execute cycle also means that any code before, or between
`require` calls will be executed multiple times.

Also, for this reason, wrapping a require in a `try{}finally{}` handler may well
invoke the *finally* clause zero or more times...

- **Inline scripts are not necessarily sequenced**

If a page contains multiple inline scripts, the order they are executed in will
be indeterminate.

Any script containing one or more `require` calls may, or may not, cause
execution of that script to be deferred until its dependencies have been
satified.

**Requiring in one inline script will not ensure dependencies are
met before subsequent scripts are executed**.

- **Avoiding problems**

All of the multi-execution issues can be overcome by just avoiding mixing logic
with require calls, and requiring any dependencies at the top/start of any
file - which is generally good advice anyway.

If you *absolutely must* mix logic and `require` calls, be careful to cache state
globally to ensure the same path is taken if the logic is executed a second
(or n<sup>th</sup>) time.  Basically, any logic preceeding your `require` calls
must be idempotent - or odd things will happen.

For inline scripts, each script tag has its own dependency chain, read it as the
dictionary definition, if you require something in an inline script, you
**must** actually `require` it in that script, don't assume it is available.

Finally, just don't add hard coupling between code in distinct inline script
tags - its icky.


## Just... why?

Why not use one of the existing module mechanisms that have sprung up for
browser dependency management, you ask?

Well, the answer is:

* I enjoyed writing it
* I hate the automagic and boilerplate required for mechanisms like AMD
* I personally find this mechanism makes for simple, clean, readable code
* The gotchas listed above are easily avoided
* I've convinced myself that anything that falls foul of the above is, in fact,
a code smell anyway :-P
* I find this mechanism much, much faster for prototyping
