import hive from '@anscho/hive'
import exportDashboard from '../leaves/dashboard-export.js'
import getDashboard from '../leaves/dashboard-get.js'
import listDashboards from '../leaves/dashboard-list.js'

const { NestedCommand } = hive

export default new NestedCommand({
  name: 'dashboard',
  description: 'Command for managing dashboards and dashboard lists',
  commands: [exportDashboard, getDashboard, listDashboards]
})
