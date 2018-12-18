'use strict'
const request = require('request-promise-native')
const fs = require('fs')
let commander = require('commander') // TODO: const?

// Env

const env_vars = ['DATADOG_API_KEY', 'DATADOG_APP_KEY']
const missing = env_vars.filter(env_var => {
  return !process.env[env_var]
})
if (missing && missing.length) {
  console.log(`Missing ${missing.join(', ')}`)
}

const {
  DATADOG_API_KEY: api_key,
  DATADOG_APP_KEY: app_key
} = process.env

// API
// https://docs.datadoghq.com/api/?lang=bash#monitors-search

const base = 'https://api.datadoghq.com/api/v1'
const monitor = `${base}/monitor`
const credentials = `application_key=${app_key}&api_key=${api_key}`

const get_monitor = async (id) => {
  const monitor_url = `${monitor}/${id}?${credentials}`
  return request(monitor_url)
}

const put_monitor = async (id, json) => {
  const url = `${monitor}/${id}?${credentials}`
  return request({
    url,
    method: 'PUT',
    json
  })
}

const search_monitors_page = async (query, page, per_page) => {
  const search_url = `${monitor}/search?${credentials}&query=${query}&page=${page}&per_page=${per_page}`
  const response = await request(search_url)
  return JSON.parse(response)
}

const query = text => encodeURIComponent(`message: "${text}"`)

// Response may contain duplicates
const search_monitors = async (query) => {
  let page = 0
  const per_page = 10
  let total_count = 0
  let monitors = []

  do {
    const response = await search_monitors_page(query, page, per_page)
    monitors = [...monitors, ...response.monitors]
    total_count = response.metadata.total_count
    page++
  } while (monitors.length < total_count)

  return monitors
}

// Execute

const update_monitor = async (id, text, replacement_text) => {
  let monitor = JSON.parse(await get_monitor(id))

  // If it already notifies the new channel, don't add a duplicate
  const new_exists = monitor.message.includes(replacement_text)
  monitor.message = monitor.message.replace(text,
    new_exists ? '' : replacement_text)

  const response = await put_monitor(id, monitor)

  const verification_response = JSON.parse(await get_monitor(id))
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

// Commander

const find_command = async text => {
  try {
    const monitors = await search_monitors(query(text))
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
      : (await search_monitors(query(text))).map(m => m.id)
    await Promise.all(ids.map(id => update_monitor(id, text, replacement_text)))
    console.log('Done!')
  } catch (err) {
    console.error(err.statusCode || err)
  }
}

commander
  .command('find <text>')
  .description('Find all monitors containing text')
  .action(find_command)

commander
  .command('replace <text> <replacement_text>')
  .description('Replace <text> with <replacement_text> in all monitors')
  .option('-m, --monitor-ids <ids>', 'Limit replacement to these monitors')
  .action(replace_command)

commander.on('--help', () => {
  console.log('Examples:');
  console.log(' • Slack channels are formed @slack-CHANNEL_NAME')
  console.log(' • OpsGenie teams are of the form @opsgenie-TEAM_NAME')
})

commander.parse(process.argv)
