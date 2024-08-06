#!/usr/bin/env node

import minimist from 'minimist'
import hive from '@anscho/hive'
import exportDashboard from './commands/dashboard/export.js'
import getDashboard from './commands/dashboard/get.js'
import listDashboards from './commands/dashboard/list.js'
import getMonitor from './commands/monitor/get.js'
import findMessageInMonitors from './commands/monitor/message.js'
import findTagInMonitors from './commands/monitor/tag.js'

const { NestedCommand } = hive

// Env

const env_vars = ['DATADOG_API_KEY', 'DATADOG_APP_KEY']
const missing = env_vars.filter(env_var => {
  return !process.env[env_var]
})
if (missing && missing.length) {
  console.log(`Missing environment variables ${missing.join(', ')}`)
}

// CLI

const argv = minimist(process.argv.slice(2))

const command = new NestedCommand({
  name: 'chesapeake',
  description: 'CLI for managing and automating Datadog configuration',
  commands: [
    new NestedCommand({
      name: 'dashboard',
      description: 'Command for managing dashboards and dashboard lists',
      commands: [exportDashboard, getDashboard, listDashboards]
    }),
    new NestedCommand({
      name: 'monitor',
      description: 'Command for managing monitors',
      commands: [getMonitor, findMessageInMonitors, findTagInMonitors]
    })
  ]
})

command.run(argv)
