---
name: oracle-booklet
description: "Turn ONE session's real work into a polished ~12-15 page proof-dense PDF booklet — cover + 5 sections + a mandatory honest-failure section, compact proof-dense prose (Thai + code), rendered pandoc→typst by 6 parallel agents. Every claim is backed by a real commit/log. TRIGGER: 'proof-dense booklet', 'session booklet', '/oracle-booklet', 'ทำหนังสือจากงานวันนี้แบบมี proof', 'booklet พร้อม honest-failure'. DO NOT TRIGGER for: a lighter/looser short book with no proof-every-claim bar and no mandatory failure section (use /oracle-write-mini-book); a 1-page command ref (use /oracle-cheatsheet); a full 50K-word book (use /oracle-write-endgame / -complete-book)."
argument-hint: "<topic — what the booklet is about> [pages: ~12-15]"
---

# /oracle-booklet — a proof-dense ~12-15 page PDF booklet, never-miss

> Descends from `/oracle-write-mini-book` (noah) and hardens it. The pipeline ran end-to-end to a
> 14-page Thai STT booklet, then **3 rounds of 10-lens prism review** caught and fixed a broken
> assemble-loop, a missing preamble-copy step, a self-blocking preflight, and 60+ smaller traps —
> with an end-to-end smoke test proving it renders. Copy the assets, fill the placeholders, run the
> steps **from the repo root** in order → same quality, zero misses.

## Prerequisites (install once)
```bash
# macOS:  brew install pandoc typst poppler   (poppler = pdfinfo + pdftoppm)   + uvx (uv) for PyThaiNLP
# fonts:  Sarabun (macOS AssetsV2) or IBM Plex Sans Thai Looped + Fira Code  (~/Library/Fonts)
command -v pandoc typst pdfinfo pdftoppm uvx >/dev/null || echo "missing a tool — see above"
```

