// Returns the contents of a dashboard list
import fs from 'fs'
import datadog from './datadog.js'

export default async (list_id, export_path) => {
  try {
    fs.mkdirSync(export_path, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }

  const list = JSON.parse(await datadog.get_dashboard_list(list_id))
  const ids = list.dashboards.map(entry => entry.new_id)

  await Promise.all(
    ids.map(async id => {
      const dashboard = JSON.parse(await datadog.get_dashboard(id))
      fs.writeFileSync(
        `${export_path}/${dashboard.id}.json`,
        JSON.stringify(dashboard, null, 2)
      )
    })
  )
  return ids
}
