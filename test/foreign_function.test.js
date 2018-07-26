var assert = require('assert')
var Callback = require('../lib/callback')
var ForeignFunction = require('../lib/foreign_function')
var run = require('./helper/runner')

var testSuites = [
  {
    name: 'JS Callback as Foreign Function with string arguments',
    comment: 'TODO: Possible memory leaks on arguments',
    setups: [
      () => {
        var callback = new Callback('int', [ 'string' ], it => String(it).length)
        var func = ForeignFunction(callback, 'int', [ 'string' ])
        func._callback = callback
        return func
      }
    ],
    cases: [
      it => {
        assert(typeof it === 'function')
        assert(typeof it.async === 'function')
      },
      it => {
        assert(it('foobar') === 6)
      },
      (it, done) => {
        done.async()
        it.async('foobar', (err, ret) => {
          if (err) {
            return done(err)
          }
          assert.strictEqual(ret, 6)
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
  },
  {
    name: 'JS Callback as Foreign Function with string returns',
    comment: 'TODO: Possible memory leaks on return value',
    setups: [
      () => {
        var callback = new Callback('string', [ 'double' ], it => String(it))
        var func = ForeignFunction(callback, 'string', [ 'double' ])
        func._callback = callback
        return func
      }
    ],
    cases: [
      it => {
        assert(it(100) === '100')
      },
      (it, done) => {
        done.async()
        it.async(100, (err, ret) => {
          if (err) {
            return done(err)
          }
          assert.strictEqual(ret, '100')
          done()
        })
      }
    ]
  }
]

run(testSuites)
