/**
 * Checks internal links across docs/, root Markdown files, adapters/README.md,
 * and package READMEs, plus every sidebar/nav `link:` in the VitePress
 * config. External URLs and pure anchors are ignored. Exits 1 and lists every
 * broken target.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('..', import.meta.url).pathname
const DOCS = join(ROOT, 'docs')
const LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

function isFile(path) {
  return existsSync(path) && statSync(path).isFile()
}

function isDir(path) {
  return existsSync(path) && statSync(path).isDirectory()
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.vitepress') continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, files)
    else if (entry.endsWith('.md')) files.push(path)
  }
  return files
}

function trackedRootMarkdown(root) {
  const out = execFileSync('git', ['ls-files', '--', '*.md'], {
    cwd: root,
    encoding: 'utf8',
  })
  return out
    .split(/\r?\n/)
    .filter((entry) => entry && !entry.includes('/') && !entry.includes('\\'))
    .map((entry) => join(root, entry))
    .filter((full) => isFile(full))
}

export function collectMarkdownFiles(root = ROOT) {
  const docs = join(root, 'docs')
  const files = isDir(docs) ? [...walk(docs)] : []
  files.push(...trackedRootMarkdown(root))
  const adaptersReadme = join(root, 'adapters', 'README.md')
  if (isFile(adaptersReadme)) files.push(adaptersReadme)
  const packagesDir = join(root, 'packages')
  if (isDir(packagesDir)) {
    const pkgRootReadme = join(packagesDir, 'README.md')
    if (isFile(pkgRootReadme)) files.push(pkgRootReadme)
    for (const entry of readdirSync(packagesDir)) {
      const readme = join(packagesDir, entry, 'README.md')
      if (isFile(readme)) files.push(readme)
    }
  }
  return files
}

function targetsIn(markdown) {
  const targets = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (line.trim().startsWith('```')) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    for (const match of line.matchAll(LINK)) targets.push(match[1])
  }
  return targets
}

export function resolves(fromFile, target) {
  const clean = decodeURIComponent(target.split('#')[0].split('?')[0])
  if (!clean) return true
  const bases = clean.startsWith('/')
    ? [join(DOCS, clean), join(DOCS, 'public', clean)]
    : [resolve(dirname(fromFile), clean)]
  for (const base of bases) {
    if (isFile(base)) return true
    if (isFile(`${base}.md`)) return true
    if (isFile(join(base, 'index.md'))) return true
    if (isFile(join(base, 'README.md'))) return true
  }
  return false
}

function main() {
  const failures = []
  const checkedFiles = collectMarkdownFiles()
  for (const file of checkedFiles) {
    for (const target of targetsIn(readFileSync(file, 'utf8'))) {
      if (/^(https?:|mailto:|#)/.test(target)) continue
      if (!resolves(file, target)) failures.push(`${file.replace(ROOT, '')} -> ${target}`)
    }
  }

  const config = readFileSync(join(DOCS, '.vitepress/config.ts'), 'utf8')
  for (const match of config.matchAll(/link:\s*'([^']+)'/g)) {
    const link = match[1]
    if (!link.startsWith('/')) continue
    if (!resolves(join(DOCS, 'index.md'), link)) {
      failures.push(`docs/.vitepress/config.ts -> ${link}`)
    }
  }

  if (failures.length > 0) {
    console.error(`Broken internal docs links (${failures.length}):\n`)
    for (const failure of failures) console.error(`  ✗ ${failure}`)
    process.exit(1)
  }
  console.log(`Docs links OK (${checkedFiles.length} markdown files checked)`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
