var assert = require('assert')
var CIF = require('../lib/cif')
var ffi = require('../')
var run = require('./helper/runner')

var testSuites = [
  {
    name: 'Callback properties',
    setups: [
      () => {
        return new CIF('double', [ 'double' ])
      }
    ],
    cases: [
      it => {
        assert(!ffi.isPointerNull(it._cifPtr))
      }
    ]
  }
]

run(testSuites)
