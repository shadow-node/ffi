var bindings = require('./bindings')

var toC = {
  'double': checkNil(bindings.wrap_number_value),
  'number': checkNil(bindings.wrap_number_value),
  'int': checkNil(bindings.wrap_integer_value),
  'integer': checkNil(bindings.wrap_integer_value),
  'string': nullOrValue(bindings.wrap_string_value),
  'pointer': nullOrValue(it => it)
}

var toJS = {
  'double': bindings.unwrap_number_value,
  'number': bindings.unwrap_number_value,
  'int': bindings.unwrap_integer_value,
  'integer': bindings.unwrap_integer_value,
  'string': bindings.unwrap_string_value,
  'pointer': it => it
}

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
  return handler(value)
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
function castToJSType (type, ptr) {
  if (ptr == null) {
    throw new Error('Unexpected nil on casting to js type')
  }
  var handler = toJS[type]
  if (handler == null) {
    throw new Error('type ' + type + ' is not supported yet')
  }
  return handler(ptr)
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

module.exports.castToCType = castToCType
module.exports.castToCTypeFromArray = castToCTypeFromArray
module.exports.castToJSType = castToJSType
module.exports.castToJSTypeFromArray = castToJSTypeFromArray
