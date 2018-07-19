var bindings = require('../bindings')

var Types = {
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
  var descriptor = Types[type]
  if (descriptor == null) {
    throw new Error('Unknown type ' + type)
  }
  return descriptor.size
}

module.exports.Types = Types
module.exports.getSizeOf = getSizeOf
