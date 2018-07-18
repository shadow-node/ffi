var debug = require('debug')('ffi:binding')

module.exports = require('../build/bindings/shadow_ffi.node')

if (debug.enabled) {
  Object.keys(module.exports).forEach(key => {
    var orig = module.exports[key]
    if (typeof orig === 'function') {
      module.exports[key] = function proxy () {
        debug('calling native func:', key)
        var ret = orig.apply(null, arguments)
        debug('called native func:', key)
        return ret
      }
    }
  })
}
