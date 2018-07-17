var Callback = require('./callback')
var CIF = require('./cif')
var DynamicLibrary = require('./dynamic_library')
var ForeignFunction = require('./foreign_function')
var Library = require('./library')

var bindings = require('./bindings')

module.exports.Callback = Callback
module.exports.CIF = CIF
module.exports.DynamicLibrary = DynamicLibrary
module.exports.ForeignFunction = ForeignFunction
module.exports.Library = Library

module.exports.isPointerNull = bindings.is_pointer_null
