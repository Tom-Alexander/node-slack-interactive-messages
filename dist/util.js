'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.packageIdentifier = packageIdentifier;

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function escape(s) {
  return s.replace('/', ':').replace(' ', '_');
}

// NOTE: before this can be an external module:
// 1. are all the JS features supported back to a reasonable version?
//    default params, template strings, computed property names
// 2. access to `pkg` will change
// 3. tests
// there will potentially be more named exports in this file
// eslint-disable-next-line import/prefer-default-export
function packageIdentifier() {
  var addons = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var identifierMap = Object.assign({
    [`${_package2.default.name}`]: _package2.default.version,
    [`${_os2.default.platform()}`]: _os2.default.release(),
    node: process.version.replace('v', '')
  }, addons);
  return Object.keys(identifierMap).reduce(function (acc, k) {
    return `${acc} ${escape(k)}/${escape(identifierMap[k])}`;
  }, '');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIl0sIm5hbWVzIjpbInBhY2thZ2VJZGVudGlmaWVyIiwiZXNjYXBlIiwicyIsInJlcGxhY2UiLCJhZGRvbnMiLCJpZGVudGlmaWVyTWFwIiwiT2JqZWN0IiwiYXNzaWduIiwibmFtZSIsInZlcnNpb24iLCJwbGF0Zm9ybSIsInJlbGVhc2UiLCJub2RlIiwicHJvY2VzcyIsImtleXMiLCJyZWR1Y2UiLCJhY2MiLCJrIl0sIm1hcHBpbmdzIjoiOzs7OztRQVlnQkEsaUIsR0FBQUEsaUI7O0FBWmhCOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVNDLE1BQVQsQ0FBZ0JDLENBQWhCLEVBQW1CO0FBQUUsU0FBT0EsRUFBRUMsT0FBRixDQUFVLEdBQVYsRUFBZSxHQUFmLEVBQW9CQSxPQUFwQixDQUE0QixHQUE1QixFQUFpQyxHQUFqQyxDQUFQO0FBQStDOztBQUVwRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLFNBQVNILGlCQUFULEdBQXdDO0FBQUEsTUFBYkksTUFBYSx1RUFBSixFQUFJOztBQUM3QyxNQUFNQyxnQkFBZ0JDLE9BQU9DLE1BQVAsQ0FBYztBQUNsQyxLQUFFLEdBQUUsa0JBQUlDLElBQUssRUFBYixHQUFpQixrQkFBSUMsT0FEYTtBQUVsQyxLQUFFLEdBQUUsYUFBR0MsUUFBSCxFQUFjLEVBQWxCLEdBQXNCLGFBQUdDLE9BQUgsRUFGWTtBQUdsQ0MsVUFBTUMsUUFBUUosT0FBUixDQUFnQk4sT0FBaEIsQ0FBd0IsR0FBeEIsRUFBNkIsRUFBN0I7QUFINEIsR0FBZCxFQUluQkMsTUFKbUIsQ0FBdEI7QUFLQSxTQUFPRSxPQUFPUSxJQUFQLENBQVlULGFBQVosRUFBMkJVLE1BQTNCLENBQWtDLFVBQUNDLEdBQUQsRUFBTUMsQ0FBTjtBQUFBLFdBQWEsR0FBRUQsR0FBSSxJQUFHZixPQUFPZ0IsQ0FBUCxDQUFVLElBQUdoQixPQUFPSSxjQUFjWSxDQUFkLENBQVAsQ0FBeUIsRUFBNUQ7QUFBQSxHQUFsQyxFQUFpRyxFQUFqRyxDQUFQO0FBQ0QiLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgcGtnIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XG5cbmZ1bmN0aW9uIGVzY2FwZShzKSB7IHJldHVybiBzLnJlcGxhY2UoJy8nLCAnOicpLnJlcGxhY2UoJyAnLCAnXycpOyB9XG5cbi8vIE5PVEU6IGJlZm9yZSB0aGlzIGNhbiBiZSBhbiBleHRlcm5hbCBtb2R1bGU6XG4vLyAxLiBhcmUgYWxsIHRoZSBKUyBmZWF0dXJlcyBzdXBwb3J0ZWQgYmFjayB0byBhIHJlYXNvbmFibGUgdmVyc2lvbj9cbi8vICAgIGRlZmF1bHQgcGFyYW1zLCB0ZW1wbGF0ZSBzdHJpbmdzLCBjb21wdXRlZCBwcm9wZXJ0eSBuYW1lc1xuLy8gMi4gYWNjZXNzIHRvIGBwa2dgIHdpbGwgY2hhbmdlXG4vLyAzLiB0ZXN0c1xuLy8gdGhlcmUgd2lsbCBwb3RlbnRpYWxseSBiZSBtb3JlIG5hbWVkIGV4cG9ydHMgaW4gdGhpcyBmaWxlXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L3ByZWZlci1kZWZhdWx0LWV4cG9ydFxuZXhwb3J0IGZ1bmN0aW9uIHBhY2thZ2VJZGVudGlmaWVyKGFkZG9ucyA9IHt9KSB7XG4gIGNvbnN0IGlkZW50aWZpZXJNYXAgPSBPYmplY3QuYXNzaWduKHtcbiAgICBbYCR7cGtnLm5hbWV9YF06IHBrZy52ZXJzaW9uLFxuICAgIFtgJHtvcy5wbGF0Zm9ybSgpfWBdOiBvcy5yZWxlYXNlKCksXG4gICAgbm9kZTogcHJvY2Vzcy52ZXJzaW9uLnJlcGxhY2UoJ3YnLCAnJyksXG4gIH0sIGFkZG9ucyk7XG4gIHJldHVybiBPYmplY3Qua2V5cyhpZGVudGlmaWVyTWFwKS5yZWR1Y2UoKGFjYywgaykgPT4gYCR7YWNjfSAke2VzY2FwZShrKX0vJHtlc2NhcGUoaWRlbnRpZmllck1hcFtrXSl9YCwgJycpO1xufVxuIl19
//# sourceMappingURL=util.js.map