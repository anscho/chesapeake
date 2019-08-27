// Returns the contents of a dashboard list
const { BasicCommand } = require('@anscho/hive')
const datadog = require('../../datadog')

const run = async (argv, help) => {
  const id = argv._[0]

  if (!id) {
    help()
    process.exit(1)
  }

  return datadog.get_dashboard_list(id)
}

module.exports = new BasicCommand({
  name: 'list',
  options: '<dashboard list ID>',
  description: 'Get a dashboard list by ID',
  run
})
