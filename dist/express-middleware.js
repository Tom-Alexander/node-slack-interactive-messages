'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorCodes = undefined;
exports.createExpressMiddleware = createExpressMiddleware;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errorCodes = exports.errorCodes = {
  NO_BODY_PARSER: 'SLACKMESSAGEMIDDLEWARE_NO_BODY_PARSER',
  TOKEN_VERIFICATION_FAILURE: 'SLACKMESSAGEMIDDLEWARE_TOKEN_VERIFICATION_FAILURE'
};

var debug = (0, _debug2.default)('@slack/interactive-messages:express-middleware');

function createExpressMiddleware(adapter) {
  var poweredBy = (0, _util.packageIdentifier)();

  // This function binds a specific response instance to a function
  function sendResponse(res) {
    return function _sendResponse(_ref) {
      var status = _ref.status,
          content = _ref.content;

      debug('sending response - status: %s, content: %o', status, content);
      return new Promise(function (resolve, reject) {
        res.status(status);
        res.set('X-Slack-Powered-By', poweredBy);
        if (content) {
          res.json(content);
        } else {
          res.end();
        }
        res.on('finish', function () {
          // res._headers is an undocumented property, but we feel comfortable using it because:
          // 1. express depends on it and express is so foundational in node
          // 2. this is logging code and the risk of this causing a break is minimal
          // eslint-disable-next-line no-underscore-dangle
          debug('response finished - status: %d, headers: %o', res.statusCode, res._headers);
          resolve(res);
        });
        res.on('error', reject);
      });
    };
  }

  return function slackMessageAdapterMiddleware(req, res, next) {
    debug('request recieved - method: %s, path: %s', req.method, req.path);

    // Bind a response function to this request's respond object. This may be used in a number of
    // places
    var respond = sendResponse(res);

    // Check that the request body has been parsed
    if (!req.body) {
      var error = new Error('The incoming HTTP request did not have a parsed body.');
      error.code = errorCodes.NO_BODY_PARSER;
      next(error);
      return;
    }

    if (req.body.ssl_check) {
      respond({ status: 200 });
      return;
    }

    var payload = JSON.parse(req.body.payload);

    // Handle request token verification
    if (!payload.token || payload.token !== adapter.verificationToken) {
      debug('request token verification failure');
      var _error = new Error('Slack interactive message verification failed');
      _error.code = errorCodes.TOKEN_VERIFICATION_FAILURE;
      next(_error);
      return;
    }
    debug('request token verification success');

    respond(adapter.dispatch(payload)).catch(next);
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9leHByZXNzLW1pZGRsZXdhcmUuanMiXSwibmFtZXMiOlsiY3JlYXRlRXhwcmVzc01pZGRsZXdhcmUiLCJlcnJvckNvZGVzIiwiTk9fQk9EWV9QQVJTRVIiLCJUT0tFTl9WRVJJRklDQVRJT05fRkFJTFVSRSIsImRlYnVnIiwiYWRhcHRlciIsInBvd2VyZWRCeSIsInNlbmRSZXNwb25zZSIsInJlcyIsIl9zZW5kUmVzcG9uc2UiLCJzdGF0dXMiLCJjb250ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJzZXQiLCJqc29uIiwiZW5kIiwib24iLCJzdGF0dXNDb2RlIiwiX2hlYWRlcnMiLCJzbGFja01lc3NhZ2VBZGFwdGVyTWlkZGxld2FyZSIsInJlcSIsIm5leHQiLCJtZXRob2QiLCJwYXRoIiwicmVzcG9uZCIsImJvZHkiLCJlcnJvciIsIkVycm9yIiwiY29kZSIsInNzbF9jaGVjayIsInBheWxvYWQiLCJKU09OIiwicGFyc2UiLCJ0b2tlbiIsInZlcmlmaWNhdGlvblRva2VuIiwiZGlzcGF0Y2giLCJjYXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O1FBVWdCQSx1QixHQUFBQSx1Qjs7QUFWaEI7Ozs7QUFDQTs7OztBQUVPLElBQU1DLGtDQUFhO0FBQ3hCQyxrQkFBZ0IsdUNBRFE7QUFFeEJDLDhCQUE0QjtBQUZKLENBQW5COztBQUtQLElBQU1DLFFBQVEscUJBQWEsZ0RBQWIsQ0FBZDs7QUFFTyxTQUFTSix1QkFBVCxDQUFpQ0ssT0FBakMsRUFBMEM7QUFDL0MsTUFBTUMsWUFBWSw4QkFBbEI7O0FBRUE7QUFDQSxXQUFTQyxZQUFULENBQXNCQyxHQUF0QixFQUEyQjtBQUN6QixXQUFPLFNBQVNDLGFBQVQsT0FBNEM7QUFBQSxVQUFuQkMsTUFBbUIsUUFBbkJBLE1BQW1CO0FBQUEsVUFBWEMsT0FBVyxRQUFYQSxPQUFXOztBQUNqRFAsWUFBTSw0Q0FBTixFQUFvRE0sTUFBcEQsRUFBNERDLE9BQTVEO0FBQ0EsYUFBTyxJQUFJQyxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVQyxNQUFWLEVBQXFCO0FBQ3RDTixZQUFJRSxNQUFKLENBQVdBLE1BQVg7QUFDQUYsWUFBSU8sR0FBSixDQUFRLG9CQUFSLEVBQThCVCxTQUE5QjtBQUNBLFlBQUlLLE9BQUosRUFBYTtBQUNYSCxjQUFJUSxJQUFKLENBQVNMLE9BQVQ7QUFDRCxTQUZELE1BRU87QUFDTEgsY0FBSVMsR0FBSjtBQUNEO0FBQ0RULFlBQUlVLEVBQUosQ0FBTyxRQUFQLEVBQWlCLFlBQU07QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQWQsZ0JBQU0sNkNBQU4sRUFBcURJLElBQUlXLFVBQXpELEVBQXFFWCxJQUFJWSxRQUF6RTtBQUNBUCxrQkFBUUwsR0FBUjtBQUNELFNBUEQ7QUFRQUEsWUFBSVUsRUFBSixDQUFPLE9BQVAsRUFBZ0JKLE1BQWhCO0FBQ0QsT0FqQk0sQ0FBUDtBQWtCRCxLQXBCRDtBQXFCRDs7QUFFRCxTQUFPLFNBQVNPLDZCQUFULENBQXVDQyxHQUF2QyxFQUE0Q2QsR0FBNUMsRUFBaURlLElBQWpELEVBQXVEO0FBQzVEbkIsVUFBTSx5Q0FBTixFQUFpRGtCLElBQUlFLE1BQXJELEVBQTZERixJQUFJRyxJQUFqRTs7QUFFQTtBQUNBO0FBQ0EsUUFBTUMsVUFBVW5CLGFBQWFDLEdBQWIsQ0FBaEI7O0FBRUE7QUFDQSxRQUFJLENBQUNjLElBQUlLLElBQVQsRUFBZTtBQUNiLFVBQU1DLFFBQVEsSUFBSUMsS0FBSixDQUFVLHVEQUFWLENBQWQ7QUFDQUQsWUFBTUUsSUFBTixHQUFhN0IsV0FBV0MsY0FBeEI7QUFDQXFCLFdBQUtLLEtBQUw7QUFDQTtBQUNEOztBQUVELFFBQUlOLElBQUlLLElBQUosQ0FBU0ksU0FBYixFQUF3QjtBQUN0QkwsY0FBUSxFQUFFaEIsUUFBUSxHQUFWLEVBQVI7QUFDQTtBQUNEOztBQUVELFFBQU1zQixVQUFVQyxLQUFLQyxLQUFMLENBQVdaLElBQUlLLElBQUosQ0FBU0ssT0FBcEIsQ0FBaEI7O0FBRUE7QUFDQSxRQUFJLENBQUNBLFFBQVFHLEtBQVQsSUFBa0JILFFBQVFHLEtBQVIsS0FBa0I5QixRQUFRK0IsaUJBQWhELEVBQW1FO0FBQ2pFaEMsWUFBTSxvQ0FBTjtBQUNBLFVBQU13QixTQUFRLElBQUlDLEtBQUosQ0FBVSwrQ0FBVixDQUFkO0FBQ0FELGFBQU1FLElBQU4sR0FBYTdCLFdBQVdFLDBCQUF4QjtBQUNBb0IsV0FBS0ssTUFBTDtBQUNBO0FBQ0Q7QUFDRHhCLFVBQU0sb0NBQU47O0FBRUFzQixZQUFRckIsUUFBUWdDLFFBQVIsQ0FBaUJMLE9BQWpCLENBQVIsRUFDR00sS0FESCxDQUNTZixJQURUO0FBRUQsR0FsQ0Q7QUFtQ0QiLCJmaWxlIjoiZXhwcmVzcy1taWRkbGV3YXJlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRlYnVnRmFjdG9yeSBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgeyBwYWNrYWdlSWRlbnRpZmllciB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBjb25zdCBlcnJvckNvZGVzID0ge1xuICBOT19CT0RZX1BBUlNFUjogJ1NMQUNLTUVTU0FHRU1JRERMRVdBUkVfTk9fQk9EWV9QQVJTRVInLFxuICBUT0tFTl9WRVJJRklDQVRJT05fRkFJTFVSRTogJ1NMQUNLTUVTU0FHRU1JRERMRVdBUkVfVE9LRU5fVkVSSUZJQ0FUSU9OX0ZBSUxVUkUnLFxufTtcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoJ0BzbGFjay9pbnRlcmFjdGl2ZS1tZXNzYWdlczpleHByZXNzLW1pZGRsZXdhcmUnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUV4cHJlc3NNaWRkbGV3YXJlKGFkYXB0ZXIpIHtcbiAgY29uc3QgcG93ZXJlZEJ5ID0gcGFja2FnZUlkZW50aWZpZXIoKTtcblxuICAvLyBUaGlzIGZ1bmN0aW9uIGJpbmRzIGEgc3BlY2lmaWMgcmVzcG9uc2UgaW5zdGFuY2UgdG8gYSBmdW5jdGlvblxuICBmdW5jdGlvbiBzZW5kUmVzcG9uc2UocmVzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIF9zZW5kUmVzcG9uc2UoeyBzdGF0dXMsIGNvbnRlbnQgfSkge1xuICAgICAgZGVidWcoJ3NlbmRpbmcgcmVzcG9uc2UgLSBzdGF0dXM6ICVzLCBjb250ZW50OiAlbycsIHN0YXR1cywgY29udGVudCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICByZXMuc3RhdHVzKHN0YXR1cyk7XG4gICAgICAgIHJlcy5zZXQoJ1gtU2xhY2stUG93ZXJlZC1CeScsIHBvd2VyZWRCeSk7XG4gICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgcmVzLmpzb24oY29udGVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5vbignZmluaXNoJywgKCkgPT4ge1xuICAgICAgICAgIC8vIHJlcy5faGVhZGVycyBpcyBhbiB1bmRvY3VtZW50ZWQgcHJvcGVydHksIGJ1dCB3ZSBmZWVsIGNvbWZvcnRhYmxlIHVzaW5nIGl0IGJlY2F1c2U6XG4gICAgICAgICAgLy8gMS4gZXhwcmVzcyBkZXBlbmRzIG9uIGl0IGFuZCBleHByZXNzIGlzIHNvIGZvdW5kYXRpb25hbCBpbiBub2RlXG4gICAgICAgICAgLy8gMi4gdGhpcyBpcyBsb2dnaW5nIGNvZGUgYW5kIHRoZSByaXNrIG9mIHRoaXMgY2F1c2luZyBhIGJyZWFrIGlzIG1pbmltYWxcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICAgICAgICBkZWJ1ZygncmVzcG9uc2UgZmluaXNoZWQgLSBzdGF0dXM6ICVkLCBoZWFkZXJzOiAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuX2hlYWRlcnMpO1xuICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcy5vbignZXJyb3InLCByZWplY3QpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBzbGFja01lc3NhZ2VBZGFwdGVyTWlkZGxld2FyZShyZXEsIHJlcywgbmV4dCkge1xuICAgIGRlYnVnKCdyZXF1ZXN0IHJlY2lldmVkIC0gbWV0aG9kOiAlcywgcGF0aDogJXMnLCByZXEubWV0aG9kLCByZXEucGF0aCk7XG5cbiAgICAvLyBCaW5kIGEgcmVzcG9uc2UgZnVuY3Rpb24gdG8gdGhpcyByZXF1ZXN0J3MgcmVzcG9uZCBvYmplY3QuIFRoaXMgbWF5IGJlIHVzZWQgaW4gYSBudW1iZXIgb2ZcbiAgICAvLyBwbGFjZXNcbiAgICBjb25zdCByZXNwb25kID0gc2VuZFJlc3BvbnNlKHJlcyk7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoZSByZXF1ZXN0IGJvZHkgaGFzIGJlZW4gcGFyc2VkXG4gICAgaWYgKCFyZXEuYm9keSkge1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ1RoZSBpbmNvbWluZyBIVFRQIHJlcXVlc3QgZGlkIG5vdCBoYXZlIGEgcGFyc2VkIGJvZHkuJyk7XG4gICAgICBlcnJvci5jb2RlID0gZXJyb3JDb2Rlcy5OT19CT0RZX1BBUlNFUjtcbiAgICAgIG5leHQoZXJyb3IpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChyZXEuYm9keS5zc2xfY2hlY2spIHtcbiAgICAgIHJlc3BvbmQoeyBzdGF0dXM6IDIwMCB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShyZXEuYm9keS5wYXlsb2FkKTtcblxuICAgIC8vIEhhbmRsZSByZXF1ZXN0IHRva2VuIHZlcmlmaWNhdGlvblxuICAgIGlmICghcGF5bG9hZC50b2tlbiB8fCBwYXlsb2FkLnRva2VuICE9PSBhZGFwdGVyLnZlcmlmaWNhdGlvblRva2VuKSB7XG4gICAgICBkZWJ1ZygncmVxdWVzdCB0b2tlbiB2ZXJpZmljYXRpb24gZmFpbHVyZScpO1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ1NsYWNrIGludGVyYWN0aXZlIG1lc3NhZ2UgdmVyaWZpY2F0aW9uIGZhaWxlZCcpO1xuICAgICAgZXJyb3IuY29kZSA9IGVycm9yQ29kZXMuVE9LRU5fVkVSSUZJQ0FUSU9OX0ZBSUxVUkU7XG4gICAgICBuZXh0KGVycm9yKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVidWcoJ3JlcXVlc3QgdG9rZW4gdmVyaWZpY2F0aW9uIHN1Y2Nlc3MnKTtcblxuICAgIHJlc3BvbmQoYWRhcHRlci5kaXNwYXRjaChwYXlsb2FkKSlcbiAgICAgIC5jYXRjaChuZXh0KTtcbiAgfTtcbn1cbiJdfQ==
//# sourceMappingURL=express-middleware.js.map