(function() {


	stratum.classes.Loader.current.clone({
		paths: [
			'./common'
		]
	}).use(function() {

		var absolute	= require('common2'),
			relative	= require('./common/common2');

		module.exports	= absolute === relative ? 'common' : 'failure';

	});


})();