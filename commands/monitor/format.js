// Transforms between the web and storage formats

import _ from 'lodash'

// These fields create diff noise without offering value
const to_storage = monitor =>
  _.omit(monitor, ['modified', 'overall_state_modified', 'overall_state'])

export default {
  to_storage
}
