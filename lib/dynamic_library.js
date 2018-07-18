
/**
 * Module dependencies.
 */

var assert = require('assert')
var read = require('fs').readFileSync
var debug = require('debug')('ffi:DynamicLibrary')
var ForeignFunction = require('./foreign_function')
var bindings = require('./bindings')

var dlopen = ForeignFunction(bindings.dlopen, 'pointer', [ 'string', 'int' ])
var dlclose = ForeignFunction(bindings.dlclose, 'int', [ 'pointer' ])
var dlsym = ForeignFunction(bindings.dlsym, 'pointer', [ 'pointer', 'string' ])
var dlerror = ForeignFunction(bindings.dlerror, 'string', [ ])

var isPointerNull = bindings.is_pointer_null

/**
 * `DynamicLibrary` loads and fetches function pointers for dynamic libraries
 * (.so, .dylib, etc). After the libray's function pointer is acquired, then you
 * call `get(symbol)` to retreive a pointer to an exported symbol. You need to
 * call `get___()` on the pointer to dereference it into its actual value, or
 * turn the pointer into a callable function with `ForeignFunction`.
 */
function DynamicLibrary (path, mode) {
  if (!(this instanceof DynamicLibrary)) {
    return new DynamicLibrary(path, mode)
  }
  debug('new DynamicLibrary()', path, mode)

  if (mode == null) {
    mode = DynamicLibrary.FLAGS.RTLD_LAZY
  }

  this._handle = dlopen(path, mode)
  assert(Buffer.isBuffer(this._handle), 'expected a Buffer instance to be returned from `dlopen()`')
  debug('opened library', path)

  if (isPointerNull(this._handle)) {
    var err = this.error()

    // THIS CODE IS BASED ON GHC Trac ticket #2615
    // http://hackage.haskell.org/trac/ghc/attachment/ticket/2615

    // On some systems (e.g., Gentoo Linux) dynamic files (e.g. libc.so)
    // contain linker scripts rather than ELF-format object code. This
    // code handles the situation by recognizing the real object code
    // file name given in the linker script.

    // If an "invalid ELF header" error occurs, it is assumed that the
    // .so file contains a linker script instead of ELF object code.
    // In this case, the code looks for the GROUP ( ... ) linker
    // directive. If one is found, the first file name inside the
    // parentheses is treated as the name of a dynamic library and the
    // code attempts to dlopen that file. If this is also unsuccessful,
    // an error message is returned.

    // see if the error message is due to an invalid ELF header
    var match = err.match(/^(([^ \t()])+\.so([^ \t:()])*):([ \t])*/)

    if (match) {
      var content = read(match[1], 'ascii')
      // try to find a GROUP ( ... ) command
      match = content.match(/GROUP *\( *(([^ )])+)/)
      if (match) {
        return DynamicLibrary.call(this, match[1], mode)
      }
    }

    throw new Error('Dynamic Linking Error: ' + err)
  }
}
module.exports = DynamicLibrary

/**
 * Set the exported flags from "dlfcn.h"
 */
DynamicLibrary.FLAGS = {}
Object.keys(bindings).forEach(function (k) {
  if (!/^RTLD_/.test(k)) {
    return
  }
  var desc = Object.getOwnPropertyDescriptor(bindings, k)
  Object.defineProperty(DynamicLibrary.FLAGS, k, desc)
})

/**
 * Close this library, returns the result of the dlclose() system function.
 */
DynamicLibrary.prototype.close = function () {
  debug('dlclose()')
  return dlclose(this._handle)
}

/**
 * Get a symbol from this library, returns a Pointer for (memory address of) the symbol
 */
DynamicLibrary.prototype.get = function (symbol) {
  debug('dlsym()', symbol)
  assert.equal('string', typeof symbol)

  var ptr = dlsym(this._handle, symbol)
  assert(Buffer.isBuffer(ptr))

  if (isPointerNull(ptr)) {
    throw new Error('Dynamic Symbol Retrieval Error: ' + this.error())
  }

  ptr.name = symbol

  return ptr
}

/**
 * Returns the result of the dlerror() system function
 */
DynamicLibrary.prototype.error = function error () {
  debug('dlerror()')
  return dlerror()
}
