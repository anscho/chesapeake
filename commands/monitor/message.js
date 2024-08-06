// CLI for searching and updating Datadog monitors by message
import _ from 'lodash'
import hive from '@anscho/hive'
import cli_utils from '../../cli-utils.js'
import datadog from '../../datadog.js'

const { BasicCommand, NestedCommand, utilities } = hive
const { isVerbose } = utilities

// Execute

const message_query = datadog.make_query('message')

const update_monitor = async (id, text, replacement_text) => {
  let monitor = JSON.parse(await datadog.get_monitor(id))

  monitor.message = monitor.message.replace(text, replacement_text)

  await datadog.put_monitor(id, monitor)

  const verification_response = JSON.parse(await datadog.get_monitor(id))
  if (!verification_response.message.includes(replacement_text)) {
    throw new Error(
      `Monitor ${id} should contain ${replacement_text} after update: ${verification_response.message}`
    )
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
    const output = _.uniqBy(
      monitors.map(monitor => ({
        id: monitor.id,
        name: monitor.name
      })),
      monitor => monitor.id
    )
    console.log(JSON.stringify(output))
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
    await Promise.all(
      ids.map(id =>
        update_monitor(id, text, replacement_text)
          .then(_ => {
            if (isVerbose(argv)) {
              console.log(`Replaced text on ${id}`)
            }
          })
          .catch(error => {
            if (isVerbose(argv)) {
              console.error(error)
            }
            throw error
          })
      )
    )
    if (isVerbose(argv)) {
      return 'Done!'
    }
  }
})

// CLI

export default new NestedCommand({
  name: 'message',
  description: 'Find and update monitor messages.',
  commands: [find_command, replace_command]
})
