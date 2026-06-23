#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as AjvModule from 'ajv/dist/2020.js'
import YAML from 'yaml'

type Command = 'validate' | 'trace' | 'review-pack'
type Status = 'pass' | 'fail' | 'warning'

interface Options {
  command: Command
  game: string
  root: string
  outRoot: string
  json: boolean
}

interface RuleEntry {
  rule_id: string
  domain?: string
  summary?: string
  severity?: string
  certainty?: string
  source_refs?: string[]
  source_quote?: string
  decision_ref?: string
  implementation_refs?: string[]
  test_refs?: string[]
}

interface ValidationReport {
  schema_version: 1
  generated_at: string
  game_id: string
  status: Status
  package_root: string
  checked_files: Record<string, boolean>
  rule_count: number
  example_count: number
  source_count: number
  decision_count: number
  errors: string[]
  warnings: string[]
  artifacts: string[]
}

interface TraceRule {
  rule_id: string
  summary: string
  source_or_decision_refs: string[]
  implementation_refs: string[]
  test_refs: string[]
  warnings: string[]
}

interface TraceReport {
  schema_version: 1
  generated_at: string
  game_id: string
  rule_count: number
  metrics: {
    source_or_decision_covered: number
    implementation_covered: number
    test_covered: number
  }
  rules: TraceRule[]
  warnings: string[]
}

type AjvError = { instancePath?: string; message?: string }
type AjvValidateFn = ((data: unknown) => boolean) & { errors?: AjvError[] | null }
type AjvInstance = { compile(schema: unknown): AjvValidateFn }
type AjvConstructor = new (options: Record<string, unknown>) => AjvInstance

const REQUIRED_FILES = [
  'quality/manifest.yaml',
  'quality/sources.yaml',
  'quality/ruleset.yaml',
  'quality/examples.json',
  'quality/ambiguities.yaml',
  'quality/review.yaml',
  'rules.yaml',
] as const

function usage(): string {
  return `Usage:
  rule-trust validate --game <id>
  rule-trust trace --game <id>
  rule-trust review-pack --game <id>

Options:
  --game <id>       Rule package id, for example dou-di-zhu
  --root <path>     Repository root, default current working directory
  --out-root <path> Artifact root, default artifacts
  --json            Print JSON report to stdout`
}

function parseArgs(argv: string[]): Options {
  const command = argv[0]
  if (command !== 'validate' && command !== 'trace' && command !== 'review-pack') {
    console.error(usage())
    process.exit(2)
  }

  const defaultRoot = findRepoRoot(process.cwd())
  const options: Options = {
    command,
    game: '',
    root: defaultRoot,
    outRoot: path.join(defaultRoot, 'artifacts'),
    json: false,
  }
  let outRootProvided = false

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]
    switch (arg) {
      case '--game':
        options.game = String(next ?? '')
        index += 1
        break
      case '--root':
        options.root = path.resolve(String(next ?? ''))
        if (!outRootProvided) options.outRoot = path.join(options.root, 'artifacts')
        index += 1
        break
      case '--out-root':
        options.outRoot = path.resolve(String(next ?? ''))
        outRootProvided = true
        index += 1
        break
      case '--json':
        options.json = true
        break
      case '--help':
      case '-h':
        console.log(usage())
        process.exit(0)
      default:
        throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (!options.game) {
    console.error(usage())
    process.exit(2)
  }

  return options
}

function findRepoRoot(start: string): string {
  let current = path.resolve(start)
  for (;;) {
    if (fs.existsSync(path.join(current, 'schemas')) && fs.existsSync(path.join(current, 'examples'))) {
      return current
    }
    const parent = path.dirname(current)
    if (parent === current) return path.resolve(start)
    current = parent
  }
}

function packageRoot(root: string, game: string): string {
  const examplePath = path.join(root, 'examples', game)
  if (fs.existsSync(examplePath)) return examplePath
  return path.join(root, game)
}

function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8')
}

function readYaml(filePath: string): unknown {
  return YAML.parse(readText(filePath))
}

