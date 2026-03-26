import { runCommand } from '@oclif/test'
import { expect } from 'chai'


describe('exports:create', () => {
  it('runs NoC', async () => {
    const { stdout } = await runCommand<{ name: string }>(['exports:noc'])
    expect(stdout).to.contain('-= NoC =-')
  }).timeout(15000)
})
