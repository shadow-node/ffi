var assert = require('assert')

var bindings = require('./bindings')
var Callback = require('./callback')
var CIF = require('./cif')
var types = require('./types')

var allocPointer = bindings.alloc_pointer
var ffiCall = bindings.ffi_call
var wrapPointers = bindings.wrap_pointers

function ForeignFunction (fnPtr, retType, argsTypes, abi) {
  if (fnPtr instanceof Callback) {
    fnPtr = fnPtr._codePtr
  }
  assert(Buffer.isBuffer(fnPtr), 'expected Buffer as first argument')
  assert(typeof retType === 'string', 'expected a return "type" string as the second argument')
  assert(Array.isArray(argsTypes), 'expected Array of arg "type" string as the third argument')
  var cif = new CIF(retType, argsTypes, abi)

  return function proxy () {
    var retPtr = allocPointer()
    var argsArr = types.castToCTypeFromArray(cif.argsTypes, arguments)
    var argsPtr = wrapPointers.apply(null, [ cif.numOfArgs ].concat(argsArr))

    ffiCall(cif._cifPtr, fnPtr, retPtr, argsPtr)

    return types.castToJSType(cif.retType, retPtr)
  }
}

module.exports = ForeignFunction
