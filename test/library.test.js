var assert = require('assert')
var Library = require('../lib/library')
var run = require('./helper/runner')

var testSuites = [
  {
    name: 'Call dynamic library functions',
    setup: () => {
      var libm = Library('libm', {
        'ceil': [ 'double', [ 'double' ] ]
      })
      return libm
    },
    cases: [
      lib => {
        assert.strictEqual(lib.ceil(1.5), 2)
      }
    ]
  },
  {
    name: 'Call functions in current process namespace',
    setup: () => {
      var current = Library(null, {
        'atoi': [ 'int', [ 'string' ] ]
      })
      return current
    },
    cases: [
      lib => {
        assert.strictEqual(lib.atoi('1234'), 1234)
      }
    ]
  }
]

run(__filename, testSuites)
