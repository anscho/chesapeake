#!/usr/bin/env node

'use strict'
const minimist = require('minimist')
const { NestedCommand } = require('@anscho/hive')

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
      name: 'monitor',
      description: 'Command for managing monitors',
      commands: [
        require('./commands/monitor/get'),
        require('./commands/monitor/message'),
        require('./commands/monitor/tag')
      ]
    }),
    new NestedCommand({
      name: 'dashboard',
      description: 'Command for managing dashboards and dashboard lists',
      commands: [
        require('./commands/dashboard/get'),
        require('./commands/dashboard/list')
      ]
    })
  ]
})

command.run(argv)
