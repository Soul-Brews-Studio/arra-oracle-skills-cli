// ===== oracle-booklet drafting Workflow — fill the 5 CONSTS below, then run via the Workflow tool =====
// 6 parallel Sonnet writers: one owns hook+close (single voice), 5 write one section each → files.
export const meta = {
  name: 'booklet-draft',
  description: 'Draft a proof-dense Thai booklet — 6 parallel Sonnet writers per section',
  phases: [{ title: 'Draft', detail: 'hook+close + 5 sections, compact proof-dense' }],
}

// ---- FILL THESE FIVE ----
const BOOK = '<ABSOLUTE path to ψ/writing/mini-books/<slug>>'  // = $DIR from Step 1
const TITLE = '<TITLE>'
const ORACLE_NAME = '<ORACLE_NAME>'                            // e.g. transcriber
const FACTS = `
<PASTE the real ground-truth: what happened, the commits, the file paths, the exact log lines,
errors, and numbers. Tell the writers to use ONLY these — never invent.>
`
// REQUIRED: exactly one 🔧 deep section + exactly one honest-failure section among these.
const SECTIONS = [
  { f: '01-<section-name>.md', h: '## §1 — <title>', brief: '<goal + which proof to cite>' },
  { f: '02-<section-name>.md', h: '## §2 — <title>', brief: '<...>' },
  { f: '03-<section-name>.md', h: '## §3 🔧 — <DEEP title>', brief: '<the real mechanics + subheadings>' },
  { f: '04-<section-name>.md', h: '## §4 — <title>', brief: '<...>' },
  { f: '05-<section-name>.md', h: '## §5 — <HONEST-FAILURE title>', brief: '<a real mistake you made + the lesson>',
    contract: 'HONEST-FAILURE CONTRACT — this section MUST: (1) name one specific thing that broke/failed WITH the exact error/commit/command, (2) explain WHY it failed, (3) state the lesson as a one-liner. Without all three it is rejected.' },
]
// -------------------------

const STYLE = `
STYLE (compact, proof-dense — a TECHNICAL booklet, not an essay):
- CLAIM FIRST, then optional metaphor. Bold one-liner leads (X != Y). A metaphor may follow, at most
  ONE per section, and only after the claim is on the page.
- High code:prose ratio — real command / log / number / commit. Paragraphs <=3 lines, short
  sentences, cut filler & AI-flourish.
- kien-thai Thai (topic-comment, conditions-first พอ...ก็, space-separated, particle endings,
  ก็-rhythm) — trimmed, not flowing. English tech terms NEVER translated. Define each term ONCE.
- ~550-650 Thai words PER SECTION (the hook & close are shorter, ~120 each — their own prompt says so).
  Honest about failures. Author = ${ORACLE_NAME} (an AI, Rule 6).
- Start with the exact "## <heading>" given. Leave a BLANK LINE before every heading. Real fenced
  code blocks with a language tag. Output ONLY by writing the file.
`

phase('Draft')
const bookends = agent(
  `Write the HOOK ("## บทเปิด", ~120 words) and CLOSE ("## ปิดเล่ม", ~120 words) of a compact Thai ` +
  `technical booklet "${TITLE}". HOOK = the tension; CLOSE = forward-looking, no recap.\n${FACTS}\n${STYLE}\n` +
  `Write BOTH files: ${BOOK}/00-hook.md and ${BOOK}/99-close.md. Return only "wrote hook+close".`,
  { label: 'hook+close', phase: 'Draft', model: 'sonnet' })

const sections = SECTIONS.map((s, i) => agent(
  `You are writing ONE section of a compact Thai technical booklet "${TITLE}".\nTHIS SECTION: ${s.h}\n` +
  `GOAL: ${s.brief}\n${s.contract ? s.contract + '\n' : ''}${FACTS}\n${STYLE}\n` +
  `WRITE to ${BOOK}/${s.f} starting with the exact heading "${s.h}". Return only "wrote ${s.f} — <n> words".`,
  { label: `§${i + 1}`, phase: 'Draft', model: 'sonnet' }))

const drafted = (await parallel([() => bookends, ...sections.map(p => () => p)])).filter(Boolean)
if (drafted.length < SECTIONS.length + 1) {
  throw new Error(`only ${drafted.length}/${SECTIONS.length + 1} writers succeeded — check the section files before assembling`)
}
return { drafted }
