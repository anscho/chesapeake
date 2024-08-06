#!/usr/bin/env node

import hive from '@anscho/hive'
import dashboardCommands from './dashboard-commands.js'
import monitorCommands from './monitor-commands.js'

const { NestedCommand } = hive

// CLI

export default new NestedCommand({
  name: 'chesapeake',
  description: 'CLI for managing and automating Datadog configuration',
  commands: [dashboardCommands, monitorCommands]
})
