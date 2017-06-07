'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _lodash = require('lodash.isstring');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.isplainobject');

var _lodash4 = _interopRequireDefault(_lodash3);

var _lodash5 = require('lodash.isregexp');

var _lodash6 = _interopRequireDefault(_lodash5);

var _lodash7 = require('lodash.isfunction');

var _lodash8 = _interopRequireDefault(_lodash7);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _expressMiddleware = require('./express-middleware');

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('@slack/interactive-messages:adapter');

/**
 * Transforms various forms of matching constraints to a single standard object shape
 * @param {string|RegExp|Object} matchingConstraints - the various forms of matching constraints
 * accepted
 * @returns {Object} - an object where each matching constraint is a property
 */
function formatMatchingConstraints(matchingConstraints) {
  var ret = {};
  if (!(0, _lodash4.default)(matchingConstraints)) {
    ret.callbackId = matchingConstraints;
  } else {
    ret = Object.assign({}, matchingConstraints);
  }
  return ret;
}

/**
 * Validates general properties of a matching constraints object
 * @param {Object} matchingConstraints - object describing the constraints on a callback
 * @return {Error|false} - a false value represents successful validation, otherwise an error to
 * describe why validation failed.
 */
function validateConstraints(matchingConstraints) {
  if (matchingConstraints.callbackId && !((0, _lodash2.default)(matchingConstraints.callbackId) || (0, _lodash6.default)(matchingConstraints.callbackId))) {
    return new TypeError('Callback ID must be a string or RegExp');
  }

  return false;
}

/**
 * Validates properties of a matching constraints object specific to registering an action
 * @param {Object} matchingConstraints - object describing the constraints on a callback
 * @return {Error|false} - a false value represents successful validation, otherwise an error to
 * describe why validation failed.
 */
function validateActionConstraints(actionConstraints) {
  if (actionConstraints.type && !(actionConstraints.type === 'select' || actionConstraints.type === 'button')) {
    return new TypeError('Type must be \'select\' or \'button\'');
  }

  // We don't need to validate unfurl, we'll just cooerce it to a boolean
  return false;
}

