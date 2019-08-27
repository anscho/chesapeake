// CLI for searching and updating Datadog monitors by message
'use strict'
const {
  BasicCommand,
  NestedCommand
} = require('@anscho/hive')

const cli_utils = require('../../cli-utils')
const datadog = require('../../datadog')

// Execute

const message_query = datadog.make_query('message')

const update_monitor = async (id, text, replacement_text) => {
  let monitor = JSON.parse(await datadog.get_monitor(id))

  monitor.message = monitor.message.replace(text, replacement_text)

  await datadog.put_monitor(id, monitor)

  const verification_response = JSON.parse(await datadog.get_monitor(id))
  const success = verification_response.message.includes(replacement_text)

  if (success) {
    console.log(`Updated ${id}: ${text} -> ${replacement_text}`)
  } else {
    console.log(`Failure on ${id}: ${verification_response.message}`)
  }
}

// Find

const find_command = new BasicCommand({
  name: 'find',
  options: '<text>',
  description: 'Find monitors by message text.',
  run: async (argv, help) => {
    const text = argv._[0]

    if (!text) {
      help()
      process.exit(1)
    }

    const monitors = await datadog.search_monitors(message_query(text))
    const output = monitors.map(monitor => ({
      id: monitor.id,
      name: monitor.name
    })).filter((monitor, index, self) => {
      return self.findIndex(x => x.id === monitor.id) === index
    })
    return JSON.stringify(output)
  }
})

// Replace

const replace_command = new BasicCommand({
  name: 'replace',
  options: '<text> <replacement_text> [-m --monitors]',
  description: `Replace <text> with <replacement_text> in all monitor messages

Options:
  monitors: Search and replace only within this set of monitors, provided as a comma-separated list of IDs.
`,
  run: async (argv, help) => {
    const monitor_ids = argv.monitors || argv.m
    const text = argv._[0]
    const replacement_text = argv._[1]

    if (!text || !replacement_text) {
      help()
      process.exit(1)
    }

    const ids = monitor_ids
      ? cli_utils.parse_comma_separated_list(monitor_ids)
      : (await datadog.search_monitors(message_query(text))).map(m => m.id)
    await Promise.all(ids.map(id => update_monitor(id, text, replacement_text)))
    return 'Done!'
  }
})


// CLI

module.exports = new NestedCommand({
  name: 'message',
  description: 'Find and update monitor messages.',
  commands: [
    find_command,
    replace_command
  ]
})