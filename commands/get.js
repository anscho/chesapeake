// Simplest sub-command, to get a monitor from the API
'use strict'
const cli_utils = require('../cli-utils')
const datadog = require('../datadog')

// Functions

const get_monitor = async monitor_id => {
}

// CLI

const name = 'get'
const description = 'Retrieve a datadog monitor by ID.'

const help = () => {
  console.log(`Usage: ${name} MONITOR_ID

  ${description}
`)
}

const run = async (argv) => {
  if (cli_utils.is_help(argv)) {
    help()
    process.exit()
  }

  const monitor_id = argv._[0]

  if (!monitor_id) {
    help()
    process.exit(1)
  }

  try {
    console.log(await datadog.get_monitor(monitor_id))
  } catch (err) {
    console.error(err.statusCode || err)
  }
}

module.exports = {
  description,
  help,
  name,
  run
}
