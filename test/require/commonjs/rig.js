
(function(root) {


	// Clear 'print', otherwise the CommonJS functions attempt to use it.
	root.print = undefined;


	var TEST_PATH = '../../../vendor/commonjs/tests/modules/1.0/';


	// Simple namespace for test rig functionality.
	var commonjs = root.commonjs = {

		// A map of _testName => result object
		tests: {},

		// The currently executing test.
		current: null,


		// Begin a subset of tests.
		start: function(name) {
			var sname = '_' + name;
			var test = commonjs.tests[sname] = commonjs.tests[sname] || {
				results:	[],
				name:		name,
				finished:	false,
				passed:		true
			};
			// Avoid repeating tests as a consequence of reloading them.
			commonjs.current = test.finished ? null : test;
		},

		// Indicate the success or failure of a 'sub test'
		result: function(subtest, pass) {
			pass = !!pass;
			if (!commonjs.current)  { return; }
			commonjs.current.results['_' + subtest] = pass;
			if (!pass) {
				commonjs.current.passed = false;
			}
		},

		// Indicate the end of a subset of tests.
		end: function() {
			if (!commonjs.current) { return; }
			var current = commonjs.current;
			commonjs.current = null;

			var display = '<h3 class="'
				+ (current.passed ? 'passed' : 'failed')
				+ '"">' + current.name + '</h3><ul>';

			var results = current.results;
			for(var test in results) {
				if (!results.hasOwnProperty(test)) { continue; }
				display += '<li class="'
					+ (results[test] ? 'passed' : 'failed') + '">'
					+ test.substring(1) + '</li>';
			}
			display += '</ul>';

			document.getElementById('results').innerHTML += display;
		}
	};


	// Define a nodejs like system module, containing a stdio.print to
	// intercept test results
	define('system', function() {

		return {
			stdio: {

				print: function(text) {
					var result = text.substring(0, 4);
					switch(result) {
						case 'PASS':
						case 'FAIL':
							commonjs.result(text.substring(5), result === 'PASS');
							break;
						case 'DONE':
							commonjs.end();
							break;
					}
				}

			}
		};

	});


	var Loader	= stratum.classes.Loader,
		loader	= Loader.current;


	commonjs.cache = {};


	// The actual test harness, create a sub Loader seeded with the relevant
	// test path, and include the 'program' module from it.
	commonjs.run = function run(base) {
		commonjs.start(base);

		var id		= '_' + base,
			local;

		if (commonjs.cache[id]) {
			local = commonjs.cache[id];
		}else{
			var path = TEST_PATH + base + '/';
			local = loader.clone({
				paths: [path]
			});
			commonjs.cache[id] = local;
		}

		local.use();
		require('program');
	}


})(this);
