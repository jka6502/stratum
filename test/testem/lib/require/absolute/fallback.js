(function() {


	try{
		module.exports = require('fallback2');
	}catch(e) {
		require.filter(e);
		// Success if we don't fall back to relative.
		module.exports = 'fallback';
	}


})();