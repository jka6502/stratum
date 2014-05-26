(function() {


	var mine = require('./id2');

	module.exports = mine;

	module.exports = require(module.id) === mine ? 'id' : 'failure';


})();