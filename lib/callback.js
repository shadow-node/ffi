var assert = require('assert')
var debug = require('debug')('ffi:callback')

var bindings = require('./bindings')
var CIF = require('./cif')
var types = require('./types')

var wrapCallback = bindings.wrap_callback
var getCallbackCodeLoc = bindings.get_callback_code_loc

/**
 *
 * @param {string} retType
 * @param {string[]} argsTypes
 * @param {Function} fn
 */
function Callback (retType, argsTypes, fn) {
  if (!(this instanceof Callback)) {
    return new Callback(retType, argsTypes, fn)
  }

  assert(typeof fn === 'function')
  debug('creating callback', retType, argsTypes, fn)

  var cif = this._cif = new CIF(retType, argsTypes)

  function callbackProxy () {
    var argsArr = types.castToJSTypeFromArray(cif.argsTypes, arguments)
    return fn.apply(null, argsArr)
  }

  var closurePtr = this._closurePtr = wrapCallback(cif._cifPtr, callbackProxy)
  this._codePtr = getCallbackCodeLoc(closurePtr)
  this._proxy = callbackProxy

  debug('created callback', this._closurePtr)
}

module.exports = Callback