function readJson(filePath: string): unknown {
  return JSON.parse(readText(filePath)) as unknown
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

function writeJson(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(filePath: string, value: string): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8')
}

function relative(root: string, filePath: string): string {
  return path.relative(root, filePath).replace(/\\/g, '/')
}

function loadPackage(options: Options) {
  const pkgRoot = packageRoot(options.root, options.game)
  const readPackageYaml = (name: string) => readYaml(path.join(pkgRoot, name))
  const readPackageJson = (name: string) => readJson(path.join(pkgRoot, name))

  const manifest = asRecord(readPackageYaml('quality/manifest.yaml'))
  const sources = asRecord(readPackageYaml('quality/sources.yaml'))
  const ruleset = asRecord(readPackageYaml('quality/ruleset.yaml'))
  const examples = asRecord(readPackageJson('quality/examples.json'))
  const ambiguities = asRecord(readPackageYaml('quality/ambiguities.yaml'))
  const review = asRecord(readPackageYaml('quality/review.yaml'))
  const rulesDoc = asRecord(readPackageYaml('rules.yaml'))
  const rules = asArray(rulesDoc.rules) as RuleEntry[]

  return { pkgRoot, manifest, sources, ruleset, examples, ambiguities, review, rulesDoc, rules }
}

function sourceIdFromRef(ref: string): string {
  const match = ref.match(/^(SRC-\d{3}|DEC-[A-Z0-9-]+)/)
  return match ? match[1] : ref
}

function validate(options: Options): ValidationReport {
  const pkgRoot = packageRoot(options.root, options.game)
  const checkedFiles = Object.fromEntries(REQUIRED_FILES.map((name) => [name, fs.existsSync(path.join(pkgRoot, name))]))
  const errors: string[] = []
  const warnings: string[] = []
  const artifacts: string[] = []

  for (const [file, exists] of Object.entries(checkedFiles)) {
    if (!exists) errors.push(`Missing required file: ${file}`)
  }

  if (errors.length > 0) {
    return {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      game_id: options.game,
      status: 'fail',
      package_root: relative(options.root, pkgRoot),
      checked_files: checkedFiles,
      rule_count: 0,
      example_count: 0,
      source_count: 0,
      decision_count: 0,
      errors,
      warnings,
      artifacts,
    }
  }

  const data = loadPackage(options)
  const schemaPath = path.join(options.root, 'schemas', 'rule-package.schema.json')
  const schema = readJson(schemaPath)
  const Ajv = (AjvModule as unknown as { default: AjvConstructor }).default
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false })
  const validateManifest = ajv.compile(schema)
  if (!validateManifest(data.manifest)) {
    for (const err of validateManifest.errors ?? []) {
      errors.push(`manifest schema: ${err.instancePath || '/'} ${err.message ?? 'is invalid'}`)
    }
  }

  if (String(data.manifest.gameId) !== options.game) {
    errors.push(`manifest gameId ${String(data.manifest.gameId)} does not match --game ${options.game}`)
  }

  const sourceRecords = asArray(data.sources.sources).map(asRecord)
  const decisionRecords = asArray(data.sources.decisions).map(asRecord)
  const sourceIds = new Set(sourceRecords.map((record) => String(record.id)))
  const decisionIds = new Set(decisionRecords.map((record) => String(record.id)))

  for (const sourceId of asStringArray(data.manifest.sourceIds)) {
    if (!sourceIds.has(sourceId)) errors.push(`manifest sourceIds references unknown source: ${sourceId}`)
  }

  const ruleIds = new Set<string>()
  for (const rule of data.rules) {
    if (!rule.rule_id) {
      errors.push('rules.yaml contains a rule without rule_id')
      continue
    }
    if (ruleIds.has(rule.rule_id)) errors.push(`duplicate rule_id: ${rule.rule_id}`)
    ruleIds.add(rule.rule_id)

    if (!rule.summary) warnings.push(`${rule.rule_id}: missing summary`)
    if (!rule.severity) warnings.push(`${rule.rule_id}: missing severity`)

    const sourceRefs = asStringArray(rule.source_refs)
    const hasSource = sourceRefs.length > 0
    const hasDecision = Boolean(rule.decision_ref)
    if (!hasSource && !hasDecision) {
      errors.push(`${rule.rule_id}: missing source_refs or decision_ref`)
    }
    for (const ref of sourceRefs) {
      const id = sourceIdFromRef(ref)
      if (!sourceIds.has(id)) errors.push(`${rule.rule_id}: source_ref ${ref} does not resolve`)
    }
    if (rule.certainty === 'museum-decision' && !rule.decision_ref) {
      errors.push(`${rule.rule_id}: museum-decision rule must include decision_ref`)
    }
    if (rule.decision_ref && !decisionIds.has(rule.decision_ref)) {
      errors.push(`${rule.rule_id}: decision_ref ${rule.decision_ref} does not resolve`)
    }

    for (const ref of [...asStringArray(rule.implementation_refs), ...asStringArray(rule.test_refs)]) {
      const target = path.resolve(data.pkgRoot, ref)
      if (!fs.existsSync(target)) errors.push(`${rule.rule_id}: referenced file missing: ${ref}`)
    }
  }

  const cases = asArray(data.examples.cases).map(asRecord)
  for (const item of cases) {
    const caseId = String(item.id ?? '<missing id>')
    for (const ruleId of asStringArray(item.ruleIds)) {
      if (!ruleIds.has(ruleId)) errors.push(`${caseId}: references unknown rule_id ${ruleId}`)
    }
    const testRef = item.testRef
    if (typeof testRef === 'string') {
      const target = path.resolve(data.pkgRoot, testRef)
      if (!fs.existsSync(target)) errors.push(`${caseId}: testRef missing: ${testRef}`)
    } else {
      warnings.push(`${caseId}: missing testRef`)
    }
  }

  const report: ValidationReport = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    game_id: options.game,
    status: errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warning' : 'pass',
    package_root: relative(options.root, data.pkgRoot),
    checked_files: checkedFiles,
    rule_count: data.rules.length,
    example_count: cases.length,
    source_count: sourceRecords.length,
    decision_count: decisionRecords.length,
    errors,
    warnings,
    artifacts,
  }

  const outPath = path.join(options.outRoot, 'rules', options.game, 'validation.json')
  writeJson(outPath, report)
  report.artifacts.push(relative(options.root, outPath))
  writeJson(outPath, report)
  return report
}

