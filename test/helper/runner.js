/**
 *
 * @param {{name: string, setup?: Function, setups?: Function[], cases: Function[]}[]} suites
 */
function run (filename, suites) {
  console.log('Start:', filename)
  suites.forEach(suite => {
    console.log('Pending:', suite.name)
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

    function runCases (setup, setupIdx) {
      suite.cases.forEach((esac, idx) => {
        var caseName = suite.name + (setupIdx != null ? '#setup' + setupIdx : '') + '#case' + idx
        var ctx
        try {
          if (setup) {
            ctx = setup()
          }
        } catch (err) {
          console.log('Failed Preparation:', caseName, err)
          statistic.failed += 1
          return
        }

        try {
          esac(ctx)
          console.log('Success:', caseName)
          statistic.success += 1
        } catch (err) {
          console.log('Failed:', caseName, err)
          statistic.failed += 1
        }
      })
    }
  })
}

module.exports = run
