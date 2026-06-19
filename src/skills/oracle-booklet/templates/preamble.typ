// ===== oracle-booklet typst preamble v2 — learned from complete-book (200pp proven) =====
//   cat preamble.typ body.typ > full.typ
//   typst compile --font-path /System/Library/Fonts --font-path /System/Library/AssetsV2 --font-path ~/Library/Fonts full.typ out.pdf
// (Sarabun lives under AssetsV2 on macOS — include it or the cover/body may fall back.)
// Proven layout (11.5pt / leading 1.5em / block 2em) → ~14 pages for ~3000 words + code.
// v2 changelog: larger fonts, more spacing, rule lines on headings, fill: white after cover.

// Font applies document-wide — set it BEFORE the cover so the cover uses it too (gotcha #5/#6).
#set text(font: ("Sarabun", "IBM Plex Sans Thai Looped"), lang: "th")

// --- Cover page (NO page number) ---
#set page(paper: "a4", margin: 2.2cm)
#line(length: 100%, stroke: 3pt + rgb("#c0392b"))
#v(6em)
#align(center, text(size: 46pt)[<MASCOT_EMOJI>])         // 🎙️ voice · 🏠 infra · 🔒 security · 📊 data · 🤖 AI
#v(2em)
#align(center, text(size: 32pt, weight: "bold", fill: rgb("#1a1a2e"))[<TITLE>])
#v(1.2em)
#align(center, text(size: 13pt, fill: luma(100))[<SUBTITLE>])    // SUBTITLE = 1-2 lines: what + the honest angle
#v(3em)
#align(center, text(size: 12pt, weight: "bold", fill: rgb("#c0392b"))[
  <ORACLE_NAME> <MASCOT_EMOJI> (AI, ไม่ใช่คน) — จาก <HUMAN_NAME>
])
#v(0.5em)
#align(center, text(size: 10pt, fill: luma(140))[<DATE> · <PROOF_NOTE> · mini-book])    // PROOF_NOTE e.g. พิสูจน์ด้วย commit จริง
#v(1fr)
#line(length: 100%, stroke: 3pt + rgb("#c0392b"))

// --- Content pages (numbered, start at 1) ---
// GOTCHA #12: ALWAYS reset fill + margin here (dark cover uses margin:0cm + dark fill — both leak!)
#set page(numbering: "1", fill: white, margin: (top: 2.5cm, bottom: 2.5cm, left: 3cm, right: 3cm))
#counter(page).update(1)
#pagebreak()

// Typography — from complete-book (proven readable at 200pp, crew-master 2026-06-18)
#set text(size: 11.5pt)
#set par(leading: 1.5em, justify: false)
#set block(spacing: 2em)

// L2 = section heading with colored rule line (visual hierarchy from complete-book)
#show heading.where(level: 2): it => {
  v(1.2em)
  line(length: 100%, stroke: 1.5pt + rgb("#c0392b"))
  v(0.6em)
  set text(size: 18pt, weight: "bold", fill: rgb("#1a1a2e"))
  it
  v(0.8em)
}

// L3 = subsection
#show heading.where(level: 3): it => {
  v(0.8em)
  set text(size: 13pt, weight: "bold", fill: rgb("#2c3e50"))
  it
  v(0.4em)
}

// Code blocks — readable size (9pt not 8.5pt), more padding
#show raw.where(block: true): it => block(fill: rgb("#f6f8fa"), stroke: 0.5pt + luma(200), inset: 12pt, radius: 4pt, width: 100%, text(font: "Fira Code", size: 9pt, it))

// Inline code — readable
#show raw.where(block: false): it => box(fill: rgb("#f0f0f0"), inset: (x: 3pt, y: 1.5pt), radius: 2pt, text(font: "Fira Code", size: 9pt, fill: rgb("#36454f"), it))

// Bold — distinct
#show strong: it => text(weight: "bold", fill: rgb("#1a1a2e"), it)

// Tables — more padding (10pt not 8pt)
#set table(stroke: 0.5pt + luma(180), fill: (_, r) => if r == 0 { rgb("#2c3e50") } else if calc.odd(r) { rgb("#f8f9fa") } else { white }, inset: 10pt)
// GOTCHA #4 — body cells LEFT, header centered (never ship a center-aligned body table):
#show table.cell: it => { set text(size: 10pt); if it.y == 0 { align(center, text(fill: white, weight: "bold", it)) } else { align(left, it) } }
