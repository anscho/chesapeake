'use strict'
const minimist = require('minimist')
const cli_utils = require('./cli-utils')
const datadog = require('./datadog')
const get_command = require('./commands/get.js')
const message_command = require('./commands/message.js')
const tag_command = require('./commands/tag.js')

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

const command = new cli_utils.NestedCommand({
  name: 'chesapeake',
  description: 'Automates finding and updating monitors',
  commands: [
    get_command,
    message_command,
    tag_command
  ]
})

command.run(argv)
