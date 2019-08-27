// Simplest sub-command, to get a monitor from the API
const { BasicCommand } = require('@anscho/hive')
const datadog = require('../../datadog')

const run = async (argv, help) => {
  const monitor_id = argv._[0]

  if (!monitor_id) {
    help()
    process.exit(1)
  }

  return datadog.get_monitor(monitor_id)
}

module.exports = new BasicCommand({
  name: 'get',
  arguments: '<monitor ID>',
  description: 'Retrieve a datadog monitor by ID.',
  run
})
