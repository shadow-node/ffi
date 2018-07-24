var assert = require('assert')
var bindings = require('../bindings')
var Callback = require('../callback')
var isInteger = require('../helpers').isInteger

var castToCHandlers = {
  'double': checkNil(bindings.wrap_number_value),
  'int': checkNil(bindings.wrap_int_value),
  'string': nullOrValue(bindings.wrap_string_value),
  'pointer': nullOrValue(it => {
    if (it instanceof Callback) {
      it = it._codePtr
    }
    return bindings.wrap_pointers(1, it)
  })
}

var castToJsHandlers = {
  'void': () => null,
  'double': bindings.deref_number_pointer,
  'int': bindings.deref_int_pointer,
  'string': bindings.deref_string_pointer,
  'pointer': bindings.deref_pointer_pointer
}

var writeHandler = {
  'double': writeHandlerTypeWrapper('number', bindings.write_number_value),
  'int': writeHandlerTypeWrapper(isInteger, bindings.write_int_value),
  'string': writeHandlerTypeWrapper('string', bindings.write_string_value),
  'pointer': writeHandlerTypeWrapper(Buffer.isBuffer, bindings.write_pointer_value)
}

;[
  [ 'void *', 'pointer' ],
  [ 'integer', 'int' ],
  [ 'number', 'double' ]
].forEach(aliasMap => {
  castToCHandlers[aliasMap[0]] = castToCHandlers[aliasMap[1]]
  castToJsHandlers[aliasMap[0]] = castToJsHandlers[aliasMap[1]]
  writeHandler[aliasMap[0]] = writeHandler[aliasMap[1]]
})

function checkNil (binding) {
  return function conversion (value) {
    if (value == null) {
      throw new Error('Unexpected nil on before conversion hook')
    }
    return binding(value)
  }
}

function writeHandlerTypeWrapper (type, binding) {
  return function writeWrapper (pointer, offset, value) {
    if (typeof type === 'function') {
      assert(type(value), 'Failed type assertion on casting JS value to C types')
    } else {
      assert.strictEqual(typeof value, type, 'Expect a/an ' + type + ', but got a/an ' + typeof value)
    }
    return binding(pointer, offset, value)
  }
}

function nullOrValue (binding) {
  return function conversion (value) {
    if (value == null) {
      return bindings.alloc_pointer()
    }
    return binding(value)
  }
}

/**
 *
 * @param {string} type
 * @param {any} value
 */
function castToCType (type, value) {
  if (value === undefined) {
    throw new Error('Unexpected undefined on casting to c type')
  }
  var handler = castToCHandlers[type]
  if (handler == null) {
    throw new Error('type ' + type + ' is not supported yet')
  }
  var buf = handler(value)
  buf._type = type
  return buf
}

/**
 *
 * @param {string[]} types
 * @param {ArrayLike} values
 */
function castToCTypeFromArray (types, values) {
  return types.map((type, idx) => {
    var val = values[idx]
    return castToCType(type, val)
  })
}

/**
 *
 * @param {string} type
 * @param {Buffer} ptr
 * @param {number} [offset]
 */
function castToJSType (type, ptr, offset) {
  if (ptr == null) {
    throw new Error('Unexpected nil on casting to js type')
  }
  var handler = castToJsHandlers[type]
  if (handler == null) {
    throw new Error('type ' + type + ' is not supported yet')
  }
  return handler(ptr, offset)
}

/**
 *
 * @param {string[]} types
 * @param {ArrayLike} ptrs
 */
function castToJSTypeFromArray (types, ptrs) {
  return types.map((type, idx) => {
    var val = ptrs[idx]
    if (val == null) {
      throw new Error('Unexpected nil on casting to js type')
    }
    return castToJSType(type, val)
  })
}

function writeTo (type, ptr, offset, value) {
  if (ptr == null) {
    throw new Error('Unexpected nil on casting to js type')
  }
  var handler = writeHandler[type]
  if (handler == null) {
    throw new Error('type ' + type + ' is not supported yet')
  }
  return handler(ptr, offset, value)
}

module.exports.castToCType = castToCType
module.exports.castToCTypeFromArray = castToCTypeFromArray
module.exports.castToJSType = castToJSType
module.exports.castToJSTypeFromArray = castToJSTypeFromArray
module.exports.writeTo = writeTo

Object.assign(module.exports, require('./definition'))
