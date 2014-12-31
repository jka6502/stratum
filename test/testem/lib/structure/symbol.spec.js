(function() {
	'use strict';


	var should = require('../../../../node_modules/should/should'),
		Symbol = require('structure/symbol');


	describe('Symbol', function() {


		it('should be defined when required', function() {
			(Symbol == null).should.be.false;
		});

		it('should allow creation of hidden data associated with objects', function() {
			var symbol = Symbol();

			var object	= {},
				hidden	= {};

			object[symbol] = hidden;

			object[symbol].should.be.exactly(hidden);
		});

		it('should allow removal of hidden data', function() {
			var symbol1 = Symbol(),
				symbol2 = Symbol();

			var object	= {},
				hidden	= {};

			object[symbol1] = hidden;
			object[symbol1].should.be.exactly(hidden);

			should(object[symbol2]).be.undefined;

			delete object[symbol1];

			should(object[symbol1]).be.undefined;
		});


	});

})();