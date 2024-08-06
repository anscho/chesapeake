import _ from 'lodash'
import fs from 'fs'
import datadog from './datadog.js'

// These fields create diff noise without offering value
const to_storage = monitor =>
  _.omit(monitor, ['modified', 'overall_state_modified', 'overall_state'])

export default async (tag, export_path) => {
  try {
    fs.mkdirSync(export_path, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }

  const all = await datadog.search_monitors(datadog.make_query('tag')(tag))
  const ids = _.uniq(all.map(monitor => monitor.id))
  const missing = all.length - ids.length
  if (missing) {
    console.error(`Missing ${missing} ids`)
  }

  await Promise.all(
    ids.map(async id => {
      const monitor = to_storage(JSON.parse(await datadog.get_monitor(id)))
      fs.writeFileSync(
        `${export_path}/${monitor.id}.json`,
        JSON.stringify(monitor, null, 2)
      )
    })
  )

  return ids
}
