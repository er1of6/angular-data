var observe = require('observejs'),
	errorPrefix = 'DS.inject(resourceName, attrs[, options]): ';

function _inject(definition, resource, attrs) {
	var _this = this;

	function _react(added, removed, changed, getOldValueFn) {
		try {
			var innerId = getOldValueFn(definition.idAttribute);

			resource.changes[innerId] = _this.utils.diffObjectFromOldObject(resource.index[innerId], resource.previousAttributes[innerId]);
			resource.modified[innerId] = _this.utils.updateTimestamp(resource.modified[innerId]);
			resource.collectionModified = _this.utils.updateTimestamp(resource.collectionModified);

			if (definition.idAttribute in changed) {
				$log.error('Doh! You just changed the primary key of an object! ' +
					'I don\'t know how to handle this yet, so your data for the "' + definition.name +
					'" resource is now in an undefined (probably broken) state.');
			}
		} catch (err) {
			throw new _this.errors.UnhandledError(err);
		}
	}

	if (_this.utils.isArray(attrs)) {
		for (var i = 0; i < attrs.length; i++) {
			_inject.call(_this, definition, resource, attrs[i]);
		}
	} else {
		if (!(definition.idAttribute in attrs)) {
			throw new _this.errors.RuntimeError(errorPrefix + 'attrs: Must contain the property specified by `idAttribute`!');
		} else {
			var id = attrs[definition.idAttribute];

			if (!(id in resource.index)) {
				resource.index[id] = {};
				resource.previousAttributes[id] = {};

				_this.utils.deepMixIn(resource.index[id], attrs);
				_this.utils.deepMixIn(resource.previousAttributes[id], attrs);

				resource.collection.push(resource.index[id]);

				resource.observers[id] = new observe.ObjectObserver(resource.index[id], _react);

				_react({}, {}, {}, function () {
					return id;
				});
			} else {
				_this.utils.deepMixIn(resource.index[id], attrs);
				resource.observers[id].deliver();
			}
		}
	}
}

/**
 * @doc method
 * @id DS.sync_methods:inject
 * @name inject
 * @description
 * Inject the given item into the data store as the specified type. If `attrs` is an array, inject each item into the
 * data store. Injecting an item into the data store does not save it to the server.
 *
 * ## Signature:
 * ```js
 * DS.inject(resourceName, attrs[, options])
 * ```
 *
 * ## Examples:
 *
 * ```js
 * DS.get('document', 45); // undefined
 *
 * DS.inject('document', { title: 'How to Cook', id: 45 });
 *
 * DS.get('document', 45); // { title: 'How to Cook', id: 45 }
 * ```
 *
 * Inject a collection into the data store:
 *
 * ```js
 * DS.filter('document'); // [ ]
 *
 * DS.inject('document', [ { title: 'How to Cook', id: 45 }, { title: 'How to Eat', id: 46 } ]);
 *
 * DS.filter('document'); // [ { title: 'How to Cook', id: 45 }, { title: 'How to Eat', id: 46 } ]
 * ```
 *
 * ## Throws
 *
 * - `{IllegalArgumentError}`
 * - `{RuntimeError}`
 * - `{UnhandledError}`
 *
 * @param {string} resourceName The resource type, e.g. 'user', 'comment', etc.
 * @param {object|array} attrs The item or collection of items to inject into the data store.
 * @param {object=} options Optional configuration. Properties:
 * - `{string=}` - `mergeStrategy` - Specify the merge strategy to use if the item is already in the cache. Default: `"mergeWithExisting"`.
 * @returns {object|array} A reference to the item that was injected into the data store or an array of references to
 * the items that were injected into the data store.
 */
function inject(resourceName, attrs, options) {
	options = options || {};

	if (!this.definitions[resourceName]) {
		throw new this.errors.RuntimeError(errorPrefix + resourceName + ' is not a registered resource!');
	} else if (!this.utils.isObject(attrs) && !this.utils.isArray(attrs)) {
		throw new this.errors.IllegalArgumentError(errorPrefix + 'attrs: Must be an object or an array!', { attrs: { actual: typeof attrs, expected: 'object|array' } });
	} else if (!this.utils.isObject(options)) {
		throw new this.errors.IllegalArgumentError(errorPrefix + 'options: Must be an object!', { options: { actual: typeof options, expected: 'object' } });
	}

	var definition = this.definitions[resourceName],
		resource = this.store[resourceName],
		_this = this;

	try {
		if (!this.$rootScope.$$phase) {
			this.$rootScope.$apply(function () {
				_inject.apply(_this, [definition, resource, attrs]);
			});
		} else {
			_inject.apply(_this, [definition, resource, attrs]);
		}
		return attrs;
	} catch (err) {
		if (!(err instanceof this.errors.RuntimeError)) {
			throw new this.errors.UnhandledError(err);
		} else {
			throw err;
		}
	}
}

module.exports = inject;
