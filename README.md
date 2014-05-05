# Stratum

A framework and component library for web application development.

Designed to provide a small modular basis upon which to build web applications.

To this end, the whole framework is built around a single core mechanism, the
modular inclusion functionality, in [require.js](./lib/require.js).


## Contents

* [Modularity](#modularity)
* [Quickstart](#quickstart)
* [Production](#production)
* [Testing](#testing)
* [Gotchas](#gotchas)
* [Philosophy](#just-why)


## Modularity

The `require` function:
* Is compatible with CommonJS Module/1.1
* Works with the `file:` protocol, for rapid prototyping
* Works with cross site urls
* Retains correct file and line number mapping for debugging/error handling.
* Is tested in a wide variety of browsers
* Passes CommonJS module unit tests (though two are in passed in error, see
[Gotchas](#Gotchas) for details)

The `define` function:
* Is compatible with [require.js](http://requirejs.org)
[AMD](http://requirejs.org/docs/whyamd.html)
* Is probably best suited to providing *mock* modules for testing purposes!


## Quickstart

To use Stratum, include the require script first:

``` HTML
	<script src='./stratum/lib/require.js'></script>
```


To include a component, require it, much as you would using node/CommonJS:

``` JS
	var someModule = require('someModule');
```

Remember to leave off the *'.js'* suffix, this is a module path, not a file
reference.


Relative paths can also be used, using the \*nix style `.` *(current)* and `..`
*(parent)* prefixes for the module:

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


## Production

This code is designed to facilitate faster building of applications.  It is
pretty thoroughly tested and works in a wide variety of environments, but it is
not designed to be used in production.

In production environments, you can bake your scripts into a safe, universally
compatible format, using
[Browserify](https://github.com/substack/node-browserify).

## Testing

[Open the CommonJS test suite page](./test/require/commonjs/index.html) to run
the tests. Remember to checkout the submodules required first in
[vendor](./vendor).

The tests need [printStackTrace](https://github.com/stacktracejs/stacktrace.js)
to allow referencing `exports` or `module.exports` after the first load and
execution of a module, due to the design of the CommonJS unit tests.

**This practise is not recommended.**
Although possible in the browser, through some arcane trickery, this practise is
rather unintuitive - it makes assumptions about a global variable reacting
differently depending on the source file it is referenced in.  It is better to
wrap a module in a function scope (you are doing that anyway, aren't you?), and
use local variables to maintain internal relationships, then explicitly export
any functions or objects.


## Gotchas

The browser is not the ideal environment for the CommonJS require approach, so
there are some potential pitfalls with this implementation:

- **Requiring a module that is not yet loaded throws an exception.**

This is *the fundamental trickery* that makes the require function possible in
the browser, but it has implications.

Any `try{ ... }catch{ ... }` in the current stack will catch the
*dependency abort* exception, that is used to halt script execution until
dependencies have been resolved.

To avoid this, either filter any exceptions caught, by calling
`require.filter(exception);` in your handler, or avoiding catching exceptions
from your `require` calls entirely.

Note: For this reason, two of the tests in the CommonJS module test suite pass
in error.  They catch the *'dependency abort'* exception, rather than the *'file
missing'* exception they expect.  Those tests would actually pass, if they
filtered out that exception, however.

- **Code preceeding require calls may be executed multiple times**

The exception abort/re-execute cycle also means that any code before, or between
`require` calls can be executed multiple times, if the script aborts to load a
dependency.

Also, for the same reason, wrapping a require in a `try{ ... }finally{ ... }`
handler may well invoke the *finally* clause zero or more times...

- **Inline scripts are not necessarily sequenced**

If a page contains multiple inline scripts, the order they are executed in will
be indeterminate (well, determinate, but according to complex rules).

This is because any script containing one or more `require` calls may, or may
not, cause execution of that script to be deferred, depending on whether its
dependencies have already been satisfied.

**Requiring in one inline script will not ensure dependencies are
met before executing subsequent scripts**.

So the following pattern should be avoided:

``` HTML
<script>
	var something = require('something');
</script>

<script>
	// Assume the above ensures availability...
	something.confabulate();
</script>
```

- **Global variables cannot be correctly supplied after module load**

The `module` and `exports` global variables are guaranteed to be correct during
the initial execution of a newly loaded module, but are not guaranteed to point
to the same values in closures created within that module.

There is no way to automatically wrap a remotely loaded script in a new scope,
which would be needed to implement this cleanly, so the best approach is to
only set `module.exports` or `exports` in the initial execution of a script, and
reference locally cached copies, to use any exported features internally.


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
Just don't add hard coupling between code in distinct inline script tags -
its icky.

Global `module` and `exports` access issues can be alleviated by including
[printStackTrace](https://github.com/stacktracejs/stacktrace.js) *before* the
require script in the page, but if possible, a simpler approach is to avoid
reading from `module` or `exports` directly after initialisation.

In summary

**GOOD**
``` JS
(function() {

	var something	= require('something'),
		other		= require('some/module/other');

	function Implementation() {}


	Implementation.staticMethod = function() {
		Implementation.blah();
	};

	module.exports = Implementation;

})();
```

**BAD**
``` JS
console.log('Echo'); // Executed *at least* once... woo!
try{
	exports = {
		other: require('some/other/module').feature,

		closure: function() {
			exports.other(); // Which 'exports' will this be?
		}
	};
}catch(e) {
	console.log('File missing: ' + e); // File missing: Dependency Abort
	// This will also prevent the 'next' file load being queued...
}
```


## Just... why?

Why not use one of the existing module loaders that tackle browser dependency
management, you ask?

Well, basically:

* I enjoyed writing it
* I hate the automagic and boilerplate required for mechanisms like AMD
* I personally find this approach makes for simple, clean, readable code
* I find that build steps/manual dependency management slow down prototyping,
and by doing so, inhibit my creativity and demotivate me
* The gotchas listed above are easily avoided
* I've convinced myself that anything that falls foul of the above is, in fact,
a code smell anyway :-P
