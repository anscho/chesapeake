import hive from '@anscho/hive'
import getMonitor from '../leaves/monitor-get.js'
import findMessageInMonitors from '../leaves/monitor-message.js'
import findTagInMonitors from '../leaves/monitor-tag-commands.js'

const { NestedCommand } = hive

export default new NestedCommand({
  name: 'monitor',
  description: 'Command for managing monitors',
  commands: [getMonitor, findMessageInMonitors, findTagInMonitors]
})
