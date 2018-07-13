var assert = require('assert')

var bindings = require('./bindings')
var CIF = require('./cif')
var types = require('./types')

var wrapCallback = bindings.wrap_callback
var getCallbackCodeLoc = bindings.get_callback_code_loc
var releaseCallback = bindings.release_callback

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

  var cif = this._cif = new CIF(retType, argsTypes)

  function callbackProxy () {
    var argsArr = types.castToJSTypeFromArray(cif.argsTypes, arguments)
    fn.apply(null, argsArr)
  }

  var closurePtr = this._closurePtr = wrapCallback(cif._cifPtr, callbackProxy)
  this._codePtr = getCallbackCodeLoc(closurePtr)
  this._proxy = callbackProxy
}

Callback.prototype.dispose = function dispose () {
  releaseCallback(this._closurePtr)
}

module.exports = Callback
