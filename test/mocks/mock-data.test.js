import fs from 'fs'

const mockMonitor = id => {
  const monitor = JSON.parse(fs.readFileSync('./test/mocks/monitor.json'))
  return {
    ...monitor,
    id
  }
}

export { mockMonitor }
