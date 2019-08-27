// Returns the contents of a dashboard list
const fs = require('fs')
const {
  BasicCommand,
  utilities
} = require('@anscho/hive')

const { isVerbose } = utilities

const datadog = require('../../datadog')

module.exports = new BasicCommand({
  name: 'export',
  options: '<dashboard list ID> <output directory>',
  description: 'Write the dashboards from a dashboard list to disk.',
  run: async (argv, help) => {
    const list_id = argv._[0]
    const path = argv._[1]

    if (!list_id || !path) {
      help()
      process.exit(1)
    }

    try {
      fs.mkdirSync(path, { recursive: true })
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(error)
      }
    }

    const list = JSON.parse(await datadog.get_dashboard_list(list_id))
    const ids = list.dashboards.map(entry => entry.new_id)

    await Promise.all(ids.map(async id => {
      const dashboard = JSON.parse(await datadog.get_dashboard(id))
      fs.writeFileSync(
        `${path}/${dashboard.id}.json`,
        JSON.stringify(dashboard, null, 2)
      )
    }))
    if (isVerbose(argv)) {
      console.log(`Wrote ${ids.length} dashboards to ${path}`)
    }
  }
})
