// CLI for finding and updating Datadog monitors by tag
'use strict'
const _ = require('lodash')
const fs = require('fs')
const hive = require('@anscho/hive')

const cli_utils = require('../../cli-utils')
const datadog = require('../../datadog')

// Helper

const tag_query = datadog.make_query('tag')

// Find

const find_name = 'find'
const find_description = 'Find monitors by tag'

const find_help = () => {
  console.log(`Usage: ${find_name} <text>

  ${find_description}`)
}

const find_command = async argv => {
  if (hive.isHelp(argv)) {
    find_help()
    process.exit()
  }

  const tag = argv._[0]

  if (!tag) {
    find_help()
    process.exit(1)
  }

  try {
    const monitors = await datadog.search_monitors(tag_query(tag))
    const output = _.uniqBy(monitors.map(monitor => ({
      id: monitor.id,
      name: monitor.name
    })), monitor => monitor.id)
    console.log(JSON.stringify(output))
  } catch (err) {
    console.error(err.statusCode
      ? `${err.statusCode} ${err.message}`
      : err)
  }
}

// Add

const add_tag = tag => async monitor_id => {
  const monitor = JSON.parse(await datadog.get_monitor(monitor_id))
  const existing_tags = monitor.tags
  const new_exists = existing_tags.includes(tag)

  if (new_exists) {
    console.log(`${monitor_id} already has tag ${tag}`)
    return
  }

  const response = await datadog.put_monitor(monitor_id, {
    ...monitor,
    tags: [...existing_tags, tag]
  })

  const verification_response = JSON.parse(await datadog.get_monitor(monitor_id))

  if (!verification_response.tags.includes(tag)) {
    console.log(`${monitor_id} failed: ${tag} not added`)
    return
  }
  console.log(`${monitor_id} updated: ${tag} added`)
}

const add_name = 'add'
const add_description = 'Add a tag to a list of monitors'

const add_help = () => {
  console.log(`Usage: ${add_name} <tag> <monitor_ids>

  ${add_description}`)
}

const add_command = async argv => {
  if (hive.isHelp(argv)) {
    add_help()
    process.exit()
  }

  const tag = argv._[0]
  const monitor_ids = cli_utils.parse_comma_separated_list(argv._[1])

  if (!tag || !monitor_ids) {
    add_help()
    process.exit(1)
  }

  try {
    await Promise.all(monitor_ids.map(add_tag(tag)))
    console.log('Done!')
  } catch (err) {
    console.error(err.statusCode
      ? `${err.statusCode} ${err.message}`
      : err)
  }
}

// Remove

const remove_tag = tag => async monitor_id => {
  const monitor = JSON.parse(await datadog.get_monitor(monitor_id))
  const existing_tags = monitor.tags
  const new_exists = existing_tags.includes(tag)

  if (!new_exists) {
    console.log(`${monitor_id} doesn't have ${tag}`)
    return
  }

  const response = await datadog.put_monitor(monitor_id, {
    ...monitor,
    tags: existing_tags.filter(t => t !== tag)
  })

  const verification_response = JSON.parse(await datadog.get_monitor(monitor_id))

  if (verification_response.tags.includes(tag)) {
    console.log(`${monitor_id} failed: ${tag} not removed`)
    return
  }
  console.log(`${monitor_id} updated: ${tag} removed`)
}

const remove_name = 'remove'
const remove_description = 'Remove a tag from a list of monitors'

const remove_help = () => {
  console.log(`Usage: ${remove_name} <tag> <monitor_ids>

  ${remove_description}`)
}

const remove_command = async argv => {
  if (hive.isHelp(argv)) {
    remove_help()
    process.exit()
  }

  const tag = argv._[0]
  const monitor_ids = cli_utils.parse_comma_separated_list(argv._[1])

  if (!tag || !monitor_ids) {
    remove_help()
    process.exit(1)
  }

  try {
    await Promise.all(monitor_ids.map(remove_tag(tag)))
    console.log('Done!')
  } catch (err) {
    console.error(err.statusCode
      ? `${err.statusCode} ${err.message}`
      : err)
  }
}

// Export

const export_name = 'export'
const export_description = 'Finds all monitors associated with a tag and writes them to disk'

const export_help = () => {
  console.log(`Usage: ${export_name} <tag> <output_directory>

  ${export_description}`)
}

const export_command = async argv => {
  if (hive.isHelp(argv)) {
    export_help()
    process.exit()
  }

  const tag = argv._[0]
  const path = argv._[1]

  try {
    fs.mkdirSync(path, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(error)
    }
  }

  try {
    const all = await datadog.search_monitors(tag_query(tag))
    const ids = _.uniq(all.map(monitor => monitor.id))
    const missing = all.length - ids.length
    if (missing) {
      console.log(`Missing ${missing} ids`)
    }

    //
    await Promise.all(ids.map(async id => {
      const monitor = JSON.parse(await datadog.get_monitor(id))
      fs.writeFileSync(
        `${path}/${monitor.id}.json`,
        JSON.stringify(monitor, null, 2)
      )
    }))
    console.log(`Wrote ${ids.length} monitors to ${path}`)
  } catch (err) {
    console.error(err.statusCode
      ? `${err.statusCode} ${err.message}`
      : err)
  }
}

// CLI

module.exports = new hive.NestedCommand({
  name: 'tag',
  description: 'Find and update monitor tags.',
  commands: [
    {
      name: find_name,
      description: find_description,
      help: find_help,
      run: find_command
    },
    {
      name: add_name,
      description: add_description,
      help: add_help,
      run: add_command
    },
    {
      name: remove_name,
      description: remove_description,
      help: remove_help,
      run: remove_command
    },
    {
      name: export_name,
      description: export_description,
      help: export_help,
      run: export_command
    }
  ]
})
