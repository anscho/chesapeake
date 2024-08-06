#!/usr/bin/env node

import minimist from 'minimist'
import command from './view/tree/base-command.js'

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

command.run(argv)
