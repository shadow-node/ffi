var assert = require('assert')
var Callback = require('../lib/callback')
var ForeignFunction = require('../lib/foreign_function')
var run = require('./helper/runner')

var testSuites = [
  {
    name: 'JS Callback as Foreign Function with string arguments',
    setups: [
      () => {
        var callback = new Callback('string', [ 'string' ], it => it)
        var func = ForeignFunction(callback, 'string', [ 'string' ])
        func._callback = callback
        return func
      }
    ],
    cases: [
      it => {
        assert(it('foobar') === 'foobar')
      },
      (it, done) => {
        done.async()
        it.async('foobar', (err, ret) => {
          console.log('js: callback called', err, ret)
          if (err) {
            return done(err)
          }
          assert.strictEqual(ret, 'foobar')
          done()
        })
      }
    ]
  },
  {
    name: 'JS Callback as Foreign Function with number arguments',
    setups: [
      () => {
        var callback = new Callback('int', [ 'int' ], it => it)
        var func = ForeignFunction(callback, 'int', [ 'int' ])
        func._callback = callback
        return func
      },
      () => {
        var callback = new Callback('double', [ 'int' ], it => it)
        var func = ForeignFunction(callback, 'double', [ 'int' ])
        func._callback = callback
        return func
      },
      () => {
        var callback = new Callback('double', [ 'double' ], it => it)
        var func = ForeignFunction(callback, 'double', [ 'double' ])
        func._callback = callback
        return func
      },
      () => {
        var callback = new Callback('int', [ 'double' ], it => it)
        var func = ForeignFunction(callback, 'int', [ 'double' ])
        func._callback = callback
        return func
      }
    ],
    cases: [
      it => {
        assert(it(123) === 123)
      }
    ]
  }
]

run(testSuites)
