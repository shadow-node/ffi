var bindings = require('./bindings')
var Callback = require('./callback')

var types = {
  'void *': {
    size: bindings.Constant.POINTER_SIZE
  },
  'pointer': {
    size: bindings.Constant.POINTER_SIZE
  },
  'void': {
    size: 1
  },
  'int8': {
    size: 1
  },
  'uint8': {
    size: 1
  },
  'int16': {
    size: 2
  },
  'uint16': {
    size: 2
  },
  'int32': {
    size: 4
  },
  'uint32': {
    size: 4
  },
  'int64': {
    size: 8
  },
  'uint64': {
    size: 8
  },
  'float': {
    size: 4
  },
  'double': {
    size: 8
  },
  'char *': {
    size: bindings.Constant.POINTER_SIZE
  },
  'string': {
    size: bindings.Constant.POINTER_SIZE
  },
  'bool': {
    size: 1
  },
  'char': {
    size: 1
  },
  'uchar': {
    size: 1
  },
  'short': {
    size: 2
  },
  'ushort': {
    size: 2
  },
  'int': {
    size: bindings.Constant.INT_SIZE
  },
  'uint': {
    size: bindings.Constant.INT_SIZE
  },
  'long': {
    size: bindings.Constant.LONG_SIZE
  },
  'ulong': {
    size: bindings.Constant.LONG_SIZE
  },
  'size_t': {
    size: bindings.Constant.SIZE_T_SIZE
  }
}

function getSizeOf (type) {
  var descriptor = types[type]
  if (descriptor == null) {
    throw new Error('Unknow type ' + type)
  }
  return descriptor.size
}

var toC = {
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

var toJS = {
  'double': bindings.unwrap_number_value,
  'int': bindings.unwrap_int_value,
  'string': bindings.unwrap_string_value,
  'pointer': bindings.unwrap_pointer_pointer
}

;[
  [ 'void *', 'pointer' ],
  [ 'integer', 'int' ],
  [ 'number', 'double' ]
].forEach(aliasMap => {
  toC[aliasMap[0]] = toC[aliasMap[1]]
  toJS[aliasMap[0]] = toJS[aliasMap[1]]
})

function checkNil (binding) {
  return function conversion (value) {
    if (value == null) {
      throw new Error('Unexpected nil on before conversion hook')
    }
    return binding(value)
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
  var handler = toC[type]
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
 */
function castToJSType (type, ptr, idx) {
  if (ptr == null) {
    throw new Error('Unexpected nil on casting to js type')
  }
  var handler = toJS[type]
  if (handler == null) {
    throw new Error('type ' + type + ' is not supported yet')
  }
  return handler(ptr, idx)
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

module.exports.types = types
module.exports.getSizeOf = getSizeOf

module.exports.castToCType = castToCType
module.exports.castToCTypeFromArray = castToCTypeFromArray
module.exports.castToJSType = castToJSType
module.exports.castToJSTypeFromArray = castToJSTypeFromArray
