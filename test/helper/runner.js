/**
 *
 * @param {{name: string, setup?: Function, setups?: Function[], cases: Function[]}[]} suites
 */
function run (suites, logger) {
  if (logger == null) {
    logger = console
  }
  var exclusive = suites.reduce((accu, curr) => accu || curr.only, false)
  suites.forEach(suite => {
    if (exclusive && !suite.only) {
      logger.log('# 💤   ...Skipping:', suite.name)
      return
    }
    logger.log('# 🌀   ...Pending:', suite.name)
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
          if (typeof setup === 'function') {
            ctx = setup()
          } else {
            ctx = setup
          }
        } catch (err) {
          logger.log('# Failed Preparation:', caseName, err)
          statistic.failed += 1
          return
        }

        var isAsync = false
        var asyncTimer
        function done (err) {
          clearTimeout(asyncTimer)
          if (err) {
            logger.log('# Failed:', caseName, err)
            statistic.failed += 1
            return
          }
          logger.log('# Success:', caseName)
          statistic.success += 1
        }

        done.async = function async () {
          isAsync = true
        }

        try {
          esac(ctx, done)
          if (!isAsync) {
            logger.log('# Success:', caseName)
            statistic.success += 1
            return
          }
          asyncTimer = setTimeout(() => {
            logger.error('Timed out for async case ' + caseName)
          }, 3 * 1000)
        } catch (err) {
          logger.log('# Failed:', caseName, err)
          statistic.failed += 1
        }
      })
    }
  })
}

/**
 * Same suites as #run yet keeps running to detect possible memory leaks
 */
function keepRun (suites) {
  var logger = { log: () => {}, error: () => {} }
  setInterval(() => {
    var stat = process.memoryUsage()
    run(suites, logger)
    var curr = process.memoryUsage()
    var delta = curr.rss - stat.rss
    if (delta > 0) {
      console.log('🤢 rss size increased', delta)
    }
    if (delta < 0) {
      console.log('😳 rss size decreased', delta)
    }
  }, 10)
}

if (process.argv.indexOf('--keep-run') >= 0) {
  module.exports = keepRun
} else {
  module.exports = run
}
