var assert = require('assert')
var Struct = require('../../lib/types/struct')
var run = require('../helper/runner')

var testSuites = [
  {
    name: 'Callback properties',
    setups: [
      () => {
        return Struct([
          [ 'age', 'int' ],
          [ 'first_name', 'string' ],
          [ 'last_name', 'string' ]
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
  }
]

run(__filename, testSuites)
