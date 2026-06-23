import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(packageRoot, '..', '..')
const cli = path.join(packageRoot, 'src', 'cli.ts')

function run(args: string[]): string {
  return execFileSync(process.execPath, ['--import', 'tsx', cli, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

test('validates the dou-di-zhu example package', () => {
  const stdout = run(['validate', '--game', 'dou-di-zhu', '--json'])
  const report = JSON.parse(stdout) as { status: string; rule_count: number; errors: string[] }
  assert.equal(report.status, 'pass')
  assert.equal(report.errors.length, 0)
  assert.ok(report.rule_count >= 8)
})

test('generates a traceability report', () => {
  const stdout = run(['trace', '--game', 'dou-di-zhu', '--json'])
  const report = JSON.parse(stdout) as { metrics: { source_or_decision_covered: number; test_covered: number }; rule_count: number }
  assert.equal(report.metrics.source_or_decision_covered, report.rule_count)
  assert.equal(report.metrics.test_covered, report.rule_count)
})

test('writes a human review pack', () => {
  const stdout = run(['review-pack', '--game', 'dou-di-zhu'])
  assert.match(stdout, /review-pack\.md/)
})
