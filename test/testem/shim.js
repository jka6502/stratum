(function() {
	'use strict';


	// Prevent testem from running mocha.run on DOMContentLoaded, since we will
	// only start loading them then - instead, trigger the run from
	// DOMScriptsLoaded - the custom stratum event.
	var original = mocha.run;
	mocha.run = function() {};


	window.addEventListener('DOMScriptsLoaded', function() {
		original.call(mocha);
	});



})();
