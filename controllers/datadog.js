// API wrapper for Datadog

import got from 'got'

const { DATADOG_API_KEY: api_key, DATADOG_APP_KEY: app_key } = process.env

// API
// https://docs.datadoghq.com/api/?lang=bash#monitors-search

const base = 'https://api.datadoghq.com/api/v1'
const dashboard = `${base}/dashboard`
const dashboard_list = `${base}/dashboard/lists/manual`
const monitor = `${base}/monitor`

const dd_request = async options => {
  if (typeof options === 'string') {
    options = { url: options }
  }
  options = {
    ...options,
    headers: {
      'DD-API-KEY': api_key,
      'DD-APPLICATION-KEY': app_key,
      Accept: 'application/json'
    }
  }
  return (await got(options)).body
}

const make_query = field => text => encodeURIComponent(`${field}: "${text}"`)

// Dashboard

// https://docs.datadoghq.com/api/?lang=python#get-a-dashboard
const get_dashboard = async id => dd_request(`${dashboard}/${id}`)

// https://docs.datadoghq.com/api/?lang=python#dashboard-lists
const get_dashboard_list = async id =>
  dd_request(`${dashboard_list}/${id}/dashboards`)

// Monitors

const get_monitor = async id => dd_request(`${monitor}/${id}`)

const put_monitor = async (id, json) => {
  return dd_request({
    url: `${monitor}/${id}`,
    method: 'PUT',
    json
  })
}

const search_monitors_page = async (query, page, per_page) => {
  const response = await dd_request(
    `${monitor}/search?&query=${query}&page=${page}&per_page=${per_page}&sort=name,asc`
  )
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

export default {
  make_query,
  get_dashboard,
  get_dashboard_list,
  get_monitor,
  put_monitor,
  search_monitors
}
