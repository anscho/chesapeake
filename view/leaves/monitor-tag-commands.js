// CLI for finding and updating Datadog monitors by tag
import _ from 'lodash'
import hive from '@anscho/hive'
import cli_utils from '../cli-utils.js'
import datadog from '../../controllers/datadog.js'
import exportMonitors from '../../controllers/export-monitors.js'

const { BasicCommand, NestedCommand, utilities } = hive
const { isVerbose } = utilities

// Find

const find_command = new BasicCommand({
  name: 'find',
  options: '<text>',
  description: 'Find monitors by tag.',
  run: async (argv, help) => {
    const tag = argv._[0]

    if (!tag) {
      help()
      process.exit(1)
    }

    const monitors = await datadog.search_monitors(datadog.make_query('tag')(tag))
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

// Add

const add_tag = tag => async monitor_id => {
  const monitor = JSON.parse(await datadog.get_monitor(monitor_id))
  const existing_tags = monitor.tags
  const new_exists = existing_tags.includes(tag)

  if (new_exists) {
    // TODO: Only print when verbose
    console.log(`${monitor_id} already has tag ${tag}`)
    return
  }

  const response = await datadog.put_monitor(monitor_id, {
    ...monitor,
    tags: [...existing_tags, tag]
  })

  const verification_response = JSON.parse(
    await datadog.get_monitor(monitor_id)
  )

  if (!verification_response.tags.includes(tag)) {
    throw new Error(
      `Failed to add ${tag} to ${monitor_id}: ${JSON.stringify(
        verification_response.tags
      )}`
    )
  }
}

const add_command = new BasicCommand({
  name: 'add',
  options: '<tag> <monitor_ids>',
  description:
    'Add a tag to monitors specified as a list of comma-separated IDs.',
  run: async (argv, help) => {
    const tag = argv._[0]
    const monitor_ids = cli_utils.parse_comma_separated_list(argv._[1])

    if (!tag || !monitor_ids) {
      help()
      process.exit(1)
    }

    await Promise.all(
      monitor_ids.map(id =>
        add_tag(tag)(id)
          .then(_ => {
            if (isVerbose(argv)) {
              console.log(`Added tag ${tag} to ${id}`)
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
      console.log('Done!')
    }
  }
})

// Remove

const remove_tag = tag => async monitor_id => {
  const monitor = JSON.parse(await datadog.get_monitor(monitor_id))
  const existing_tags = monitor.tags
  const new_exists = existing_tags.includes(tag)

  if (!new_exists) {
    // TODO: Only show when verbose
    console.log(`${monitor_id} doesn't have ${tag}`)
    return
  }

  await datadog.put_monitor(monitor_id, {
    ...monitor,
    tags: existing_tags.filter(t => t !== tag)
  })

  const verification_response = JSON.parse(
    await datadog.get_monitor(monitor_id)
  )

  if (verification_response.tags.includes(tag)) {
    throw new Error(
      `Failed to remove ${tag} from ${monitor_id}: ${JSON.stringify(
        verification_response.tags
      )}`
    )
  }
}

const remove_command = new BasicCommand({
  name: 'remove',
  options: '<tag> <monitor_ids>',
  description:
    'Remove a tag from monitors specified as a list of comma-separated IDs.',
  run: async (argv, help) => {
    const tag = argv._[0]
    const monitor_ids = cli_utils.parse_comma_separated_list(argv._[1])

    if (!tag || !monitor_ids) {
      help()
      process.exit(1)
    }

    await Promise.all(
      monitor_ids.map(id =>
        remove_tag(tag)(id)
          .then(_ => {
            if (isVerbose(argv)) {
              console.log(`Removed tag ${tag} from ${id}`)
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
      console.log('Done!')
    }
  }
})

// Download

const export_command = new BasicCommand({
  name: 'export',
  options: '<tag> <output_directory>',
  description:
    'Finds all monitors associated with a tag and writes them to disk.',
  run: async argv => {
    const [tag, export_path] = argv._

    const ids = await exportMonitors(tag, export_path)

    if (isVerbose(argv)) {
      console.log(`Wrote ${ids.length} monitors to ${export_path}`)
    }
  }
})

// CLI

export default new NestedCommand({
  name: 'tag',
  description: 'Find and update monitor tags.',
  commands: [add_command, export_command, find_command, remove_command]
})
