var assert = require('assert')
var Callback = require('../lib/callback')
var ForeignFunction = require('../lib/foreign_function')
var run = require('./helper/runner')

var testSuites = [
  {
    name: 'JS Callback as Foreign Function',
    setup: () => {
      var callback = new Callback('string', [ 'string' ], it => it)
      var func = ForeignFunction(callback, 'string', [ 'string' ])
      func._callback = callback
      return func
    },
    cases: [
      it => {
        assert(it('foobar') === 'foobar')
      }
    ]
  }
]

run(__filename, testSuites)
