(function() {
	'use strict';


	var sync	= require('sync'),
		then	= sync.then,
		async	= sync.async;



	// Verify that the integers in the array are in ascending order.
	function order(array) {
		var last = array.length ? array[0] - 1 : 0;
		array.forEach(function(item) {
			item.should.be.above(last);
			last = item;
		});
	}



	describe('sync', function() {


		it('should be defined when required', function() {
			(sync == null).should.be.false;
		});


		describe('then blocks', function() {


			it('should execute callbacks in order', function() {
				var result = [];

				then(function() { result.push(1); });
				then(function() { result.push(2); });
				then(function() { result.push(3); });

				result.length.should.be.exactly(3);
				order(result);
			});

			it('should block subsequent blocks until "complete" argument is called', function() {
				var complete	= null,
					result		= [];

				then(function(done) { result.push(1); complete = done; });
				then(function() { result.push(2); });

				result.length.should.be.exactly(1);

				complete();

				result.length.should.be.exactly(2);
				order(result);
			});

			it('should prevent subsequent blocks until async function is called', function(done) {
				var result = [];

				then(function() { result.push(1); });
				then(function() {
					// Postpone completion.
					setTimeout(async(function() {
						result.push(2);
					}), 0);
				});

				then(function() {
					result.push(3);

					result.length.should.be.exactly(3);
					order(result);
					done();
				});

				result.length.should.be.exactly(1);
			});


		});


		describe('sync blocks', function() {

			it('should group blocks declared within its scope', function(done) {

				var result = [];

				sync(function() {

					then(function() { result.push(1); });
					then(function() {
						// Postpone completion.
						setTimeout(async(function() {
							result.push(2);
						}), 0);
					});
					then(function() {
						result.push(3);
					});

				});

				then(function() {
					result.push(4);
					result.length.should.be.exactly(4);
					order(result);
					done();
				});
			});

			it('should not prevent subsequent sync blocks', function(done) {

				var result	= [],
					c1, c2;

				sync(function() {
					result.push(1);

					then(function(done) {
						c1 = done;
					});
					then(function() {
						result.push(4);
					});
				});

				sync(function() {
					result.push(2);

					then(function(done) {
						c2 = done;
					});
					then(function() {
						result.push(3);
					});
				});

				then(function() {
					result.length.should.be.exactly(4);
					order(result);
					done();
				});

				result.length.should.be.exactly(2);
				order(result);
				c2();

				result.length.should.be.exactly(3);
				order(result);
				c1();

			});

			it('should stack', function(done) {

				var result = [],
					complete;

				sync(function() {
					result.push(1);

					sync(function() {
						sync(function() {
							sync(function() {

								then(function(done) {
									complete = done;
									result.push(2);
								});
							});
						});

						then(function() {
							result.push(3);
						});
					});
				});

				then(function() {
					result.push(4);
				});

				result.length.should.be.exactly(2);
				order(result);

				complete();

				result.length.should.be.exactly(4);
				order(result);
				done();
			});

			it('should stack indirectly', function(done) {

				var result = [],
					complete;


				function a() {
					then(function(done) {
						complete = done;
						result.push(2);
					});
				}

				function b() {
					sync(function() {
						a();
					});
					then(function() {
						result.push(3);
					});
				}

				function c() {
					sync(function() {
						b();
					});
				}



				sync(function() {
					result.push(1);

					c();
				});

				then(function() {
					result.push(4);
				});

				result.length.should.be.exactly(2);
				order(result);

				complete();

				result.length.should.be.exactly(4);
				order(result);
				done();
			});

		});


		describe('async wrapped callbacks', function() {

			it('should maintain order even when defered', function(done) {

				var result = [];

				sync(function() {

					result.push(1);

					then(function() {
						// Postpone completion.
						setTimeout(async(function() {
							result.push(2);

							// Declared after '4', and '5' below.
							then(function() {
								result.push(3);
							});

						}), 0);
					});

				});

				then(function() {
					result.push(4);
					result.length.should.be.exactly(4);
					order(result);
					done();
				});

			});

			it('should mantain scope through asynchronous calls', function(done) {

				var result = [];

				sync(function() {

					result.push(1);

					sync(function() {
						// Postpone completion.
						setTimeout(async(function() {
							result.push(2);

							// Declared after '4', and '5' below.
							then(function() {
								result.push(3);
							});

						}), 0);

						then(function() {
							result.push(4);
						});

					});

					then(function() {
						result.push(5);
					});

				});

				result.length.should.be.exactly(1);

				then(function() {
					result.length.should.be.exactly(5);
					order(result);
					done();
				});

			});
		});


	});


})();