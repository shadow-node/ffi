var assert = require('assert')
var ffi = require('../lib/ffi')

var libm = ffi.Library('libm', {
  'ceil': [ 'double', [ 'double' ] ]
})
assert.strictEqual(libm.ceil(1.5), 2)
