module.exports = Callback

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
    debug('callback proxy being called, casting arguments')
    var argsArr = arguments
    try {
      argsArr = types.castToJSTypeFromArray(cif.argsTypes, argsArr)
    } catch (err) {
      console.error('Unexpected error on casting callback arguments', err)
      throw err
    }

    var ret
    try {
      debug('calling actual callback function with arguments', argsArr)
      ret = fn.apply(null, argsArr)
    } catch (err) {
      console.log('Unexpected error on calling callback', err)
      throw err
    }
    debug('callback executed')
    return ret
  }

  var closurePtr = this._closurePtr = wrapCallback(cif._cifPtr, callbackProxy)
  this._codePtr = getCallbackCodeLoc(closurePtr)
  this._proxy = callbackProxy

  debug('created callback')
}