function trace(options: Options): TraceReport {
  const validation = validate(options)
  const data = loadPackage(options)
  const rules: TraceRule[] = data.rules.map((rule) => {
    const sourceRefs = asStringArray(rule.source_refs)
    const decisionRefs = rule.decision_ref ? [rule.decision_ref] : []
    const implementationRefs = asStringArray(rule.implementation_refs)
    const testRefs = asStringArray(rule.test_refs)
    const warnings: string[] = []
    if (sourceRefs.length + decisionRefs.length === 0) warnings.push('missing source or decision reference')
    if (implementationRefs.length === 0) warnings.push('missing implementation reference')
    if (testRefs.length === 0) warnings.push('missing test reference')
    return {
      rule_id: rule.rule_id,
      summary: rule.summary ?? '',
      source_or_decision_refs: [...sourceRefs, ...decisionRefs],
      implementation_refs: implementationRefs,
      test_refs: testRefs,
      warnings,
    }
  })

  const report: TraceReport = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    game_id: options.game,
    rule_count: rules.length,
    metrics: {
      source_or_decision_covered: rules.filter((rule) => rule.source_or_decision_refs.length > 0).length,
      implementation_covered: rules.filter((rule) => rule.implementation_refs.length > 0).length,
      test_covered: rules.filter((rule) => rule.test_refs.length > 0).length,
    },
    rules,
    warnings: [...validation.warnings, ...rules.flatMap((rule) => rule.warnings.map((warning) => `${rule.rule_id}: ${warning}`))],
  }

  const outPath = path.join(options.outRoot, 'rules', options.game, 'trace.json')
  writeJson(outPath, report)
  return report
}

