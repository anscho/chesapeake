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
const dashboard = `${base}/dashboard`
const dashboard_list = `${base}/dashboard/lists/manual`
const monitor = `${base}/monitor`
const credentials = `application_key=${app_key}&api_key=${api_key}`

const make_query = field => text => encodeURIComponent(`${field}: "${text}"`)

// Dashboard

// https://docs.datadoghq.com/api/?lang=python#get-a-dashboard
const get_dashboard = async id => request(`${dashboard}/${id}?${credentials}`)

// https://docs.datadoghq.com/api/?lang=python#dashboard-lists
const get_dashboard_list = async id => request(`${dashboard_list}/${id}/dashboards?${credentials}`)

// Monitors

const get_monitor = async id => request(`${monitor}/${id}?${credentials}`)

const put_monitor = async (id, json) => {
  const url = `${monitor}/${id}?${credentials}`
  return request({
    url,
    method: 'PUT',
    json
  })
}

const search_monitors_page = async (query, page, per_page) => {
  const search_url = `${monitor}/search?${credentials}&query=${query}&page=${page}&per_page=${per_page}&sort=name,asc`
  const response = await request(search_url)
  return JSON.parse(response)
}

// Response may contain duplicates
const search_monitors = async query => {
  let page = 0
  const per_page = 100 // Max
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
  get_dashboard,
  get_dashboard_list,
  get_monitor,
  put_monitor,
  search_monitors
}
