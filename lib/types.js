var bindings = require('./bindings')

var toC = {
  'double': bindings.wrap_number_value,
  'number': bindings.wrap_number_value,
  'int': bindings.wrap_integer_value,
  'integer': bindings.wrap_integer_value,
  'string': bindings.wrap_string_value,
  'pointer': it => it
}

var toJS = {
  'double': bindings.unwrap_number_value,
  'number': bindings.unwrap_number_value,
  'int': bindings.unwrap_integer_value,
  'integer': bindings.unwrap_integer_value,
  'string': bindings.unwrap_string_value,
  'pointer': it => it
}

/**
 *
 * @param {string} type
 * @param {any} value
 */
function castToCType (type, value) {
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
  var handler = toJS[type]
  if (handler == null) {
    throw new Error('type ' + type + ' is not supported yet')
  }
  return handler(ptr)
}

module.exports.castToCType = castToCType
module.exports.castToCTypeFromArray = castToCTypeFromArray
module.exports.castToJSType = castToJSType
