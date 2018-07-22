/**
 *
 * @param {{name: string, setup?: Function, setups?: Function[], cases: Function[]}[]} suites
 */
function run (suites) {
  suites.forEach(suite => {
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

        try {
          esac(ctx)
          console.log('# Success:', caseName)
          statistic.success += 1
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
