/**
 *
 * @param {{name: string, setup: Function, cases: Function[]}[]} suites
 */
function run (filename, suites) {
  console.log('Start:', filename)
  suites.forEach(suite => {
    console.log('Pending:', suite.name)
    var statistic = {
      total: suite.cases.length,
      success: 0,
      failed: 0
    }
    suite.cases.forEach((esac, idx) => {
      var ctx
      try {
        if (suite.setup) {
          ctx = suite.setup()
        }
      } catch (err) {
        console.log('Failed Preparation:', suite.name + '#' + idx, err)
        statistic.failed += 1
        return
      }

      try {
        esac(ctx)
        console.log('Success:', suite.name + '#' + idx)
        statistic.success += 1
      } catch (err) {
        console.log('Failed:', suite.name + '#' + idx, err)
        statistic.failed += 1
      }
    })
  })
}

module.exports = run
