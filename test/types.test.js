var assert = require('assert')
var ffi = require('../')
var Types = require('../lib/types')
var run = require('./helper/runner')

var testSuites = [
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

run(__filename, testSuites)
