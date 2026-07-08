---
name: kien-thai
description: Write Thai-language prose (technical documentation, marketing copy, explainers, blog posts, translations) that reads like a real Thai writer — not generic AI output. Counters training-data skew toward over-formal, over-polite, calqued Thai. TRIGGER when: user asks for any non-trivial Thai prose output (paragraph or longer — blog post, landing page, doc page, README in Thai, email, announcement, section); user asks to translate English into Thai; user asks to edit, rewrite, or review existing Thai prose; conversation is in Thai and user asks for a prose deliverable. DO NOT TRIGGER for: single-word or single-phrase translations, button labels, code identifiers, short UI strings, code comments, or conversational chat replies in Thai that aren't deliverable prose.
---

# kien-thai

## Why this skill exists

AI-produced Thai imports English's discourse mechanics whole-cloth and adds
politeness/connective padding by default. Native readers feel the friction —
re-reading, skimming, abandoning. Surface-level rules ("don't use ทั้งนี้")
treat symptoms; the seven frames below are the structural cause. Granular
rules in `references/ai-tells.md` (mechanical), `references/grammar.md`
(surface), and `references/craft.md` (taste) become applications of the
frames — many auto-resolve once the frames are right.

### `f1` *(frame · all-registers · structural)*

**Frame 1 — Topic-comment over subject-verb-object.** English defaults to SVO.
Thai often fronts the topic (whatever the sentence is *about*)
and then comments on it. When the English source has a heavy subject ("the fact that
X is..."), calquing it into Thai produces `การที่...นั้น...` chains that no Thai
reader produces unprompted.

- English (SVO): `The system processes this data every five minutes.`
- Calqued: `ระบบประมวลผลข้อมูลพวกนี้ทุก ๆ 5 นาที`
- Topicalized: `ข้อมูลพวกนี้ ระบบจะ process ทุก 5 นาที`

Heuristic: if the English subject is heavy, abstract, or really the patient of the
verb, front it as topic in Thai.

Covers `non-adversative-thuk` (ถูก-passive) and `garn-thi-tham-hai` (การที่...ทำให้).

### `f2` *(frame · all-registers · structural)*

**Frame 2 — Condition, time, and frame go first.** English puts conditions and
time-frames after the main clause: "X happens when Y" /
"X if Y". Thai prefers the inverse: condition first, main clause after.

- English: `The DB starts timing out when traffic spikes.`
- Calqued: `DB จะเริ่ม timeout เมื่อ traffic พุ่งสูง`
- Native: `พอ traffic พุ่งสูง DB ก็เริ่ม timeout`

Common Thai openers for fronted conditions/times: `พอ...ก็...`, `ถ้า...จะ...`,
`เมื่อ...`, `ตอน...`, `หาก...`.

Covers `tirai-frame-closure`, `frame-scoped-ko`, and `whenever-calque` —
conditional frames require paired closure/linker (see `references/grammar.md`,
`references/ai-tells.md`).

### `f3` *(frame · all-registers · structural)*

**Frame 3 — Sentence boundaries via space and paragraph, not period.**
English uses a period after every sentence. Modern Thai web writing
(blog, marketing, explainer, news) uses periods sparingly. Sentence boundaries are
carried by spaces and paragraph breaks; periods are reserved for end-of-paragraph
snap or genuinely terminal statements.

- AI density: `ระบบทำงานเร็วขึ้น. ใช้ memory น้อยลง. ทีมพอใจมาก.`
- Native: `ระบบทำงานเร็วขึ้น ใช้ memory น้อยลง ทีมพอใจมาก`

Heuristic: drop mid-paragraph periods; let space carry the boundary. Keep periods
only where a snap or finality is genuinely intended.

The Royal Institute's *หลักเกณฑ์การเว้นวรรค* formalizes a two-tier space system —
clause-internal vs sentence boundary. Modern keyboards emit a single ASCII space
either way, so the distinction surfaces as visual rhythm. Treat: short single
space within a clause; paragraph break at sentence boundaries.

Covers `mid-paragraph-period` (period spam — see `references/ai-tells.md`).

### `f4` *(frame · all-registers · structural)*

**Frame 4 — Closure via sentence-final particles.** English doesn't need
closure particles. Thai uses a small inventory of them to wrap
clauses cleanly: `ด้วย` (also/too — closes additive thoughts), `แล้ว` (completion,
transition), `ไป` (movement away/done), `อยู่` (ongoing state), `เลย` (intensification
or "right then"), `ก็แล้วกัน` (let's just leave it / decision), `อยู่ดี`
(still / nonetheless), `ต่างหาก` (contrastive correction — "actually X, not Y").

Note on `แล้ว` variants (per Olsson 2013 on Thai iamitive): bare `แล้ว`
(`f4/laeo-completion`) alone marks completion / "by now". `X แล้ว ก็ Y` adds
sequence + pacing (see Frame 6). `เสร็จแล้ว` (`f4/set-laeo-perfective`) is the
perfective-completion variant — action finished, with finality beyond just temporal
completion. Pick the form that matches whether the close needs pure completion,
sequenced flow, or finished-action force.

When AI omits these because the English source has no equivalent token, Thai
sentences feel dangling — like the writer trailed off.

- Dangling: `repo นี้ไม่ได้มากับกฎอย่างเดียว มี eval harness ผูกกับ claude และ codex`
- Closed: `repo นี้ไม่ได้มากับกฎอย่างเดียว มี eval harness ผูกกับ claude และ codex ด้วย`

**ด้วย additive closure** (`f4/duai-additive`): especially watch for
`ไม่ได้...อย่างเดียว`, `ไม่ใช่แค่...`, `ไม่เพียงแต่...` frames — they almost always
need a closure particle to finish the implicit "also Y".

**ต่างหาก closure** (`f4/targhak-closure`): contrastive correction frames
(`ไม่ได้ X อยู่ที่/เป็น/คือ Y`) take `ต่างหาก` — Thai's emphatic-correction particle
that closes the "actually it's Y, not X" thought.

- Dangling: `ปัญหาส่วนใหญ่ไม่ได้อยู่ที่ยอดขาย อยู่ที่ต้นทุน`
- Closed: `ปัญหาส่วนใหญ่ไม่ได้อยู่ที่ยอดขาย อยู่ที่ต้นทุนต่างหาก`

Covers `dangling-additive-frame` and `seam-connective-missing` (audit-mode
catches for the missing-between-clause-beat family).

### `f5` *(frame · all-registers · structural)*

**Frame 5 — Cohesion via zero anaphora and demonstratives.** English needs
explicit pronouns: *it / they / he / she / this / that*. Thai has three
main strategies that AI underuses:

1. **Zero anaphora** (`f5/zero-anaphora`) — once the topic is established, drop the subject entirely.
   Re-state only when control changes. A paragraph beginning `เราเรียนรู้จากความผิดพลาด...`
   can run several sentences before *เรา* needs to reappear.
2. **Demonstratives over pronouns** — `นี่ / นั่น / โน่น` for "this / that / yonder";
   reference the noun by demonstrative + classifier when needed
   (`คนนี้`, `เคสนั้น`, `ปัญหานั้น`). AI overuses `มัน`, `เขา`, `พวกเขา` because they
   map to English `it / he / they`.
3. **Demonstrative as inter-clause bridge** (`f5/demo-bridge`) — between clauses where English would
   repeat the subject, Thai uses a demonstrative referring back to the just-stated
   fact: `ตรงนี้แหละที่...`, `นี่คือเหตุผลที่...`, `ส่วนนี้...`. Especially valuable
   for problem→solution pivots (see also Frame 7).

   - Dangling: `ของค้างก็กลายเป็นต้นทุนเงียบ ระบบนี้ช่วย...`
   - Bridged: `ของค้างก็กลายเป็นต้นทุนเงียบ ตรงนี้แหละที่ระบบช่วยได้`

<!-- Native side lifted from corpus/curated/tech-writing/somkiat-bun-testing.md;
     Calqued side manufactured by re-inserting `มัน` at each VP head. -->
- Calqued: `bun ได้ปล่อย feature ต่าง ๆ ออกมามากมาย มันปรับปรุงเรื่องของ performance จากการ build มันลดการใช้งาน memory ในขณะ runtime และมันยังปรับปรุงแนวทางการทดสอบอีกด้วย`
- Native: `bun ได้ปล่อย feature ต่าง ๆ ออกมามากมาย ทั้งการปรับปรุงเรื่องของ performance จากการ build และลดการใช้งาน memory ในขณะ runtime รวมทั้งยังได้ปรับปรุงแนวทางการทดสอบอีกด้วย`

**Caveat — zero anaphora has limits.** Aggressive subject-drop creates subjectless
robot-prose when the referent isn't recoverable from context. If a clause starts
with a connective (`เพราะ...`, `ดังนั้น...`, `ส่วน...`) and immediately presents a
verb without a topic, restore reference via a demonstrative bridge or a
topic-comment restructure rather than reaching for `มัน` (banned by `dummy-man`).

- Robot: `เพราะรับประกัน output rate`
- Native (bridge): `เพราะแบบนี้ output rate จะคงที่`
- Native (restored topic): `algorithm นี้รับประกัน output rate`

### `f6` *(frame · all-registers · structural)*

**Frame 6 — Pacing via ก็.** `ก็` is a uniquely Thai pacing particle. It marks
expectation, sequence, mild
concession, and "as expected" causation. English has no direct equivalent, so AI
drops it, and Thai prose without ก็ reads choppy or robotic.

- Without ก็: `พอ traffic ขึ้น DB เริ่มอืด`
- With ก็: `พอ traffic ขึ้น DB ก็เริ่มอืด`

**ก็ as pacing particle** (`f6/ko-pacing`). Common patterns: `พอ X ก็ Y`, `X แล้ว ก็ Y`, `ถ้า X ก็ Y`, `เลย...ก็...`,
`X ไม่ทัน ก็เลย Y`. Standalone `แล้ว` (without `ก็`) also bridges sequenced action
clauses where English would use no connective:

- Choppy: `ถ่ายรูปบิลจากตลาด ระบบอ่านรายการให้เอง`
- Bridged: `ถ่ายรูปบิลแล้วระบบจะอ่านรายการให้เอง`

**Sub-pattern: ก็ as topic-resumptive bridge** (`f6/ko-resumptive`; formalized in
Takahashi 2023 on ก็ as a pragmatic particle). When a sentence states a topic and then offers a
comment that would otherwise feel clipped, ก็ at the start of the comment gives
the natural "as expected / belongs together" beat. AI tends to write the comment
without ก็ and produce a snap that lands wrong.

- Clipped: `ในรายการนี้ ไม่มีคอลัมนิสต์ดังคนไหน เป็นความตั้งใจ`
- Bridged: `ในรายการนี้ ไม่มีคอลัมนิสต์ดังคนไหน ก็เป็นความตั้งใจ`

Use ก็ as breath/rhythm, not as a connective replacement. Don't force it where it
doesn't fit; do allow it where Thai naturally wants the beat.

### `f7` *(frame · all-registers · structural)*

**Frame 7 — Pivots via question, demonstrative, or simple แต่.** English pivots
between ideas using formal connectives: *however*, *moreover*,
*on the other hand*, *furthermore*. Thai prose pivots more often via:

1. **Rhetorical question** (`f7/question-pivot`) — `แล้วถ้า X ล่ะ?`, `นั่นแปลว่ายังไง?`, `ทำไมถึงเป็นแบบนั้น?`.
2. **Demonstrative bridge** (`f7/demo-pivot`) — `ตรงนี้แหละ...`, `นี่คือเหตุผลที่...` (see also Frame 5).
3. **Simple `แต่`** (`f7/tae-pivot`) — replaces `อย่างไรก็ตาม` in roughly half of its English occurrences.

- AI pivot: `อย่างไรก็ตาม การใช้งานในระดับ production มีข้อจำกัด`
- Native pivot: `แต่พอเอาขึ้น production จริง ก็มีอะไรให้ปวดหัวอีก`
- Native (question pivot): `แล้วถ้าโหลดเพิ่มอีกสิบเท่าล่ะ? ตรงนี้แหละที่เริ่มน่าสนใจ`

**Special case — problem-list to solution pivot** (`f7/problem-solution-pivot`). After listing 2–3 reader
pain-points, AI tends to dive straight into the product/solution clause without a
pivot, producing bullet-list cadence. Insert a question pivot, demonstrative bridge,
or contrastive `แต่` to mark the shift.

- Bullet-cadence: `ของหมดก็เสียยอดขาย ของค้างก็กลายเป็นต้นทุนเงียบ ระบบนี้ช่วย...`
- Pivoted (question): `ของหมดก็เสียยอดขาย ของค้างก็กลายเป็นต้นทุนเงียบ — แล้วทำไงให้คุมของได้แม่น?`
- Pivoted (demonstrative): `ของหมดก็เสียยอดขาย ของค้างก็กลายเป็นต้นทุนเงียบ ตรงนี้แหละที่ระบบนี้ช่วยได้`

Heuristic: every "however" you'd write, ask whether a question or just `แต่` would
do better. Drop one in two.

## Person deixis (apply before drafting any piece with a reader)

Identify three roles before drafting: **1st** (speaker), **2nd** (addressee),
**3rd** (product / concept / third party). Most critical for Marketing.

The single rule AI breaks most: **never substitute the audience's demographic
noun** (`เจ้าของร้าน`, `ผู้ใช้`, `นักลงทุน`, `ผู้ประกอบการ`) for `คุณ` in body
copy. Demographic nouns frame headers and categories; `คุณ` is the active
2nd-person referent.

- Bad: `เครื่องมือนี้ทำให้เจ้าของร้านเห็นภาพจริงของร้านตัวเอง`
- Good: `ระบบนี้ช่วยให้คุณเห็นภาพจริงของร้านได้ทันที`

Once a deixis frame is established for a stretch of prose — including the
**implicit-2nd-person** frame where no pronoun is named but the reader is the
addressee — the rest of the passage must hold it (`deixis-continuity` in
register.md). Don't slip an indefinite-someone (`ใคร`, `คน`, `ใครๆ`) into an
implicit-2nd-person passage; promote it to a modifier (`โดยไม่รู้ตัว`) instead.

Full per-register deixis defaults, brand mood / gender / formality voice
attributes, and the Krungsri "body in `เรา`, advisory in `คุณ`" pattern live
in `references/register.md`.

## Stylistic conventions (apply on top of the frames)

Surface-level voice fine-tuning lives in `references/style-rules.md` (positive
rules: sentence shape, verbs over nouns, openers/closings, concreteness, voice,
ทับศัพท์, translation craft) and `references/craft.md` (soft taste rules).

## Workflow when asked to write Thai prose

1. **Identify register, voice, and person deixis.** ASK if any are unclear —
   wrong register is worse than rough prose.

   Six register families (full guide in `references/register.md`):

   - **News / reference** — no first-person, no particles, active voice.
   - **Explainer** — bank/tech long-form, no particles, problem-first,
     `เรา`/`คุณ` address.
   - **Marketing (family)** — SaaS-SME / B2B-formal / fintech-warm /
     retail-tech sub-registers; person deixis required.
   - **Personal blog / dev war-story** — first-person `ผม` *or* `ดิฉัน` per
     gender, ครับ/ค่ะ at openings and sign-offs only. **ASK gender if not
     stated** — don't silently default to `ผม`.
   - **Academic long-form** — no particles, longer sentences acceptable,
     synthesis closings.
   - **Official / minutes** — government meeting minutes, ministerial memo,
     internal policy, legal/regulatory. No particles, no first-person,
     explicit subjects, four-part procedural sentences, formal vocab swap.
     Provisional (added 2026-05-21, awaiting corpus expansion).

   Voice attributes (gender, brand mood, formality level) are orthogonal to
   register — pick both. For any piece with a reader, also pick 1st/2nd/3rd
   person deixis (see section above).

2. **Draft frame-first.** Before picking words, walk the seven frames:
   - Topic fronted? (Frame 1)
   - Conditions and time clauses leading? (Frame 2)
   - Sentences flowing without period spam? (Frame 3)
   - Clauses closed with appropriate particles? (Frame 4)
   - Cohesion via zero anaphora + demonstratives? (Frame 5)
   - ก็ where Thai wants the beat? (Frame 6)
   - Pivots via question or simple `แต่`, not formal connectives? (Frame 7)

3. **Self-edit pass.** Scan for AI tells:
   - `forbidden-phrases.md` blocklist.
   - Connective budget: ≤1 ซึ่ง / ≤1 โดย / ≤1 ดังนั้น per ~100 words
     (`connective-budget`).
   - Period audit: drop mid-paragraph periods (`mid-paragraph-period`).
   - Closure audit: `ไม่ได้...อย่างเดียว` / `ไม่ใช่แค่...` need a closure
     particle (`dangling-additive-frame`).
   - Sentence-length variance (`mixed-sentence-length`).
   - ครับ/ค่ะ usage matches register (`khrap-kha-in-body`).
   - ถูก- passive: each instance genuinely adversative or agentless
     (`non-adversative-thuk`).

4. **Closing.** Don't recap (`no-recap-close`). Real Thai writing ends with a
   forward-looking line, a reframed question, a quiet handoff (`เท่านี้ก่อน`,
   `ลองเอาไปเล่นดู`), or just stops. Never `โดยสรุปแล้ว...` then re-state the
   body.

## When asked to edit Thai prose

Apply the same passes in reverse: hunt for frame violations and AI tells, propose
specific line edits with the *why*. See `references/examples.md` for before/after
worked examples.

## When asked to translate English to Thai

Translation is where AI fails hardest because it preserves English shape — meaning
all seven frames are at maximum risk.

Minimum checklist:

- Reorder to topic-comment (Frame 1).
- Move condition/time clauses to front (Frame 2).
- Drop English-style mid-paragraph periods (Frame 3).
- Add Thai closure particles where the English-shaped sentence dangles (Frame 4).
- Drop pronouns once topic is set; use demonstratives where English uses pronouns
  (Frame 5).
- Insert ก็ where Thai wants the beat (Frame 6).
- Convert "however / moreover" to questions or simple `แต่` (Frame 7).
- Localize idioms; preserve authorial metaphors with consistent Thai coinage.
- Don't add politeness the source doesn't have. Confident essayists stay confident
  in Thai.
- ทับศัพท์ judgment per the four-bucket guide in `references/style-rules.md`.

## References

Bundle order: `ai-tells.md` (mechanical), `craft.md` (soft taste),
`examples.md` (register-tagged before/after), `forbidden-phrases.md` (audit
blocklist), `grammar.md` (surface), `register.md` (5 register families +
deixis + voice), `style-rules.md` (positive style). Harness scopes
`register.md` and `examples.md` to the active register when known.

Scholarly provenance (Iwasaki & Ingkaphirom, Smyth, Prasithrathsint,
Takahashi, Olsson, Thai Discourse Treebank, Singnoi, Royal Institute,
Marcel Barang) lives in `corpus/curated/scholarly/` — not in the bundle.
