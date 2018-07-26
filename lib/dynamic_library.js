
/**
 * Module dependencies.
 */

var assert = require('assert')
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
