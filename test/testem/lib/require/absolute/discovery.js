(function() {

	// Stratum specific hack to 
	var Loader		= stratum.classes.Loader;


	// Shenanigans to prevent using new loaders on each retry.
	Loader.default.clone({
		paths: [
			'./',
			'./missing',
			'./sub'
		]
	}).use(function() {

		module.exports = require('discovery2');

	});


})();