'use strict'
// API wrapper for Datadog

const request = require('request-promise-native')

const {
  DATADOG_API_KEY: api_key,
  DATADOG_APP_KEY: app_key
} = process.env

// API
// https://docs.datadoghq.com/api/?lang=bash#monitors-search

const base = 'https://api.datadoghq.com/api/v1'
const monitor = `${base}/monitor`
const credentials = `application_key=${app_key}&api_key=${api_key}`

const make_query = field => text => encodeURIComponent(`${field}: "${text}"`)

// Calls

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

module.exports = {
  make_query,
  get_monitor,
  put_monitor,
  search_monitors
}