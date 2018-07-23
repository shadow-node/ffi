var assert = require('assert')

/**
 *
 * @param {{name: string, setup?: Function, setups?: Function[], cases: Function[]}[]} suites
 */
function run (suites) {
  var exclusive = suites.reduce((accu, curr) => accu || curr.only, false)
  suites.forEach(suite => {
    if (exclusive && !suite.only) {
      console.log('# 💤   ...Skipping:', suite.name)
      return
    }
    console.log('# 🌀   ...Pending:', suite.name)
    var statistic = {
      name: suite.name,
      total: suite.cases.length,
      success: 0,
      failed: 0
    }
    if (suite.setups) {
      suite.setups.forEach((setup, idx) => runCases(setup, idx))
    } else {
      runCases(suite.setup)
    }

    if (statistic.failed > 0) {
      process.exitCode = 1
    }

    function runCases (setup, setupIdx) {
      suite.cases.forEach((esac, idx) => {
        var caseName = (setupIdx != null ? 'setup' + setupIdx : '') + '#case' + idx
        var ctx
        try {
          if (setup) {
            ctx = setup()
          }
        } catch (err) {
          console.log('# Failed Preparation:', caseName, err)
          statistic.failed += 1
          return
        }

        var isAsync = false
        var asyncTimer
        function done (err) {
          assert(err == null, 'Unexpected error on async callback result')
          clearTimeout(asyncTimer)
          setTimeout(() => {
            process.gc()
          }, 0)
        }

        done.async = function async () {
          isAsync = true
        }

        try {
          esac(ctx, done)
          if (!isAsync) {
            console.log('# Success:', caseName)
            statistic.success += 1
            return
          }
          asyncTimer = setTimeout(() => {
            console.error('Timed out for async case ' + caseName)
          }, 3 * 1000)
        } catch (err) {
          console.log('# Failed:', caseName, err)
          statistic.failed += 1
        }
      })

      // TODO: force GC to release uv handles holder
      // Shall be fixed on shadow-node
      process.gc()
    }
  })
}

module.exports = run
