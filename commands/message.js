// CLI for searching and updating Datadog monitors by message
'use strict'
const cli_utils = require('../cli-utils')
const datadog = require('../datadog')

// Execute

const message_query = datadog.make_query('message')

const update_monitor = async (id, text, replacement_text) => {
  let monitor = JSON.parse(await datadog.get_monitor(id))

  // If it already notifies the new channel, don't add a duplicate
  const new_exists = monitor.message.includes(replacement_text)
  monitor.message = monitor.message.replace(text,
    new_exists ? '' : replacement_text)

  const response = await datadog.put_monitor(id, monitor)

  const verification_response = JSON.parse(await datadog.get_monitor(id))
  const success = verification_response.message.includes(replacement_text)

  if (success) {
    const message = new_exists
      ? `removed ${text}, ${replacement_text} exists`
      : `${text} -> ${replacement_text}`
    console.log(`Updated ${id}: ${message}`)
  } else {
    console.log(`Failure on ${id}: ${verification_response.message}`)
  }
}

// Find

const find_name = 'find'
const find_description = 'Find monitors by message text'

const find_help = () => {
  console.log(`Usage: ${find_name} <text>

  ${find_description}`)
}

const find_command = async argv => {
  if (cli_utils.is_help(argv)) {
    find_help()
    process.exit()
  }

  const text = argv._[0]

  if (!text) {
    find_help()
    process.exit(1)
  }

  try {
    const monitors = await datadog.search_monitors(message_query(text))
    const output = monitors.map(monitor => ({
      id: monitor.id,
      name: monitor.name
    })).filter((monitor, index, self) => {
      return self.findIndex(x => x.id === monitor.id) === index
    })
    console.log(JSON.stringify(output))
  } catch (err) {
    console.error(err.statusCode || err)
  }
}

// Replace

const replace_name = 'replace'
const replace_description = 'Replace <text> with <replacement_text> in all monitor messages'

const replace_help = () => {
  console.log(`Usage: ${replace_name} <text> <replacement_text>

  ${replace_description}

Options:
  --monitor-ids <ids>  Limit replacement to these monitors`)
}

const replace_command = async argv => {
  if (cli_utils.is_help(argv)) {
    replace_help()
    process.exit()
  }

  const monitor_ids = argv['monitor-ids']
  const text = argv._[0]
  const replacement_text = argv._[1]

  if (!text || !replacement_text) {
    replace_help()
    process.exit(1)
  }

  try {
    const ids = monitor_ids
      ? cli_utils.parse_comma_separated_list(monitor_ids)
      : (await datadog.search_monitors(message_query(text))).map(m => m.id)
    await Promise.all(ids.map(id => update_monitor(id, text, replacement_text)))
    console.log('Done!')
  } catch (err) {
    console.error(err.statusCode || err)
  }
}

// CLI

module.exports = new cli_utils.NestedCommand({
  name: 'message',
  description: 'Find and update monitor messages.',
  commands: [
    {
      name: find_name,
      description: find_description,
      help: find_help,
      run: find_command
    },
    {
      name: replace_name,
      description: replace_description,
      help: replace_help,
      run: replace_command
    }
  ]
})
