import { describe, it } from 'mocha'
import assert from 'node:assert'
import sinon from 'sinon'
import datadog from '../controllers/datadog.js'
import { mockMonitor } from './mocks/mock-data.test.js'
import baseCommand from '../view/tree/base-command.js'

const monitor = mockMonitor(124)
const buffer = new Array()

describe('integration', () => {
  let sandbox

  before(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(datadog, 'get_monitor').callsFake(id => {
      if (parseInt(id, 10) === monitor.id) {
        return JSON.stringify(monitor)
      } else {
        throw new Error('404 Not Found')
      }
    })
    sandbox.stub(console, 'log').callsFake((...args) => buffer.push(args))
  })

  after(() => {
    sandbox.restore()
  })

  it('should get a monitor', async () => {
    await baseCommand.run({ _: ['monitor', 'get', '124'] })
    assert(buffer.length)
    const obj = JSON.parse(buffer[0])
    assert.deepStrictEqual(obj, monitor)
  })

  it('should not get a monitor', async () => {
    try {
      await baseCommand.run({ _: ['monitor', 'get', '125'] })
      assert.fail('Should not succeed')
    } catch (error) {
      assert.strictEqual(error.message, '404 Not Found')
    }
  })
})
