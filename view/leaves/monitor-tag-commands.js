// CLI for finding and updating Datadog monitors by tag
import _ from 'lodash'
import fs from 'fs'
import hive from '@anscho/hive'
import cli_utils from '../cli-utils.js'
import datadog from '../../controllers/datadog.js'
import format from '../monitor-format.js'

const { BasicCommand, NestedCommand, utilities } = hive
const { isVerbose } = utilities

// Helper

const tag_query = datadog.make_query('tag')

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

    const monitors = await datadog.search_monitors(tag_query(tag))
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

  const response = await datadog.put_monitor(monitor_id, {
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

const download_command = new BasicCommand({
  name: 'download',
  options: '<tag> <output_directory>',
  description:
    'Finds all monitors associated with a tag and writes them to disk.',
  run: async argv => {
    const tag = argv._[0]
    const path = argv._[1]

    try {
      fs.mkdirSync(path, { recursive: true })
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(error)
      }
    }

    const all = await datadog.search_monitors(tag_query(tag))
    const ids = _.uniq(all.map(monitor => monitor.id))
    const missing = all.length - ids.length
    if (missing) {
      console.error(`Missing ${missing} ids`)
    }

    await Promise.all(
      ids.map(async id => {
        const monitor = format.to_storage(
          JSON.parse(await datadog.get_monitor(id))
        )
        fs.writeFileSync(
          `${path}/${monitor.id}.json`,
          JSON.stringify(monitor, null, 2)
        )
      })
    )
    if (isVerbose(argv)) {
      console.log(`Wrote ${ids.length} monitors to ${path}`)
    }
  }
})

// CLI

export default new NestedCommand({
  name: 'tag',
  description: 'Find and update monitor tags.',
  commands: [add_command, download_command, find_command, remove_command]
})
