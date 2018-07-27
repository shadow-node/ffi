var assert = require('assert')
var debug = require('debug')('ffi:ForeignFunction')

var bindings = require('./bindings')
var Callback = require('./callback')
var CIF = require('./cif')
var types = require('./types')

var alloc = bindings.alloc
var ffiCall = bindings.ffi_call
var ffiCallAsync = bindings.ffi_call_async
var wrapPointers = bindings.wrap_pointers
var derefPointerPointer = bindings.deref_pointer_pointer
var freePointer = bindings.free_pointer

function ForeignFunction (fnPtr, retType, argsTypes, abi) {
  var callbackObject
  if (fnPtr instanceof Callback) {
    callbackObject = fnPtr
    fnPtr = fnPtr._codePtr
  }
  assert(Buffer.isBuffer(fnPtr), 'expected Buffer as first argument')
  assert(typeof retType === 'string', 'expected a return "type" string as the second argument')
  assert(Array.isArray(argsTypes), 'expected Array of arg "type" string as the third argument')

  var numOfArgs = argsTypes.length
  var cif = new CIF(retType, argsTypes, abi)

  function proxy () {
    var retPtr = alloc(types.getSizeOf(retType))
    var argsArr = types.castToCTypeFromArray(cif.argsTypes, arguments)
    var argsPtr = wrapPointers.apply(null, [ cif.numOfArgs ].concat(argsArr))

    debug('invoke foreign function')
    ffiCall(cif._cifPtr, fnPtr, retPtr, argsPtr)

    debug('invoked foreign function, casting return value')
    var retVal = types.castToJSType(cif.retType, retPtr)
    if (cif.retType === 'string') {
      debug('releasing underlying char*')
      var charPtr = derefPointerPointer(retPtr, 0)
      freePointer(charPtr)
    }
    return retVal
  }

  /**
   * The asynchronous version of the proxy function.
   */

  proxy.async = function async () {
    debug('invoking async proxy function')
    assert.strictEqual(arguments.length, numOfArgs + 1, 'expected ' + (numOfArgs + 1) + ' arguments')
    var callback = arguments[numOfArgs]
    assert.strictEqual(typeof callback, 'function', 'expect a function as the last argument of async call')

    // Allocates appropriate memory block used in ffi call
    var retPtr = alloc(types.getSizeOf(retType))
    var argsArr = types.castToCTypeFromArray(cif.argsTypes, Array.prototype.slice.call(arguments, 0, -1))
    var argsPtr = wrapPointers.apply(null, [ cif.numOfArgs ].concat(argsArr))

    /**
     * A callback proxy, shall be called exactly once
     * @param {Error} err
     */
    function callbackProxy (err) {
      if (err) {
        debug('on async callback error', err)
        callback(err)
        return
      }
      debug('on async ffi call succeeded, casting return value')
      var retVal = types.castToJSType(cif.retType, retPtr)
      debug('calling actual callback function')
      try {
        callback(null, retVal)
      } catch (err) {
        console.error('ffi: unexpected error on calling async callback', err)
      }
    }
    callbackProxy._callback = fnPtr
    callbackProxy._callbackObject = callbackObject
    callbackProxy.argsArr = argsArr
    callbackProxy.argsPtr = argsPtr

    ffiCallAsync(cif._cifPtr, fnPtr, retPtr, argsPtr, callbackProxy)
  }

  return proxy
}

module.exports = ForeignFunction
