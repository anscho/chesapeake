// Returns the contents of a dashboard list
import { BasicCommand } from '@anscho/hive'
import datadog from '../../controllers/datadog.js'

export default new BasicCommand({
  name: 'list',
  options: '<dashboard list ID>',
  description: 'Get the dashboards in a dashboard list by ID',
  run: async (argv, help) => {
    const id = argv._[0]

    if (!id) {
      help()
      process.exit(1)
    }

    console.log(await datadog.get_dashboard_list(id))
  }
})
