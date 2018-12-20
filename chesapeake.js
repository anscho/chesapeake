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

// Tag

const tag_query = datadog.make_query('tag')

const find_command = async text => {
  try {
    const monitors = await datadog.search_monitors(tag_query(text))
    const output = monitors.map(monitor => ({
      id: monitor.id,
      name: monitor.name
    })).filter((monitor, index, self) => {
      return self.findIndex(x => x.id === monitor.id) === index
    })
    console.log(JSON.stringify(output, null, 2))
  } catch (err) {
    console.error(err.statusCode || err)
  }
}

const replace_command = async (text, replacement_text, command) => {
  const {
    monitorIds: monitor_ids
  } = command

  try {
    const ids = monitor_ids
      ? monitor_ids.split(',')
      : (await datadog.search_monitors(tag_query(text))).map(m => m.id)
    await Promise.all(ids.map(id => update_monitor(id, text, replacement_text)))
    console.log('Done!')
  } catch (err) {
    console.error(err.statusCode || err)
  }
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
