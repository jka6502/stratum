(function() {


	stratum.classes.Loader.current.clone({
		paths: [
			'./mixed/'
		]
	}).use(function() {

		module.exports = require('./mixed/mixed1');

	});


})();
