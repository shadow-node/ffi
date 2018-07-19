var assert = require('assert')
var bindings = require('../../lib/bindings')
var run = require('../helper/runner')

var testSuites = [
  {
    name: 'Int',
    setups: [
      () => {
        var pointer = bindings.alloc(8)
        bindings.write_int_value(pointer, 0, 123)
        return [ pointer, 0 ]
      },
      () => {
        var pointer = bindings.alloc(16)
        bindings.write_int_value(pointer, 8, 123)
        return [ pointer, 8 ]
      }
    ],
    cases: [
      it => {
        var ret = bindings.deref_int_pointer(it[0], it[1])
        assert.strictEqual(ret, 123)
      }
    ]
  },
  {
    name: 'String',
    setups: [
      () => {
        var pointer = bindings.alloc(8)
        bindings.write_string_value(pointer, 0, 'foobar')
        return [ pointer, 0 ]
      }
    ],
    cases: [
      it => {
        var ret = bindings.deref_string_pointer(it[0], it[1])
        assert.strictEqual(ret, 'foobar')
      }
    ]
  },
  {
    name: 'Pointer',
    setups: [
      () => {
        var pointer = bindings.alloc(8)
        var data = bindings.wrap_string_value('foobar')
        bindings.write_pointer_value(pointer, 0, data)
        pointer._ref = data
        return [ pointer, 0 ]
      }
    ],
    cases: [
      it => {
        var pointer = bindings.deref_pointer_pointer(it[0], it[1])
        assert(Buffer.isBuffer(pointer))
        var ret = bindings.deref_string_pointer(pointer)
        assert.strictEqual(ret, 'foobar')
      }
    ]
  }
]

run(__filename, testSuites)
