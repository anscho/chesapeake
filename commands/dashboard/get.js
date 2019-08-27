// Simplest sub-command, to get a dashboard from the API
const { BasicCommand } = require('@anscho/hive')
const datadog = require('../../datadog')

const run = async (argv, help) => {
  const id = argv._[0]

  if (!id) {
    help()
    process.exit(1)
  }

  return datadog.get_dashboard(id)
}

module.exports = new BasicCommand({
  name: 'get',
  options: '<dashboard ID>',
  description: 'Get a datadog dashboard by ID.',
  run
})
