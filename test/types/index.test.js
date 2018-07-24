var assert = require('assert')
var ffi = require('../../')
var Types = require('../../lib/types')
var bindings = require('../../lib/bindings')
var run = require('../helper/runner')

var testSuites = [
  {
    name: 'Write value type check',
    setups: [
      [ 'double', 1.1 ], [ 'int', 1 ], [ 'string', 'foobar' ],
      [ 'double', 'foobar', true ], [ 'int', 1.1, true ], [ 'string', 1, true ]
    ],
    cases: [
      it => {
        var type = it[0]
        var value = it[1]
        var throws = it[2]

        var ptr = bindings.alloc(Types.getSizeOf(type))
        if (throws) {
          assert.throws(write)
        } else {
          write()
          var ret = Types.castToJSType(type, ptr, 0)
          assert.strictEqual(ret, value)
        }

        function write () {
          Types.writeTo(type, ptr, 0, value)
        }
      }
    ]
  },
  {
    name: 'Cast to C type',
    setups: [
      () => [ 'double', 1 ],
      () => [ 'int', 1 ],
      () => [ 'string', 'foobar' ],
      () => [ 'pointer', null ],
      () => [ 'pointer', ffi.allocPointer() ]
    ],
    cases: [
      it => {
        var buf = Types.castToCType(it[0], it[1])
        assert(Buffer.isBuffer(buf))
      }
    ]
  },
  {
    name: 'Cast to JS type',
    setups: [
      () => [ Types.castToCType('double', 1), 'number' ],
      () => [ Types.castToCType('int', 1), 'number' ],
      () => [ Types.castToCType('string', 'foobar'), 'string' ],
      () => [ Types.castToCType('pointer', null), 'object' ],
      () => [ Types.castToCType('pointer', ffi.allocPointer()), 'object' ]
    ],
    cases: [
      it => {
        var ret = Types.castToJSType(it[0]._type, it[0])
        // eslint-disable-next-line valid-typeof
        assert(typeof ret === it[1])
      }
    ]
  }
]

run(testSuites)