function renderReviewPack(options: Options): { path: string; content: string; validation: ValidationReport; traceReport: TraceReport } {
  const validation = validate(options)
  const traceReport = trace(options)
  const data = loadPackage(options)
  const version = String(data.manifest.rulesetVersion ?? '0.0.0')
  const outPath = path.join(options.outRoot, 'review', options.game, version, 'review-pack.md')
  const sourceRecords = asArray(data.sources.sources).map(asRecord)
  const decisionRecords = asArray(data.sources.decisions).map(asRecord)
  const ambiguityItems = asArray(data.ambiguities.items).map(asRecord)

  const lines: string[] = [
    `# ${String(data.manifest.displayName ?? options.game)} Review Pack`,
    '',
    `- Game ID: \`${options.game}\``,
    `- Ruleset: \`${String(data.manifest.rulesetId ?? '')}@${version}\``,
    `- Package status: \`${String(data.manifest.status ?? '')}\``,
    `- Generated at: ${new Date().toISOString()}`,
    `- Validation status: \`${validation.status}\``,
    '',
    '## Source Records',
    '',
  ]

  for (const source of sourceRecords) {
    lines.push(`- \`${String(source.id)}\` ${String(source.title ?? '')} (${String(source.type ?? 'source')})`)
  }
  for (const decision of decisionRecords) {
    lines.push(`- \`${String(decision.id)}\` ${String(decision.title ?? '')} (maintainer decision)`)
  }

  lines.push('', '## Rules To Review', '')
  lines.push('| Rule ID | Summary | Source or Decision | Tests |')
  lines.push('| --- | --- | --- | --- |')
  for (const rule of traceReport.rules) {
    lines.push(`| \`${rule.rule_id}\` | ${rule.summary} | ${rule.source_or_decision_refs.join(', ')} | ${rule.test_refs.join(', ')} |`)
  }

  lines.push('', '## Open Ambiguities', '')
  if (ambiguityItems.length === 0) {
    lines.push('No open ambiguities recorded.')
  } else {
    for (const item of ambiguityItems) {
      lines.push(`- \`${String(item.id)}\` ${String(item.question ?? '')} — status: \`${String(item.status ?? 'unknown')}\``)
    }
  }

  lines.push('', '## Reviewer Checklist', '')
  lines.push('- [ ] Source records support the rule summaries.')
  lines.push('- [ ] Maintainer decisions are clearly marked and not presented as traditional rule facts.')
  lines.push('- [ ] Examples cover legal, illegal, edge, and terminal behavior where applicable.')
  lines.push('- [ ] Remaining ambiguity is acceptable for the package status.')
  lines.push('- [ ] No private product data or unrelated assets are included.')

  if (validation.errors.length > 0) {
    lines.push('', '## Blocking Validation Errors', '')
    for (const error of validation.errors) lines.push(`- ${error}`)
  }

  const content = lines.join('\n')
  writeText(outPath, content)
  return { path: outPath, content, validation, traceReport }
}

function printResult(options: Options, value: unknown, status: Status): void {
  if (options.json) {
    console.log(JSON.stringify(value, null, 2))
    return
  }
  if (options.command === 'validate') {
    const report = value as ValidationReport
    console.log(`${report.status}: ${report.game_id} (${report.rule_count} rules, ${report.example_count} examples)`)
    for (const error of report.errors) console.error(`error: ${error}`)
    for (const warning of report.warnings) console.warn(`warning: ${warning}`)
    for (const artifact of report.artifacts) console.log(`artifact: ${artifact}`)
    return
  }
  if (options.command === 'trace') {
    const report = value as TraceReport
    console.log(`${status}: ${report.game_id} trace (${report.rule_count} rules)`)
    console.log(`source/decision covered: ${report.metrics.source_or_decision_covered}/${report.rule_count}`)
    console.log(`implementation covered: ${report.metrics.implementation_covered}/${report.rule_count}`)
    console.log(`test covered: ${report.metrics.test_covered}/${report.rule_count}`)
    return
  }
  const pack = value as ReturnType<typeof renderReviewPack>
  console.log(`${pack.validation.status}: review pack written to ${relative(options.root, pack.path)}`)
}

export function main(argv = process.argv.slice(2)): number {
  const options = parseArgs(argv)
  if (options.command === 'validate') {
    const report = validate(options)
    printResult(options, report, report.status)
    return report.status === 'fail' ? 1 : 0
  }
  if (options.command === 'trace') {
    const report = trace(options)
    printResult(options, report, report.warnings.length > 0 ? 'warning' : 'pass')
    return 0
  }
  const pack = renderReviewPack(options)
  printResult(options, pack, pack.validation.status)
  return pack.validation.status === 'fail' ? 1 : 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
