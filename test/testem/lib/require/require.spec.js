(function() {
	'use strict';


	function trapped(file) {
		try{
			return require(file);
		}catch(e) {
			require.filter(e);
			return 'failure';
		}
	}



	var basic = {
		exports:	trapped('./basic/exports'),
		module:		trapped('./basic/module'),
		equivalent:	trapped('./basic/equivalent'),
		id:			trapped('./basic/id'),
		missing:	trapped('./basic/missing')
	};

	var absolute = {
		fallback:	trapped('./absolute/fallback'),
		discovery:	trapped('./absolute/discovery'),
		order:		trapped('./absolute/order')
	};

	var relative = {
		relative:	trapped('./relative/relative'),
		parent:		trapped('./relative/parent'),
		mixed:		trapped('./relative/mixed'),
		common:		trapped('./relative/common'),
	}

	var cyclic = {
		self:		trapped('./cyclic/self'),
		separate:	trapped('./cyclic/separate'),
		multi:		trapped('./cyclic/multi')
	};


	describe('require', function() {


		it('should support global exports', function() {
			basic.exports.should.equal('exports');
		});

		it('should support module.exports', function() {
			basic.module.should.equal('module');
		});

		it('should make module.exports and exports equivalent', function() {
			basic.equivalent.should.equal('equivalent');
		});

		it('should have a self-referential module.id', function() {
			basic.id.should.equal('id');
		});

		it('should throw when a file is missing', function() {
			(function() { require('./basic/missing') }).should.throw();
		});

		describe('with absolute paths', function() {

			it('should not fallback to relative paths', function() {
				absolute.fallback.should.equal('fallback');
			});

			it('should find modules on any of the paths', function() {
				absolute.discovery.should.equal('discovery');
			});

			it('should search paths in the order specified', function() {
				absolute.order.should.equal('order');
			});

		});


		describe('with relative paths', function() {

			it('should identify relative paths', function() {
				relative.relative.should.equal('relative');
			});

			it('should allow parent segments', function() {
				relative.parent.should.equal('parent');
			});

			it('should allow mixing with absolute paths', function() {
				relative.mixed.should.equal('mixed');
			});

			it('should recognise common modules', function() {
				relative.common.should.equal('common');
			});

		});


		describe('with a cyclic dependency', function() {

			it('should handle self referential modules', function() {
				cyclic.self.should.equal('self');
			});

			it('should handle cyclically dependent modules', function() {
				cyclic.separate.should.equal('separate');
			});

			it('should handle chains with multiple cycles', function() {
				cyclic.multi.should.equal('multi');
			});

		});


	});


})();