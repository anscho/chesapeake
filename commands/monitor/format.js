// Transforms between the web and storage formats

const _ = require('lodash')

// These fields create diff noise without offering value
const to_storage = monitor =>
  _.omit(monitor, ['modified', 'overall_state_modified', 'overall_state'])

module.exports = {
  to_storage
}
