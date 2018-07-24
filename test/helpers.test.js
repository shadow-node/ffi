var assert = require('assert')
var helpers = require('../lib/helpers')
var run = require('./helper/runner')

var testSuites = [
  {
    name: 'isInteger',
    setups: [
      [ 1, true ], [ -2000000, true ], [ 1.1, false ]
    ],
    cases: [
      it => {
        assert.strictEqual(helpers.isInteger(it[0]), it[1])
      }
    ]
  }
]

run(testSuites)
