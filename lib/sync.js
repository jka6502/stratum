(function() {
	"use strict";


	/*
	 * Simple synchronisation in an asynchronous world.
	 *
	 * The sync function is designed to provide a trivial mechanism for
	 * coordinating a catastrophe (that is the collective noun, isn't it?) of
	 * asynchronous calls.
	 *
	 * Sync is not designed to replace promises, or coordinate and collate
	 * results from complex arrangements of aysnchronous calls, like async.
	 *
	 * It is, merely, a barebones way of ensuring that a mixture of synchronous
	 * and asynchronous code occur in a deterministic order - without having to
	 * juggle explicit callbacks at every step.
	 *
	 * Usage:
	 *
	 * `then` 	- register a callback to occur only once previously declared
	 *			  blocks have completed.
	 *
	 * `sync`	- register a new context, logically grouping any other contexts
	 *			  or callbacks declared in its scope.
	 *
	 * `async`	- wrap a callback function, to ensure that the current context
	 *			  is in scope when it executes.
	 *
	 * `then` can accept callbacks with a single parameter, and will pass
	 * the specified callback a function, which, when executed, indicates
	 * completion of the specified block - allowing manual management of
	 * completion for more complex use cases.
	 *
	 * Examples:
	 *
	 * ``` JS
	 *	doSomething(async(function(error, result) { console.log('result'); }));
	 *	then(function() { doSomethingAfterPreviousResult(); });
	 * ```
	 *
	 * ``` JS
	 *	sync(function() {
	 		console.log('1');
	 *		doSomething(async(function() { console.log('2'); }));
	 *	});
	 *	then(function() {
	 *		console.log('3');
	 *	});
	 * ```
	 */

	function Context(parent) {
		this.count		= 0;
		this.callbacks	= [];
		this.parent		= parent;
	}


	// The top of the stack of current contexts
	var context	= new Context();


	function lock(context) {
		context.count++;
		var unlocked = false;

		return function() {
			if (unlocked) { return; }
			unlocked = true;
			context.count--;
			execute(context);
		};
	}

	function execute(target) {
		var original = context;
		while(target.count === 0) {
			if (target.callbacks.length > target.start) {
				var callback = target.callbacks.shift();
				context = target;
				callback(callback.length ? lock(target) : null);
			}else{
				if (!target.parent) { break; }
				target = target.parent;
				target.count--;
			}
		}
		context = original;
	}

	function sync(callback) {
		context = new Context(context);
		context.parent.count++;
		context.count++;
		try{
			callback();
		}finally{
			context.count--;
			execute(context);
			context = context.parent;
		}
	}

	function then(callback) {
		if (context.insert !== undefined) {
			context.callbacks.splice(context.insert++, 0, callback); }
		else { context.callbacks.push(callback); }
		return execute(context);
	}

	function async(callback) {
		var target		= context,
			release		= lock(target);

		return function() {
			var original = context;

			context			= target;
			context.insert	= 0;

			try{
				return callback.apply(this, arguments);
			}finally{
				context = original;
				release();
			}
		};
	}


	sync.then		= then;
	sync.async		= async;


	module.exports	= sync;


})();