var SlackMessageAdapter = function () {
  /**
   * Create a message adapter.
   *
   * @param {string} verificationToken - Slack app verification token used to authenticate request
   */
  function SlackMessageAdapter(verificationToken) {
    _classCallCheck(this, SlackMessageAdapter);

    if (!(0, _lodash2.default)(verificationToken)) {
      throw new TypeError('SlackMessageAdapter needs a verification token');
    }

    this.verificationToken = verificationToken;
    this.callbacks = [];
    this.axios = _axios2.default.create({
      headers: {
        'User-Agent': (0, _util.packageIdentifier)()
      }
    });

    debug('instantiated');
  }

  /**
   * Create a server that's ready to serve requests from Slack's interactive messages.
   *
   * @param {string} [path=/slack/actions] - The path portion of the URL where the server will
   * listen for requests from Slack's interactive messages.
   */


  _createClass(SlackMessageAdapter, [{
    key: 'createServer',
    value: function createServer() {
      var _this = this;

      var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/slack/actions';

      // TODO: more options (like https)
      return Promise.resolve().then(function () {
        return Promise.all([Promise.resolve(require(('express'))), Promise.resolve(require(('body-parser')))]);
      }).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            express = _ref2[0],
            bodyParser = _ref2[1];

        var app = express();
        app.use(bodyParser.urlencoded({ extended: false }));
        app.post(path, _this.expressMiddleware());

        debug('server created - path: %s', path);

        return _http2.default.createServer(app);
      });
    }
  }, {
    key: 'start',
    value: function start(port) {
      var _this2 = this;

      return this.createServer().then(function (server) {
        return new Promise(function (resolve, reject) {
          _this2.server = server;
          server.on('error', reject);
          server.listen(port, function () {
            return resolve(server);
          });
          debug('server started - port: %s', port);
        });
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (_this3.server) {
          _this3.server.close(function (error) {
            delete _this3.server;
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        } else {
          reject(new Error('SlackMessageAdapter cannot stop when it did not start a server'));
        }
      });
    }
  }, {
    key: 'expressMiddleware',
    value: function expressMiddleware() {
      return (0, _expressMiddleware.createExpressMiddleware)(this);
    }
  }, {
    key: 'action',
    value: function action(matchingConstraints, callback) {
      var actionConstraints = formatMatchingConstraints(matchingConstraints);

      var error = validateConstraints(actionConstraints) || validateActionConstraints(actionConstraints);
      if (error) {
        debug('action could not be registered: %s', error.message);
        throw error;
      }

      return this.registerCallback(actionConstraints, callback);
    }
  }, {
    key: 'options',
    value: function options(matchingConstraints, callback) {
      var optionsConstraints = formatMatchingConstraints(matchingConstraints);

      var error = validateConstraints(optionsConstraints);
      if (error) {
        debug('options could not be registered: %s', error.message);
        throw error;
      }

      return this.registerCallback(optionsConstraints, callback);
    }

    /* @private */

  }, {
    key: 'registerCallback',
    value: function registerCallback(constraints, callback) {
      // Validation
      if (!(0, _lodash8.default)(callback)) {
        debug('did not register callback because its not a function');
        throw new TypeError('callback must be a function');
      }

      this.callbacks.push([constraints, callback]);

      return this;
    }
  }, {
    key: 'dispatch',
    value: function dispatch(payload) {
      var _this4 = this;

      var action = payload.actions && payload.actions[0];
      var result = { status: 200 };
      var respond = function respond(message) {
        debug('sending async response');
        return _this4.axios.post(payload.response_url, message);
      };

      this.callbacks.some(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            constraints = _ref4[0],
            fn = _ref4[1];

        // Returning false in this function continues the iteration, and returning true ends it.
        // The pattern is that we assign a value to `result` and then return true. We only desire one
        // result for the response.
        var callbackResult = void 0;

        if (constraints.callbackId) {
          if ((0, _lodash2.default)(constraints.callbackId) && payload.callback_id !== constraints.callbackId) {
            return false;
          }
          if ((0, _lodash6.default)(constraints.callbackId) && !constraints.callbackId.text(payload.callback_id)) {
            return false;
          }
        }

        if (action && constraints.type && constraints.type !== action.type) {
          return false;
        }

        if ('unfurl' in constraints && (constraints.unfurl && !payload.is_app_unfurl || !constraints.unfurl && payload.is_app_unfurl)) {
          return false;
        }

        try {
          callbackResult = fn.call(_this4, payload, respond);
        } catch (error) {
          debug('callback error: %o', error);
          result = { status: 500 };
          return true;
        }

        if (callbackResult) {
          // Checking for Promise type
          if (typeof callbackResult.then === 'function') {
            callbackResult.then(respond).catch(function (error) {
              debug('async error for callback. callback_id: %s, error: %s', payload.callback_id, error.message);
            });
            return true;
          }
          result = { status: 200, content: callbackResult };
          return true;
        }
        return true;
      });

      return result;
    }
  }]);

  return SlackMessageAdapter;
}();

