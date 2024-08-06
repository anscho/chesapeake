// Simplest sub-command, to get a monitor from the API
import hive from '@anscho/hive'
import datadog from '../../datadog.js'

const { BasicCommand } = hive

export default new BasicCommand({
  name: 'get',
  options: '<monitor ID>',
  description: 'Retrieve a datadog monitor by ID.',
  run: async (argv, help) => {
    const id = argv._[0]

    if (!id) {
      help()
      process.exit(1)
    }

    console.log(await datadog.get_monitor(id))
  }
})
