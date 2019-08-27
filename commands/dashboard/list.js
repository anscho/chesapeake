// https://docs.datadoghq.com/api/?lang=python#get-a-dashboard
// https://docs.datadoghq.com/api/?lang=python#get-a-dashboard-list

// Returns the contents of a dashboard list
const { BasicCommand } = require('@anscho/hive')
const datadog = require('../../datadog')

const run = async (argv, help) => {
  const monitor_id = argv._[0]

  if (!monitor_id) {
    help()
    process.exit(1)
  }

  // FIXME: DASHBOARD
  return datadog.get_monitor(monitor_id)
}

module.exports = new BasicCommand({
  name: 'list',
  options: 'TODO',
  description: 'TODO',
  run
})
