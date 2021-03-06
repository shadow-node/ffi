var assert = require('assert')
var Callback = require('../lib/callback')
var ffi = require('../')
var run = require('./helper/runner')

var testSuites = [
  {
    name: 'Callback properties',
    setups: [
      () => {
        return new Callback('double', [ 'double' ], it => Math.abs(it))
      }
    ],
    cases: [
      it => {
        assert(!ffi.isPointerNull(it._codePtr))
        assert(!ffi.isPointerNull(it._closurePtr))
        assert(typeof it._proxy === 'function')
      }
    ]
  }
]

run(testSuites)
