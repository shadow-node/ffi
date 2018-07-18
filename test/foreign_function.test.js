var assert = require('assert')
var Callback = require('../lib/callback')
var ForeignFunction = require('../lib/foreign_function')
var ffi = require('../')
var run = require('./helper/runner')

var test_suites = [
  {
    name: 'JS Callback as Foreign Function',
    setup: () => {
      var callback = new Callback('double', [ 'double' ], Math.ceil)
      var func = ForeignFunction(callback, 'double', [ 'double' ])
      func._callback = callback
      return func
    },
    cases: [
      it => {
        assert(it(1.2) === 2)
      }
    ]
  }
]

run(__filename, test_suites)