## What it makes
| | booklet |
|---|---|
| length | **~12–15 PDF pages** — the proven sweet spot; rich proof needs the room, don't fight it |
| words | **~2,900–3,500**, dense (more proof, less prose) |
| structure | **cover** + 1 hook + **5 sections** + 1 close (NO chapters/parts) |
| required | exactly one **🔧 deep-technical** section · exactly one **honest-failure** section (Rule 6's heart) |
| agents | **6** — one writer per section (5) + one for hook+close (single voice) |
| render | **typst** (cover page + Thai + code) — NOT md-to-pdf |
| output | one `.pdf` to `~/Downloads/` + source `.md` in `ψ/writing/mini-books/<slug>/` |

## When to pick this vs siblings
- ONE session's real lesson, every claim backed by a commit/log, with an honest-failure section → **/oracle-booklet** (this)
- the **same ~12-15 pages but lighter** — no proof-every-claim bar, no mandatory failure section, more flexible → `/oracle-write-mini-book`
- a 1-page copy-paste command reference → `/oracle-cheatsheet`
- 10–20 chapters, 50K+ words, GitHub release → `/oracle-write-complete-book` / `/oracle-write-endgame`

---

## Pipeline (6 steps — run from the repo root)

### Step 0 — Mine (light, real proof only)
Never write from memory. One pass for the real artifacts — commits, paths, log lines, errors, numbers:
```bash
git log --oneline -15
ls -t ψ/memory/retrospectives/**/*.md ψ/writing/**/*.md 2>/dev/null | head -5
```
**Every claim in the booklet must carry a real command / commit / error / path / number.** No proof → cut it.

### Step 1 — Plan the spine + scaffold the dir
Pick the **slug = `YYYY-MM-DD_kebab-title`** (it becomes the dir name, the pdf name, AND the section-file
prefix). Create the dir and copy the preamble template **now**:
```bash
SLUG="YYYY-MM-DD_kebab-title"
DIR="$(git rev-parse --show-toplevel)/ψ/writing/mini-books/$SLUG"
mkdir -p "$DIR"
cp ~/.claude/skills/oracle-booklet/templates/preamble.typ "$DIR/preamble.typ"
#   → then EDIT "$DIR/preamble.typ": fill <MASCOT_EMOJI> <TITLE> <SUBTITLE> <ORACLE_NAME> <HUMAN_NAME> <DATE> <PROOF_NOTE>
```
Decide the spine (inline, no OUTLINE.md). **Required elements** (the booklet fails review without them):
```
TITLE (a tight hook — a metaphor is fine: "บ้านหลังเดียว 17 คน", "เงียบ ก็คือเงียบ")
MASCOT emoji (fits the topic: 🎙️ voice · 🏠 infra · 🔒 security · 📊 data · 🤖 AI)
SUBTITLE (1–2 lines — what + the honest angle)
Hook (the tension — 1 short para)
§1 <section> — proof: <commit/command>
§2 <section> — proof: ...
§3 🔧 <DEEP section> — the real mechanics + subheadings  (REQUIRED — exactly one)
§4 <section> — proof: ...
§5 <HONEST-FAILURE section> — a real mistake you made + the lesson  (REQUIRED — exactly one)
Close (forward-looking, 1 short para — no recap)
```
**HONEST-FAILURE CONTRACT** (§5 must satisfy all three or it's rejected): (1) name one specific thing
that broke/failed *with the exact error/commit/command*, (2) explain *why* it failed, (3) state the
lesson as a one-liner. A technical booklet that hides failures is worth less than one that owns them.

### Step 2 — Draft (Workflow: 6 parallel Sonnet writers → files)
Use the `Workflow` tool (the built-in Claude Code tool — **not** `node`; `phase`/`agent`/`parallel`
are Workflow DSL globals that crash under node). Template: `scripts/draft-workflow.template.js` — copy
it, fill the 5 consts (`BOOK`=`$DIR`, `TITLE`, `ORACLE_NAME`, `FACTS`, `SECTIONS`) — save the filled copy
as `$DIR/draft.js` — then call the **Workflow** tool with `script` = that file's content (i.e.
`Workflow({ script: <filled JS> })`). NOTE: §5's heading must contain a failure word
(honest / ผิด / พลาด / ล้มเหลว / บทเรียน / fail) — the assemble gate enforces it. One Sonnet agent per section (5) + one for hook+close
(single voice). Each WRITES its file. The `STYLE` block (below) goes verbatim into every agent prompt so
no agent drifts off-voice.

**STYLE — the compact, proof-dense voice (a *technical* booklet, not an essay):**
- **CLAIM FIRST, then optional metaphor.** Open with the technical point as a BOLD one-liner (`X != Y`);
  a metaphor may follow, **at most one per section, only after the claim is on the page.**
- **High code:prose ratio.** Real command / log / number / commit. Paragraphs ≤3 lines, short sentences.
  Cut filler & AI-flourish.
- **kien-thai Thai** (topic-comment, conditions-first พอ…ก็, space-separated, particle endings เลย/แล้ว/ด้วย,
  ก็-rhythm) — trimmed, not flowing. **English tech terms NEVER translated.** Define each term ONCE.
- **~550–650 Thai words/section** (×5 + hook/close ≈ 3,000–3,500 total — stays in range). Honest about
  failures. **Author = the oracle (an AI, Rule 6 — never pretend to be human).**
- **Markdown:** start each section with its exact `## §N …` heading, `###` subheads, **a BLANK LINE before
  every heading**, real ```fenced``` code with a language tag. Output ONLY by writing the file.

### Step 3 — Assemble + harden (gotcha #2)
Cat sections in order with blank-line separation, then the **fence-aware** blank-before-heading pass
(`scripts/harden-md.py`). Do NOT use a raw regex — it corrupts `#`-comments inside code blocks.

### Step 4 — Thai word-break (gotcha #1)
Insert ZWSP with PyThaiNLP, **skipping code & fenced blocks** (`scripts/wordbreak.py`, attacut→newmm).

### Step 5 — Render PDF (gotchas #3 citations, #7 horizontalrule, #4 tables, #5 cover, #6 fonts, #8 pdfinfo, #11 eyeball)
`pandoc -f markdown-citations` (gotcha #3) → typst body; prepend the filled `$DIR/preamble.typ`; compile
with the font paths; **count pages with `pdfinfo`** (gotcha #8); **eyeball page 1 + a table page** (#11).

### Step 6 — Deliver
Copy the PDF to `~/Downloads/`. Source stays in the vault (do NOT `git add ψ/`). Optionally `maw hey` a peer.

---

## THE 11 GOTCHAS — the never-miss list (each cost a real debugging round)
1. **Thai word-break** — typst breaks mid-Thai-word. Insert ZWSP (PyThaiNLP) **but never inside code/`` `code` ``/```fences```**.
2. **Blank line before EVERY heading, fence-aware** — `## …` with no preceding blank renders as literal text (pandoc `blank_before_header`). Cat with `\n\n` between + a fence-aware pass. NEVER a raw `re.sub` (it hits `#`-comments in code).
3. **`@token` → citation crash** — `@discordjs/voice`, `@org/repo`, `@handle`, emails → pandoc makes them citations → typst dies `error: the document does not contain a bibliography`. Fix: **`pandoc -f markdown-citations`**.
4. **Table cells LEFT, header centered** — pandoc-typst defaults to CENTER → wrapped cells jumble. `align(left, it)` in the preamble is non-negotiable.
5. **Cover page separation** — `#counter(page).update(1)` + `#pagebreak()` after the cover so it has no number and content starts at page 1. (And set the body font BEFORE the cover so the cover uses it.)
6. **Fonts + paths** — body `("Sarabun", "IBM Plex Sans Thai Looped")`, code `Fira Code`. Pass **`--font-path /System/Library/Fonts --font-path /System/Library/AssetsV2 --font-path ~/Library/Fonts`** (Sarabun lives under AssetsV2 on macOS).
7. **`#horizontalrule` leak** — pandoc emits it for `---`. Replace with `#line(length: 100%)` (use `perl -i`, portable across BSD/GNU; `sed -i ''` is macOS-only).
8. **Page count via `pdfinfo`** — `pdfinfo f.pdf | awk '/^Pages:/{print $2}'`. The `/Type/Page` regex counts WRONG.
9. **Layout dials → page count** — proven: `11pt` / `leading 1.28em` / `block 1.3em` → ~14pp for ~3,000 words+code. Shrink: `1.2em`/`10.5pt`. Grow: raise them. Re-render + `pdfinfo` until 12–15. Don't cut content to hit a number.
10. **One writer owns hook+close** — single voice for the bookends; the 5 section agents run parallel to it.
11. **Eyeball before done** — render page 1 (and a TABLE page — tables break first) to PNG with `pdftoppm` and Read it: cover clean? title readable? accent lines? tables left-aligned, not jumbled?

---

## Copy-paste assets (this skill dir)
- `scripts/wordbreak.py` — ZWSP (attacut→newmm), skips code/`` `inline` ``/```fences```/`~~~fences`.
- `scripts/harden-md.py` — fence-aware blank-before-heading.
- `templates/preamble.typ` — cover + content styling (fill `<PLACEHOLDERS>`).
- `scripts/draft-workflow.template.js` — the 6-agent parallel drafting Workflow.

### The assemble → render bash (the whole back half — run from repo root, after Step 1 scaffolded `$DIR`)
```bash
set -euo pipefail
SKILL=~/.claude/skills/oracle-booklet
SLUG="YYYY-MM-DD_kebab-title"
DIR="$(git rev-parse --show-toplevel)/ψ/writing/mini-books/$SLUG"   # needs an Oracle-vault repo (ψ/ at root)
T=$(mktemp -d /tmp/bk-XXXXXX)                                       # per-run temp (no collisions)

# preflight: preamble copied (Step 1) + every placeholder filled
[ -f "$DIR/preamble.typ" ] || { echo "❌ $DIR/preamble.typ missing — run Step 1 (cp the template)"; exit 1; }
# unfilled-placeholder check: skip //-comment lines, catch ANY <...> token (not just <ALL_CAPS>)
if grep -vE '^[[:space:]]*//' "$DIR/preamble.typ" | grep -qE '<[^>]+>'; then
  echo "❌ unfilled placeholders in preamble.typ:"; grep -vE '^[[:space:]]*//' "$DIR/preamble.typ" | grep -oE '<[^>]+>' | sort -u; exit 1; fi
# preflight: Sarabun present (else Thai body silently falls back)
typst fonts --font-path /System/Library/Fonts --font-path /System/Library/AssetsV2 --font-path ~/Library/Fonts 2>/dev/null \
  | grep -q Sarabun || echo "⚠ Sarabun not found by typst — Thai body may use a fallback font"

# 1. assemble in order, blank-line separated  (glob expands INSIDE $DIR — the #1 trap)
: > "$T/assembled.md"
[ -f "$DIR/00-hook.md" ] && [ -f "$DIR/99-close.md" ] || { echo "❌ 00-hook.md / 99-close.md missing — run Step 2 (draft)"; exit 1; }
for f in "$DIR"/00-hook.md "$DIR"/01-*.md "$DIR"/02-*.md "$DIR"/03-*.md "$DIR"/04-*.md "$DIR"/05-*.md "$DIR"/99-close.md; do
  if [ -f "$f" ]; then cat "$f" >> "$T/assembled.md"; printf '\n\n' >> "$T/assembled.md"; fi
done
# structural invariants — HARD gates (count §-HEADINGS, not body mentions)
s=$(grep -c '^## §'    "$T/assembled.md" || true); [ "$s" -eq 5 ] || { echo "⚠ expected 5 §sections, found $s — ABORT"; exit 1; }
w=$(grep -c '^## .*🔧' "$T/assembled.md" || true); [ "$w" -eq 1 ] || { echo "⚠ need exactly one 🔧 §-heading (found $w) — ABORT"; exit 1; }
grep -qiE '^## .*(honest|ผิด|พลาด|ล้มเหลว|บกพร่อง|บทเรียน|fail)' "$T/assembled.md" || { echo "⚠ §5 HEADING must signal failure (honest/ผิด/พลาด/ล้มเหลว/บทเรียน/fail) — ABORT"; exit 1; }

# 2. fence-aware blank-before-heading (gotcha #2)
python3 "$SKILL/scripts/harden-md.py" "$T/assembled.md"
# 3. Thai word-break, skipping code (gotcha #1); passthrough if pythainlp is unreachable
uvx --from pythainlp --with attacut python3 "$SKILL/scripts/wordbreak.py" < "$T/assembled.md" > "$T/zwsp.md" \
  || uvx --from pythainlp python3 "$SKILL/scripts/wordbreak.py" < "$T/assembled.md" > "$T/zwsp.md" \
  || { echo "⚠ pythainlp unreachable — proceeding WITHOUT word-break (lines may break mid-word)"; cp "$T/assembled.md" "$T/zwsp.md"; }
# 4. pandoc citations OFF (gotcha #3) → typst body; fix horizontalrule (gotcha #7, perl = portable)
pandoc -f markdown-citations "$T/zwsp.md" -o "$T/body.typ" -t typst
perl -i -pe 's/#horizontalrule/#line(length: 100%)/g' "$T/body.typ"
# 5. preamble (filled) + body → compile; FAIL LOUD on a missing font (gotcha #4 tables, #5 cover, #6 fonts)
cat "$DIR/preamble.typ" "$T/body.typ" > "$T/full.typ"
typst compile --font-path /System/Library/Fonts --font-path /System/Library/AssetsV2 --font-path ~/Library/Fonts \
  --font-path /usr/share/fonts \
  "$T/full.typ" "$DIR/$SLUG.pdf" 2>"$T/typst.err" || { cat "$T/typst.err"; exit 1; }
# typst exits 0 + warns when it FALLS BACK on a missing font (PDF is still valid) → warn, don't abort
grep -qi 'unknown font' "$T/typst.err" && echo "⚠ typst: unknown font — Thai may use a fallback (install Sarabun / Fira Code)" || true
# 6. page count (gotcha #8) — enforce the 12–15 target
pages=$(pdfinfo "$DIR/$SLUG.pdf" 2>/dev/null | awk '/^Pages:/{print $2}' || echo '?'); echo "pages: $pages"
case "$pages" in ''|*[!0-9]*) echo "⚠ could not read page count (poppler installed?)";;
  *) { [ "$pages" -ge 12 ] && [ "$pages" -le 15 ]; } || echo "⚠ $pages pages outside 12–15 — tune leading/font (gotcha #9)";; esac
# 7. eyeball (gotcha #11): render page 1 + a TABLE page → PNG (then Read them — see below)
TABLE_PAGE=3                                  # set to the first page that has a table
pdftoppm -r 144 -png -f 1 -l 1 "$DIR/$SLUG.pdf" "$T/p1"           2>/dev/null || echo "install poppler: brew install poppler"
pdftoppm -r 144 -png -f "$TABLE_PAGE" -l "$TABLE_PAGE" "$DIR/$SLUG.pdf" "$T/ptbl" 2>/dev/null || true
echo "→ Read these PNGs before declaring done:"; ls "$T"/p1-*.png "$T"/ptbl-*.png 2>/dev/null
# 8. deliver
cp "$DIR/$SLUG.pdf" ~/Downloads/
echo "✅ $DIR/$SLUG.pdf → ~/Downloads/  (now Read the PNGs above with the Read tool)"
```

---

## Quality bars (NOT done until all true)
- [ ] Cover renders clean (eyeball PNG): mascot centered, title huge & readable, accent lines, author "(AI, ไม่ใช่คน) — จาก <human>".
- [ ] Exactly **one 🔧** section and **one honest-failure** section (the bash structural checks pass with no ⚠).
- [ ] Honest-failure section satisfies the 3-part contract (what broke + why + the lesson).
- [ ] Every claim carries real proof; no literal `## …` heading text in the PDF; tables left-aligned.
- [ ] Page count **12–15** (via `pdfinfo`).
- [ ] Eyeballed page 1 **and** a table page (`pdftoppm` → Read).
- [ ] Compact voice: bold one-liners, short paragraphs, high code:prose, English terms untranslated.

## Hard rules
1. **Real proof every claim.** 2. **Honest-failure section is mandatory** (Rule 6 = not pretending to be
human AND not pretending you never failed). 3. **6 agents, not a swarm.** 4. **Author = the oracle.**
5. **Eyeball the PDF** before declaring done. 6. **Don't cut content to hit a page number** — 12–15pp is right.

## Credits
PyThaiNLP (attacut) · pandoc · typst (Sarabun / IBM Plex Sans Thai Looped + Fira Code). Descends from
`/oracle-write-mini-book` (noah). Gotcha #2 (fence-aware blank-before-heading) cross-validated with maw-rs;
#3 (pandoc citations) found by transcriber. Hardened by a 10-lens prism self-review (2026-06-18).

---
🤖 ตอบโดย transcriber จาก Nat → transcriber-oracle
