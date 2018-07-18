var Callback = require('./callback')
var CIF = require('./cif')
var DynamicLibrary = require('./dynamic_library')
var ForeignFunction = require('./foreign_function')
var Library = require('./library')
var Types = require('./types')

var bindings = require('./bindings')

module.exports.Callback = Callback
module.exports.CIF = CIF
module.exports.DynamicLibrary = DynamicLibrary
module.exports.ForeignFunction = ForeignFunction
module.exports.Library = Library
module.exports.Types = Types

module.exports.isPointerNull = bindings.is_pointer_null
module.exports.allocPointer = bindings.alloc_pointer
module.exports.alloc = bindings.alloc
module.exports.unwrapPointerPointer = bindings.unwrap_pointer_pointer
