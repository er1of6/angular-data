describe('DS.filter(resourceName, params[, options])', function () {
	var errorPrefix = 'DS.filter(resourceName, params[, options]): ';

	it('should throw an error when method pre-conditions are not met', function (done) {
		assert.throws(function () {
			DS.filter('does not exist', {});
		}, DS.errors.RuntimeError, errorPrefix + 'does not exist is not a registered resource!');

		angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
			assert.throws(function () {
				DS.filter('post', key);
			}, DS.errors.IllegalArgumentError, errorPrefix + 'params: Must be an object!');
		});

		angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
			assert.throws(function () {
				DS.filter('post', key);
			}, DS.errors.IllegalArgumentError, errorPrefix + 'params: Must be an object!');
		});

		DS.inject('post', p1);

		angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
			if (key) {
				assert.throws(function () {
					DS.filter('post', {
						query: {
							where: key
						}
					});
				}, DS.errors.IllegalArgumentError, errorPrefix + 'params.query.where: Must be an object!');
			}
		});

		angular.forEach(TYPES_EXCEPT_STRING_OR_ARRAY, function (key) {
			if (key) {
				assert.throws(function () {
					DS.filter('post', {
						query: {
							orderBy: key
						}
					});
				}, DS.errors.IllegalArgumentError, errorPrefix + 'params.query.orderBy: Must be a string or an array!');
			}
		});

		angular.forEach(TYPES_EXCEPT_STRING_OR_ARRAY, function (key) {
			if (key) {
				assert.throws(function () {
					DS.filter('post', {
						query: {
							orderBy: [key]
						}
					});
				}, DS.errors.IllegalArgumentError, errorPrefix + 'params.query.orderBy[0]: Must be a string or an array!');
			}
		});

		angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
			if (key) {
				assert.throws(function () {
					DS.filter('post', {}, key);
				}, DS.errors.IllegalArgumentError, errorPrefix + 'options: Must be an object!');
			}
		});

		DS.filter('post', {});

		done();
	});
	it('should return an empty array if the query has never been made before', function (done) {
		$httpBackend.expectGET('http://test.angular-cache.com/posts?query=%7B%22where%22:%7B%22author%22:%7B%22%3D%3D%22:%22John%22%7D%7D%7D').respond(200, [p1]);

		assert.deepEqual(DS.filter('post', {
			query: {
				where: {
					author: {
						'==': 'John'
					}
				}
			}
		}, { loadFromServer: true }), [], 'should be an empty array');

		assert.deepEqual(DS.filter('post', {
			query: {
				where: {
					author: {
						'==': 'John'
					}
				}
			}
		}, { loadFromServer: true }), [], 'should still be an empty array because the request is pending');

		$httpBackend.flush();

		assert.deepEqual(DS.filter('post', {
			query: {
				where: {
					author: {
						'==': 'John'
					}
				}
			}
		}), [
			p1
		], 'should no longer be empty');
		done();
	});
	it('should correctly apply "where" predicates', function (done) {
		assert.doesNotThrow(function () {
			DS.inject('post', p1);
			DS.inject('post', p2);
			DS.inject('post', p3);
			DS.inject('post', p4);
		}, Error, 'should not throw an error');

		var params = {
			query: {
				where: {
					author: 'John'
				}
			}
		};

		assert.deepEqual(DS.filter('post', params), [p1], 'should default a string to "=="');

		params.query.where.author = {
			'==': 'John'
		};

		assert.deepEqual(DS.filter('post', params), [p1], 'should accept normal "==" clause');

		params.query.where.author = {
			'===': null
		};

		assert.deepEqual(DS.filter('post', params), [], 'should accept normal "===" clause');

		params.query.where.author = {
			'!=': 'John'
		};

		assert.deepEqual(DS.filter('post', params), [p2, p3, p4], 'should accept normal "!=" clause');

		params.query.where = {
			age: {
				'>': 31
			}
		};

		assert.deepEqual(DS.filter('post', params), [p3, p4], 'should accept normal ">" clause');

		params.query.where = {
			age: {
				'>=': 31
			}
		};

		assert.deepEqual(DS.filter('post', params), [p2, p3, p4], 'should accept normal ">=" clause');

		params.query.where = {
			age: {
				'<': 31
			}
		};

		assert.deepEqual(DS.filter('post', params), [p1], 'should accept normal "<" clause');

		params.query.where = {
			age: {
				'<=': 31
			}
		};

		assert.deepEqual(DS.filter('post', params), [p1, p2], 'should accept normal "<=" clause');

		params.query.where = {
			age: {
				'in': [30, 33]
			},
			author: {
				'in': ['John', 'Sally', 'Adam']
			}
		};

		assert.deepEqual(DS.filter('post', params), [p1, p4], 'should accept normal "in" clause');

		params.query.where = { age: { garbage: 'should have no effect' } };

		assert.deepEqual(DS.filter('post', params), [p1, p2, p3, p4], 'should return all elements');

		done();
	});
	it('should correctly apply "orderBy" predicates', function (done) {
		assert.doesNotThrow(function () {
			DS.inject('post', p1);
			DS.inject('post', p2);
			DS.inject('post', p3);
			DS.inject('post', p4);
		}, Error, 'should not throw an error');

		var params = {
			query: {
				orderBy: 'age'
			}
		};

		assert.deepEqual(DS.filter('post', params), [p1, p2, p3, p4], 'should accept a single string and sort in ascending order for numbers');

		params.query.orderBy = 'author';

		assert.deepEqual(DS.filter('post', params), [p4, p1, p3, p2], 'should accept a single string and sort in ascending for strings');

		params.query.orderBy = [
			['age', 'DESC']
		];

		assert.deepEqual(DS.filter('post', params), [p4, p3, p2, p1], 'should accept an array of an array and sort in descending for numbers');

		params.query.orderBy = [
			['author', 'DESC']
		];

		assert.deepEqual(DS.filter('post', params), [p2, p3, p1, p4], 'should accept an array of an array and sort in descending for strings');

		params.query.orderBy = ['age'];

		assert.deepEqual(DS.filter('post', params), [p1, p2, p3, p4], 'should accept an array of a string and sort in ascending for numbers');

		params.query.orderBy = ['author'];

		assert.deepEqual(DS.filter('post', params), [p4, p1, p3, p2], 'should accept an array of a string and sort in ascending for strings');

		done();
	});
	it('should correctly apply "skip" predicates', function (done) {
		assert.doesNotThrow(function () {
			DS.inject('post', p1);
			DS.inject('post', p2);
			DS.inject('post', p3);
			DS.inject('post', p4);
		}, Error, 'should not throw an error');

		var params = {
			query: {
				skip: 1
			}
		};

		assert.deepEqual(DS.filter('post', params), [p2, p3, p4], 'should skip 1');

		params.query.skip = 2;
		assert.deepEqual(DS.filter('post', params), [p3, p4], 'should skip 2');

		params.query.skip = 3;
		assert.deepEqual(DS.filter('post', params), [p4], 'should skip 3');

		params.query.skip = 4;
		assert.deepEqual(DS.filter('post', params), [], 'should skip 4');

		done();
	});
	it('should correctly apply "limit" predicates', function (done) {
		assert.doesNotThrow(function () {
			DS.inject('post', p1);
			DS.inject('post', p2);
			DS.inject('post', p3);
			DS.inject('post', p4);
		}, Error, 'should not throw an error');

		var params = {
			query: {
				limit: 1
			}
		};

		assert.deepEqual(DS.filter('post', params), [p1], 'should limit to 1');

		params.query.limit = 2;
		assert.deepEqual(DS.filter('post', params), [p1, p2], 'should limit to 2');

		params.query.limit = 3;
		assert.deepEqual(DS.filter('post', params), [p1, p2, p3], 'should limit to 3');

		params.query.limit = 4;
		assert.deepEqual(DS.filter('post', params), [p1, p2, p3, p4], 'should limit to 4');

		done();
	});
	it('should correctly apply "limit" and "skip" predicates together', function (done) {
		assert.doesNotThrow(function () {
			DS.inject('post', p1);
			DS.inject('post', p2);
			DS.inject('post', p3);
			DS.inject('post', p4);
		}, Error, 'should not throw an error');

		var params = {
			query: {
				limit: 1,
				skip: 1
			}
		};

		assert.deepEqual(DS.filter('post', params), [p2], 'should limit to 1 and skip 2');

		params.query.limit = 2;
		assert.deepEqual(DS.filter('post', params), [p2, p3], 'should limit to 2 and skip 1');

		params.query.skip = 2;
		assert.deepEqual(DS.filter('post', params), [p3, p4], 'should limit to 2 and skip 2');

		params.query.limit = 1;
		params.query.skip = 3;
		assert.deepEqual(DS.filter('post', params), [p4], 'should limit to 1 and skip 3');

		done();
	});
	it('should allow custom "where" filter function', function (done) {
		DS.defineResource({
			name: 'comment',
			filter: function (resourceName, where, attrs) {
				return attrs.author === where.author.EQUALS || attrs.age % where.age.MOD === 1;
			}
		});
		assert.doesNotThrow(function () {
			DS.inject('comment', p1);
			DS.inject('comment', p2);
			DS.inject('comment', p3);
			DS.inject('comment', p4);
		}, Error, 'should not throw an error');

		var params = {
			query: {
				where: {
					author: {
						'EQUALS': 'John'
					},
					age: {
						'MOD': 30
					}
				}
			}
		};

		assert.deepEqual(DS.filter('comment', params), [p1, p2], 'should keep p1 and p2');

		done();
	});
});
