var assert = require('assert')

var bindings = require('./bindings')
var CIF = require('./cif')

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

  var closurePtr = this._closurePtr = wrapCallback(cif._cifPtr, fn)
  this._codePtr = getCallbackCodeLoc(closurePtr)
}

Callback.prototype.dispose = function dispose () {
  releaseCallback(this._closurePtr)
}

module.exports = Callback
