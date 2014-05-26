(function() {


	stratum.classes.Loader.current.clone({
		paths: [
			'./order2',
			'./order1'
		]
	}).use(function() {

		module.exports = require('order');

	});


})();