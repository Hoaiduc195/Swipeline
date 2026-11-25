import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { collectMarkdownFiles, resolves } from './check-docs-links.mjs'

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

test('ignores untracked root Markdown files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'swipeline-docs-links-'))
  try {
    execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' })
    writeFileSync(join(dir, 'README.md'), '# Tracked\n')
    execFileSync('git', ['add', 'README.md'], { cwd: dir, stdio: 'ignore' })
    writeFileSync(join(dir, 'scratch-notes.md'), '[broken](./does-not-exist.md)\n')

    const files = collectMarkdownFiles(dir)
    assert.deepEqual(files, [join(dir, 'README.md')])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
