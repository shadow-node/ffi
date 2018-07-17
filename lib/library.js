
/**
 * Module dependencies.
 */

var debug = require('debug')('ffi:Library')

var DynamicLibrary = require('./dynamic_library')
var ForeignFunction = require('./foreign_function')
var bindings = require('./bindings')

var isPointerNull = bindings.is_pointer_null

var RTLD_NOW = DynamicLibrary.FLAGS.RTLD_NOW

/**
 * The extension to use on libraries.
 * i.e.  libm  ->  libm.so   on linux
 */
var EXT = Library.EXT = {
  'linux': '.so',
  'linux2': '.so',
  'sunos': '.so',
  'solaris': '.so',
  'freebsd': '.so',
  'openbsd': '.so',
  'darwin': '.dylib',
  'mac': '.dylib',
  'win32': '.dll'
}[process.platform]

/**
 * Provides a friendly abstraction/API on-top of DynamicLibrary and
 * ForeignFunction.
 */
function Library (libfile, funcs, lib) {
  debug('creating Library object for', libfile)

  if (libfile && libfile.indexOf(EXT) === -1) {
    debug('appending library extension to library name', EXT)
    libfile += EXT
  }

  if (!lib) {
    lib = {}
  }
  var dl = new DynamicLibrary(libfile || null, RTLD_NOW)

  Object.keys(funcs || {}).forEach(function (func) {
    debug('defining function', func)

    var fptr = dl.get(func)
    var info = funcs[func]

    if (isPointerNull(fptr)) {
      throw new Error('Library: "' + libfile +
        '" returned NULL function pointer for "' + func + '"')
    }

    var resultType = info[0]
    var paramTypes = info[1]
    var fopts = info[2]
    var abi = fopts && fopts.abi
    var async = fopts && fopts.async

    var ff = ForeignFunction(fptr, resultType, paramTypes, abi)
    lib[func] = async ? ff.async : ff
  })

  return lib
}
module.exports = Library
