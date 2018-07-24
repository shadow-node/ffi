# shadow-ffi

### ShadowNode Foreign Function Interface
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/57d46bfe959b4742ad614be1d9cfda7b)](https://app.codacy.com/app/legendecas/ffi?utm_source=github.com&utm_medium=referral&utm_content=shadow-node/ffi&utm_campaign=badger)
[![Build Status](https://travis-ci.com/shadow-node/ffi.svg?branch=master)](https://travis-ci.com/shadow-node/ffi)

`shadow-ffi` is a ShadowNode addon for loading and calling dynamic libraries using
pure JavaScript. It can be used to create bindings to native libraries without
writing any C++ code.

It also simplifies the augmentation of ShadowNode with C code as it takes care of
handling the translation of types across JavaScript and C, which can add reams
of boilerplate code to your otherwise simple C. See the `example/factorial`
for an example of this use case.

**WARNING**: shadow-ffi assumes you know what you're doing. You can pretty easily
create situations where you will segfault the interpreter and unless you've got
C debugger skills, you probably won't know what's going on.

## Example

``` js
var ffi = require('ffi');

var libm = ffi.Library('libm', {
  'ceil': [ 'double', [ 'double' ] ]
});
libm.ceil(1.5); // 2

// You can also access just functions in the current process by passing a null
var current = ffi.Library(null, {
  'atoi': [ 'int', [ 'string' ] ]
});
current.atoi('1234'); // 1234
```

## Requirements

 * Linux, OS X
 * `libffi` comes bundled with shadow-ffi by default; it does *not* need to be installed on your system if you build shadow-ffi in static mode.

## Installation

An easy way to install shadow-ffi is going to be implemented. Right now it has to be installed with source code documented as next section.

## Source Install / Manual Compilation

``` bash
$ git clone git://github.com/shadow-node/ffi.git shadow-ffi
$ cd shadow-ffi
$ npm run build
```

### Use system libffi.{dylib,so}

shadow-ffi can be built with dynamically linked libffi. To build shadow-ffi dynamically linked:

```bash
$ npm run build -- --libffi-link-external
```

## Call Overhead

There is non-trivial overhead associated with FFI calls. Comparing a hard-coded
binding version of `strtoul()` to an FFI version of `strtoul()` shows that the
native hard-coded binding is orders of magnitude faster. So don't just use the
C version of a function just because it's faster. There's a significant cost in
FFI calls, so make them worth it.

## License

MIT License. See the `LICENSE` file.

A project derived from [node-ffi](https://github.com/node-ffi/node-ffi).
