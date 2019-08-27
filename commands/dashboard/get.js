// Get a dashboard from the API
const { BasicCommand } = require('@anscho/hive')
const datadog = require('../../datadog')

module.exports = new BasicCommand({
  name: 'get',
  options: '<dashboard ID>',
  description: 'Get a datadog dashboard by ID. The ID doesn\'t include the human-readable portion.',
  run: async (argv, help) => {
    const id = argv._[0]

    if (!id) {
      help()
      process.exit(1)
    }

    console.log(await datadog.get_dashboard(id))
  }
})
