import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import { resolves } from './check-docs-links.mjs'

const ROOT = new URL('..', import.meta.url).pathname

test('resolves directory link to ../packages/ via README.md', () => {
  assert.equal(resolves(join(ROOT, 'adapters', 'README.md'), '../packages/'), true)
})

test('rejects broken relative link from CONTRIBUTING.md', () => {
  assert.equal(
    resolves(join(ROOT, 'CONTRIBUTING.md'), '../docs/adr/0014-biome-lint-format.md'),
    false,
  )
})

test('resolves site-absolute link against docs/', () => {
  assert.equal(resolves(join(ROOT, 'README.md'), '/roadmap'), true)
})
