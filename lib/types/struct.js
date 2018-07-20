var assert = require('assert')
var Debug = require('debug')
var util = require('util')

var Types = require('./')
var bindings = require('../bindings')

var debug = Debug('ffi:struct')

function AStruct () {

}

/**
 *
 * @param {[string, string][]} members
 */
function StructClassConstructor (members) {
  assert(Array.isArray(members))
  var keys = members.map(it => it[0])
  var types = members.map(it => it[1])
  var typeSizes = types.map(Types.getSizeOf)
  var alignment = Struct.alignment = typeSizes.reduce((accu, curr) => accu > curr ? accu : curr, 0)
  var size = Struct.size = typeSizes.reduce((accu, curr) => accu + (curr < alignment ? alignment : curr), 0)
  Struct.packed = false
  debug('Create size(' + size + ')/alignment(' + alignment + ') struct with members', members)

  var properties = {}
  keys.forEach((key, idx) => {
    properties[key] = {
      enumerable: true,
      configurable: true,
      get: function get () {
        var offset = alignment * idx
        debug('get a field:', key, 'offset', offset)
        return Types.castToJSType(types[idx], this._ptr, offset)
      },
      set: function set (val) {
        var offset = alignment * idx
        debug('set a field:', key, 'offset', offset)
        Types.writeTo(types[idx], this._ptr, offset, val)
      }
    }
  })

  util.inherits(Struct, AStruct)
  return Struct

  /**
   *
   * @param {object} fields
   * @param {object} [opts]
   * @param {Buffer} [opts.ptr] pre-initialized underlying memory block pointer
   */
  function Struct (fields, opts) {
    debug('instantiate a struct with fields', fields)
    opts = Object.assign({}, opts)
    if (opts.ptr && Buffer.isBuffer(opts.ptr)) {
      this._ptr = opts.ptr
    } else {
      this._ptr = bindings.alloc(size)
    }

    Object.defineProperties(this, properties)
    if (fields) {
      Object.keys(fields).forEach(key => {
        this[key] = fields[key]
      })
    }
  }
}

module.exports = StructClassConstructor
module.exports.AStruct = AStruct
