import { expect, test } from './fixtures'

test('extension should be loaded', async ({ extensionId }) => {
  // If we got an extensionId, the extension loaded successfully
  expect(extensionId).toBeTruthy()
  expect(extensionId).toMatch(/^[a-z]{32}$/) // Chrome extension IDs are 32 lowercase letters
})