exports.default = SlackMessageAdapter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hZGFwdGVyLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiZm9ybWF0TWF0Y2hpbmdDb25zdHJhaW50cyIsIm1hdGNoaW5nQ29uc3RyYWludHMiLCJyZXQiLCJjYWxsYmFja0lkIiwiT2JqZWN0IiwiYXNzaWduIiwidmFsaWRhdGVDb25zdHJhaW50cyIsIlR5cGVFcnJvciIsInZhbGlkYXRlQWN0aW9uQ29uc3RyYWludHMiLCJhY3Rpb25Db25zdHJhaW50cyIsInR5cGUiLCJTbGFja01lc3NhZ2VBZGFwdGVyIiwidmVyaWZpY2F0aW9uVG9rZW4iLCJjYWxsYmFja3MiLCJheGlvcyIsImNyZWF0ZSIsImhlYWRlcnMiLCJwYXRoIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiYWxsIiwiZXhwcmVzcyIsImJvZHlQYXJzZXIiLCJhcHAiLCJ1c2UiLCJ1cmxlbmNvZGVkIiwiZXh0ZW5kZWQiLCJwb3N0IiwiZXhwcmVzc01pZGRsZXdhcmUiLCJjcmVhdGVTZXJ2ZXIiLCJwb3J0IiwicmVqZWN0Iiwic2VydmVyIiwib24iLCJsaXN0ZW4iLCJjbG9zZSIsImVycm9yIiwiRXJyb3IiLCJjYWxsYmFjayIsIm1lc3NhZ2UiLCJyZWdpc3RlckNhbGxiYWNrIiwib3B0aW9uc0NvbnN0cmFpbnRzIiwiY29uc3RyYWludHMiLCJwdXNoIiwicGF5bG9hZCIsImFjdGlvbiIsImFjdGlvbnMiLCJyZXN1bHQiLCJzdGF0dXMiLCJyZXNwb25kIiwicmVzcG9uc2VfdXJsIiwic29tZSIsImZuIiwiY2FsbGJhY2tSZXN1bHQiLCJjYWxsYmFja19pZCIsInRleHQiLCJ1bmZ1cmwiLCJpc19hcHBfdW5mdXJsIiwiY2FsbCIsImNhdGNoIiwiY29udGVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLElBQU1BLFFBQVEscUJBQWEscUNBQWIs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SUFBOUQsRUFBb0U7QUFDbEUsaUJBQU8sS0FBUDtBQUNEOztBQUVELFlBQUksWUFBWWlDLFdBQVosS0FFSUEsWUFBWWMsTUFBWixJQUFzQixDQUFDWixRQUFRYSxhQUFoQyxJQUNDLENBQUNmLFlBQVljLE1BQWIsSUFBdUJaLFFBQVFhLGFBSG5DLENBQUosRUFLSztBQUNILGlCQUFPLEtBQVA7QUFDRDs7QUFFRCxZQUFJO0FBQ0ZKLDJCQUFpQkQsR0FBR00sSUFBSCxTQUFjZCxPQUFkLEVBQXVCSyxPQUF2QixDQUFqQjtBQUNELFNBRkQsQ0FFRSxPQUFPYixLQUFQLEVBQWM7QUFDZHRDLGdCQUFNLG9CQUFOLEVBQTRCc0MsS0FBNUI7QUFDQVcsbUJBQVMsRUFBRUMsUUFBUSxHQUFWLEVBQVQ7QUFDQSxpQkFBTyxJQUFQO0FBQ0Q7O0FBRUQsWUFBSUssY0FBSixFQUFvQjtBQUNsQjtBQUNBLGNBQUksT0FBT0EsZUFBZWxDLElBQXRCLEtBQStCLFVBQW5DLEVBQStDO0FBQzdDa0MsMkJBQWVsQyxJQUFmLENBQW9COEIsT0FBcEIsRUFBNkJVLEtBQTdCLENBQW1DLFVBQUN2QixLQUFELEVBQVc7QUFDNUN0QyxvQkFBTSxzREFBTixFQUNNOEMsUUFBUVUsV0FEZCxFQUMyQmxCLE1BQU1HLE9BRGpDO0FBRUQsYUFIRDtBQUlBLG1CQUFPLElBQVA7QUFDRDtBQUNEUSxtQkFBUyxFQUFFQyxRQUFRLEdBQVYsRUFBZVksU0FBU1AsY0FBeEIsRUFBVDtBQUNBLGlCQUFPLElBQVA7QUFDRDtBQUNELGVBQU8sSUFBUDtBQUNELE9BakREOztBQW1EQSxhQUFPTixNQUFQO0FBQ0Q7Ozs7OztrQkEvS2tCckMsbUIiLCJmaWxlIjoiYWRhcHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCBpc1N0cmluZyBmcm9tICdsb2Rhc2guaXNzdHJpbmcnO1xuaW1wb3J0IGlzUGxhaW5PYmplY3QgZnJvbSAnbG9kYXNoLmlzcGxhaW5vYmplY3QnO1xuaW1wb3J0IGlzUmVnRXhwIGZyb20gJ2xvZGFzaC5pc3JlZ2V4cCc7XG5pbXBvcnQgaXNGdW5jdGlvbiBmcm9tICdsb2Rhc2guaXNmdW5jdGlvbic7XG5pbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IGNyZWF0ZUV4cHJlc3NNaWRkbGV3YXJlIH0gZnJvbSAnLi9leHByZXNzLW1pZGRsZXdhcmUnO1xuaW1wb3J0IHsgcGFja2FnZUlkZW50aWZpZXIgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBkZWJ1ZyA9IGRlYnVnRmFjdG9yeSgnQHNsYWNrL2ludGVyYWN0aXZlLW1lc3NhZ2VzOmFkYXB0ZXInKTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHZhcmlvdXMgZm9ybXMgb2YgbWF0Y2hpbmcgY29uc3RyYWludHMgdG8gYSBzaW5nbGUgc3RhbmRhcmQgb2JqZWN0IHNoYXBlXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8T2JqZWN0fSBtYXRjaGluZ0NvbnN0cmFpbnRzIC0gdGhlIHZhcmlvdXMgZm9ybXMgb2YgbWF0Y2hpbmcgY29uc3RyYWludHNcbiAqIGFjY2VwdGVkXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIGFuIG9iamVjdCB3aGVyZSBlYWNoIG1hdGNoaW5nIGNvbnN0cmFpbnQgaXMgYSBwcm9wZXJ0eVxuICovXG5mdW5jdGlvbiBmb3JtYXRNYXRjaGluZ0NvbnN0cmFpbnRzKG1hdGNoaW5nQ29uc3RyYWludHMpIHtcbiAgbGV0IHJldCA9IHt9O1xuICBpZiAoIWlzUGxhaW5PYmplY3QobWF0Y2hpbmdDb25zdHJhaW50cykpIHtcbiAgICByZXQuY2FsbGJhY2tJZCA9IG1hdGNoaW5nQ29uc3RyYWludHM7XG4gIH0gZWxzZSB7XG4gICAgcmV0ID0gT2JqZWN0LmFzc2lnbih7fSwgbWF0Y2hpbmdDb25zdHJhaW50cyk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgZ2VuZXJhbCBwcm9wZXJ0aWVzIG9mIGEgbWF0Y2hpbmcgY29uc3RyYWludHMgb2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gbWF0Y2hpbmdDb25zdHJhaW50cyAtIG9iamVjdCBkZXNjcmliaW5nIHRoZSBjb25zdHJhaW50cyBvbiBhIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFcnJvcnxmYWxzZX0gLSBhIGZhbHNlIHZhbHVlIHJlcHJlc2VudHMgc3VjY2Vzc2Z1bCB2YWxpZGF0aW9uLCBvdGhlcndpc2UgYW4gZXJyb3IgdG9cbiAqIGRlc2NyaWJlIHdoeSB2YWxpZGF0aW9uIGZhaWxlZC5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDb25zdHJhaW50cyhtYXRjaGluZ0NvbnN0cmFpbnRzKSB7XG4gIGlmIChtYXRjaGluZ0NvbnN0cmFpbnRzLmNhbGxiYWNrSWQgJiZcbiAgICAgICEoaXNTdHJpbmcobWF0Y2hpbmdDb25zdHJhaW50cy5jYWxsYmFja0lkKSB8fCBpc1JlZ0V4cChtYXRjaGluZ0NvbnN0cmFpbnRzLmNhbGxiYWNrSWQpKSkge1xuICAgIHJldHVybiBuZXcgVHlwZUVycm9yKCdDYWxsYmFjayBJRCBtdXN0IGJlIGEgc3RyaW5nIG9yIFJlZ0V4cCcpO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBwcm9wZXJ0aWVzIG9mIGEgbWF0Y2hpbmcgY29uc3RyYWludHMgb2JqZWN0IHNwZWNpZmljIHRvIHJlZ2lzdGVyaW5nIGFuIGFjdGlvblxuICogQHBhcmFtIHtPYmplY3R9IG1hdGNoaW5nQ29uc3RyYWludHMgLSBvYmplY3QgZGVzY3JpYmluZyB0aGUgY29uc3RyYWludHMgb24gYSBjYWxsYmFja1xuICogQHJldHVybiB7RXJyb3J8ZmFsc2V9IC0gYSBmYWxzZSB2YWx1ZSByZXByZXNlbnRzIHN1Y2Nlc3NmdWwgdmFsaWRhdGlvbiwgb3RoZXJ3aXNlIGFuIGVycm9yIHRvXG4gKiBkZXNjcmliZSB3aHkgdmFsaWRhdGlvbiBmYWlsZWQuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlQWN0aW9uQ29uc3RyYWludHMoYWN0aW9uQ29uc3RyYWludHMpIHtcbiAgaWYgKGFjdGlvbkNvbnN0cmFpbnRzLnR5cGUgJiZcbiAgICAgICEoYWN0aW9uQ29uc3RyYWludHMudHlwZSA9PT0gJ3NlbGVjdCcgfHwgYWN0aW9uQ29uc3RyYWludHMudHlwZSA9PT0gJ2J1dHRvbicpKSB7XG4gICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoJ1R5cGUgbXVzdCBiZSBcXCdzZWxlY3RcXCcgb3IgXFwnYnV0dG9uXFwnJyk7XG4gIH1cblxuICAvLyBXZSBkb24ndCBuZWVkIHRvIHZhbGlkYXRlIHVuZnVybCwgd2UnbGwganVzdCBjb29lcmNlIGl0IHRvIGEgYm9vbGVhblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNsYWNrTWVzc2FnZUFkYXB0ZXIge1xuICAvKipcbiAgICogQ3JlYXRlIGEgbWVzc2FnZSBhZGFwdGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmVyaWZpY2F0aW9uVG9rZW4gLSBTbGFjayBhcHAgdmVyaWZpY2F0aW9uIHRva2VuIHVzZWQgdG8gYXV0aGVudGljYXRlIHJlcXVlc3RcbiAgICovXG4gIGNvbnN0cnVjdG9yKHZlcmlmaWNhdGlvblRva2VuKSB7XG4gICAgaWYgKCFpc1N0cmluZyh2ZXJpZmljYXRpb25Ub2tlbikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NsYWNrTWVzc2FnZUFkYXB0ZXIgbmVlZHMgYSB2ZXJpZmljYXRpb24gdG9rZW4nKTtcbiAgICB9XG5cbiAgICB0aGlzLnZlcmlmaWNhdGlvblRva2VuID0gdmVyaWZpY2F0aW9uVG9rZW47XG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcbiAgICB0aGlzLmF4aW9zID0gYXhpb3MuY3JlYXRlKHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiBwYWNrYWdlSWRlbnRpZmllcigpLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGRlYnVnKCdpbnN0YW50aWF0ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBzZXJ2ZXIgdGhhdCdzIHJlYWR5IHRvIHNlcnZlIHJlcXVlc3RzIGZyb20gU2xhY2sncyBpbnRlcmFjdGl2ZSBtZXNzYWdlcy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXRoPS9zbGFjay9hY3Rpb25zXSAtIFRoZSBwYXRoIHBvcnRpb24gb2YgdGhlIFVSTCB3aGVyZSB0aGUgc2VydmVyIHdpbGxcbiAgICogbGlzdGVuIGZvciByZXF1ZXN0cyBmcm9tIFNsYWNrJ3MgaW50ZXJhY3RpdmUgbWVzc2FnZXMuXG4gICAqL1xuICBjcmVhdGVTZXJ2ZXIocGF0aCA9ICcvc2xhY2svYWN0aW9ucycpIHtcbiAgICAvLyBUT0RPOiBtb3JlIG9wdGlvbnMgKGxpa2UgaHR0cHMpXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gUHJvbWlzZS5hbGwoW1xuICAgICAgaW1wb3J0KCdleHByZXNzJyksXG4gICAgICBpbXBvcnQoJ2JvZHktcGFyc2VyJyksXG4gICAgXSkpXG4gICAgLnRoZW4oKFtleHByZXNzLCBib2R5UGFyc2VyXSkgPT4ge1xuICAgICAgY29uc3QgYXBwID0gZXhwcmVzcygpO1xuICAgICAgYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoeyBleHRlbmRlZDogZmFsc2UgfSkpO1xuICAgICAgYXBwLnBvc3QocGF0aCwgdGhpcy5leHByZXNzTWlkZGxld2FyZSgpKTtcblxuICAgICAgZGVidWcoJ3NlcnZlciBjcmVhdGVkIC0gcGF0aDogJXMnLCBwYXRoKTtcblxuICAgICAgcmV0dXJuIGh0dHAuY3JlYXRlU2VydmVyKGFwcCk7XG4gICAgfSk7XG4gIH1cblxuICBzdGFydChwb3J0KSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlU2VydmVyKClcbiAgICAgIC50aGVuKHNlcnZlciA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMuc2VydmVyID0gc2VydmVyO1xuICAgICAgICBzZXJ2ZXIub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICAgICAgc2VydmVyLmxpc3Rlbihwb3J0LCAoKSA9PiByZXNvbHZlKHNlcnZlcikpO1xuICAgICAgICBkZWJ1Zygnc2VydmVyIHN0YXJ0ZWQgLSBwb3J0OiAlcycsIHBvcnQpO1xuICAgICAgfSkpO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHRoaXMuc2VydmVyKSB7XG4gICAgICAgIHRoaXMuc2VydmVyLmNsb3NlKChlcnJvcikgPT4ge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnNlcnZlcjtcbiAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignU2xhY2tNZXNzYWdlQWRhcHRlciBjYW5ub3Qgc3RvcCB3aGVuIGl0IGRpZCBub3Qgc3RhcnQgYSBzZXJ2ZXInKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBleHByZXNzTWlkZGxld2FyZSgpIHtcbiAgICByZXR1cm4gY3JlYXRlRXhwcmVzc01pZGRsZXdhcmUodGhpcyk7XG4gIH1cblxuICBhY3Rpb24obWF0Y2hpbmdDb25zdHJhaW50cywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBhY3Rpb25Db25zdHJhaW50cyA9IGZvcm1hdE1hdGNoaW5nQ29uc3RyYWludHMobWF0Y2hpbmdDb25zdHJhaW50cyk7XG5cbiAgICBjb25zdCBlcnJvciA9IHZhbGlkYXRlQ29uc3RyYWludHMoYWN0aW9uQ29uc3RyYWludHMpIHx8XG4gICAgICB2YWxpZGF0ZUFjdGlvbkNvbnN0cmFpbnRzKGFjdGlvbkNvbnN0cmFpbnRzKTtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGRlYnVnKCdhY3Rpb24gY291bGQgbm90IGJlIHJlZ2lzdGVyZWQ6ICVzJywgZXJyb3IubWVzc2FnZSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZWdpc3RlckNhbGxiYWNrKGFjdGlvbkNvbnN0cmFpbnRzLCBjYWxsYmFjayk7XG4gIH1cblxuICBvcHRpb25zKG1hdGNoaW5nQ29uc3RyYWludHMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgb3B0aW9uc0NvbnN0cmFpbnRzID0gZm9ybWF0TWF0Y2hpbmdDb25zdHJhaW50cyhtYXRjaGluZ0NvbnN0cmFpbnRzKTtcblxuICAgIGNvbnN0IGVycm9yID0gdmFsaWRhdGVDb25zdHJhaW50cyhvcHRpb25zQ29uc3RyYWludHMpO1xuICAgIGlmIChlcnJvcikge1xuICAgICAgZGVidWcoJ29wdGlvbnMgY291bGQgbm90IGJlIHJlZ2lzdGVyZWQ6ICVzJywgZXJyb3IubWVzc2FnZSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZWdpc3RlckNhbGxiYWNrKG9wdGlvbnNDb25zdHJhaW50cywgY2FsbGJhY2spO1xuICB9XG5cbiAgLyogQHByaXZhdGUgKi9cblxuICByZWdpc3RlckNhbGxiYWNrKGNvbnN0cmFpbnRzLCBjYWxsYmFjaykge1xuICAgIC8vIFZhbGlkYXRpb25cbiAgICBpZiAoIWlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XG4gICAgICBkZWJ1ZygnZGlkIG5vdCByZWdpc3RlciBjYWxsYmFjayBiZWNhdXNlIGl0cyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsYmFja3MucHVzaChbY29uc3RyYWludHMsIGNhbGxiYWNrXSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRpc3BhdGNoKHBheWxvYWQpIHtcbiAgICBjb25zdCBhY3Rpb24gPSBwYXlsb2FkLmFjdGlvbnMgJiYgcGF5bG9hZC5hY3Rpb25zWzBdO1xuICAgIGxldCByZXN1bHQgPSB7IHN0YXR1czogMjAwIH07XG4gICAgY29uc3QgcmVzcG9uZCA9IChtZXNzYWdlKSA9PiB7XG4gICAgICBkZWJ1Zygnc2VuZGluZyBhc3luYyByZXNwb25zZScpO1xuICAgICAgcmV0dXJuIHRoaXMuYXhpb3MucG9zdChwYXlsb2FkLnJlc3BvbnNlX3VybCwgbWVzc2FnZSk7XG4gICAgfTtcblxuICAgIHRoaXMuY2FsbGJhY2tzLnNvbWUoKFtjb25zdHJhaW50cywgZm5dKSA9PiB7XG4gICAgICAvLyBSZXR1cm5pbmcgZmFsc2UgaW4gdGhpcyBmdW5jdGlvbiBjb250aW51ZXMgdGhlIGl0ZXJhdGlvbiwgYW5kIHJldHVybmluZyB0cnVlIGVuZHMgaXQuXG4gICAgICAvLyBUaGUgcGF0dGVybiBpcyB0aGF0IHdlIGFzc2lnbiBhIHZhbHVlIHRvIGByZXN1bHRgIGFuZCB0aGVuIHJldHVybiB0cnVlLiBXZSBvbmx5IGRlc2lyZSBvbmVcbiAgICAgIC8vIHJlc3VsdCBmb3IgdGhlIHJlc3BvbnNlLlxuICAgICAgbGV0IGNhbGxiYWNrUmVzdWx0O1xuXG4gICAgICBpZiAoY29uc3RyYWludHMuY2FsbGJhY2tJZCkge1xuICAgICAgICBpZiAoaXNTdHJpbmcoY29uc3RyYWludHMuY2FsbGJhY2tJZCkgJiYgcGF5bG9hZC5jYWxsYmFja19pZCAhPT0gY29uc3RyYWludHMuY2FsbGJhY2tJZCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNSZWdFeHAoY29uc3RyYWludHMuY2FsbGJhY2tJZCkgJiYgIWNvbnN0cmFpbnRzLmNhbGxiYWNrSWQudGV4dChwYXlsb2FkLmNhbGxiYWNrX2lkKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYWN0aW9uICYmIGNvbnN0cmFpbnRzLnR5cGUgJiYgY29uc3RyYWludHMudHlwZSAhPT0gYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoJ3VuZnVybCcgaW4gY29uc3RyYWludHMgJiZcbiAgICAgICAgICAgKFxuICAgICAgICAgICAgIChjb25zdHJhaW50cy51bmZ1cmwgJiYgIXBheWxvYWQuaXNfYXBwX3VuZnVybCkgfHxcbiAgICAgICAgICAgICAoIWNvbnN0cmFpbnRzLnVuZnVybCAmJiBwYXlsb2FkLmlzX2FwcF91bmZ1cmwpXG4gICAgICAgICAgIClcbiAgICAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNhbGxiYWNrUmVzdWx0ID0gZm4uY2FsbCh0aGlzLCBwYXlsb2FkLCByZXNwb25kKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGRlYnVnKCdjYWxsYmFjayBlcnJvcjogJW8nLCBlcnJvcik7XG4gICAgICAgIHJlc3VsdCA9IHsgc3RhdHVzOiA1MDAgfTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChjYWxsYmFja1Jlc3VsdCkge1xuICAgICAgICAvLyBDaGVja2luZyBmb3IgUHJvbWlzZSB0eXBlXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2tSZXN1bHQudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGNhbGxiYWNrUmVzdWx0LnRoZW4ocmVzcG9uZCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBkZWJ1ZygnYXN5bmMgZXJyb3IgZm9yIGNhbGxiYWNrLiBjYWxsYmFja19pZDogJXMsIGVycm9yOiAlcycsXG4gICAgICAgICAgICAgICAgICBwYXlsb2FkLmNhbGxiYWNrX2lkLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSB7IHN0YXR1czogMjAwLCBjb250ZW50OiBjYWxsYmFja1Jlc3VsdCB9O1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIl19
//# sourceMappingURL=adapter.js.map