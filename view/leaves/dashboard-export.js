// Returns the contents of a dashboard list
import hive from '@anscho/hive'
import exportDashboards from '../../controllers/export-dashboards.js'

const { BasicCommand, utilities } = hive
const { isVerbose } = utilities

export default new BasicCommand({
  name: 'export',
  options: '<dashboard list ID> <output directory>',
  description: 'Write the dashboards from a dashboard list to disk.',
  run: async (argv, help) => {
    const [list_id, export_path] = argv._

    if (!list_id || !export_path) {
      help()
      process.exit(1)
    }

    const ids = await exportDashboards(list_id, export_path)

    if (isVerbose(argv)) {
      console.log(`Wrote ${ids.length} dashboards to ${export_path}`)
    }
  }
})
