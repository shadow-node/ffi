var assert = require('assert')
var Struct = require('../../lib/types/struct')
var run = require('../helper/runner')

var testSuites = [
  {
    name: 'Struct field validations',
    setups: [
      () => {
        return Struct([
          [ 'age', 'int' ],
          [ 'first_name', 'string' ],
          [ 'last_name', 'string' ]
        ])
      },
      () => {
        return Struct([
          [ 'age', 'int' ],
          [ 'last_name', 'string' ],
          [ 'first_name', 'string' ]
        ])
      },
      () => {
        return Struct([
          [ 'first_name', 'string' ],
          [ 'last_name', 'string' ],
          [ 'age', 'int' ]
        ])
      }
    ],
    cases: [
      PersonStruct => {
        var person = new PersonStruct({ age: 42, first_name: 'Cersei', last_name: 'Lannister' })
        assert.strictEqual(person.age, 42)
        assert.strictEqual(person.first_name, 'Cersei')
        assert.strictEqual(person.last_name, 'Lannister')
      },
      PersonStruct => {
        var person = new PersonStruct({ age: 28, first_name: 'Daenerys', last_name: 'Targaryen' })
        person.age = 23
        person.first_name = 'Jon'
        person.last_name = 'Snow'
        assert.strictEqual(person.age, 23)
        assert.strictEqual(person.first_name, 'Jon')
        assert.strictEqual(person.last_name, 'Snow')
      }
    ]
  },
  {
    name: 'Initialize with an already initialized memory block',
    setups: [
      () => {
        var PersonStruct = Struct([
          [ 'age', 'int' ],
          [ 'first_name', 'string' ],
          [ 'last_name', 'string' ]
        ])
        var personIntermediate = new PersonStruct({ age: 42, first_name: 'Cersei', last_name: 'Lannister' })
        return [ new PersonStruct(undefined, { ptr: personIntermediate._ptr }), personIntermediate ]
      }
    ],
    cases: [
      persons => {
        var person = persons[0]
        assert.strictEqual(person.age, 42)
        assert.strictEqual(person.first_name, 'Cersei')
        assert.strictEqual(person.last_name, 'Lannister')
      },
      persons => {
        var person = persons[0]
        var pperson = persons[1]
        person.age = 23
        person.first_name = 'Jon'
        person.last_name = 'Snow'
        assert.strictEqual(pperson.age, 23)
        assert.strictEqual(pperson.first_name, 'Jon')
        assert.strictEqual(pperson.last_name, 'Snow')
      }
    ]
  }
]

run(testSuites)
