# Positive style rules

Positive style rules. Apply these when drafting.

Inline-code Thai examples may exceed the 90-column rule when the example itself is
longer than that — they're treated as atomic, like URLs.

## Sentence shape and rhythm

### `mixed-sentence-length` *(style · all-registers · soft)*

A 6-word sentence next to a 35-word one is normal Thai prose. Test your draft:
if every sentence is ~20 words, break some.

Good rhythm — long body, then a short snap at the end (personal-blog register,
where fragment snaps with `.` are allowed):

> พอ traffic เข้ามาเยอะขึ้น cache layer ที่เคยพอก็เริ่มไม่พอ
> และตอนนั้นเองที่ปัญหา hot key เริ่มโผล่ ปวดหัวมาก.

In particle-free registers (explainer, news, marketing-body), drop the
fragment and end the paragraph at the natural snap (`...hot key เริ่มโผล่.`).

### `connective-budget` *(style · all-registers · soft)*

In a 100-word paragraph: at most one ซึ่ง, one โดย, one ดังนั้น. Drop "however"
in roughly half its English occurrences. Test every connective: would a Thai
reader notice it missing? If no, delete. See `chueung-stacking`, `doi-sprawl`,
`yangrai-kotam-overuse`, `formal-connective-stack` for the audit-time bans on
each.

### `topic-comment-fronting` *(style · all-registers · soft)*

Thai prefers `topic → comment` over English's SVO. When the English would calque a passive ("X is done by Y"), front the patient as topic and use active voice.

- English: `The fact that the human brain grew larger created a problem during childbirth.`
- Calqued: `ความจริงที่ว่าสมองมนุษย์ใหญ่ขึ้นทำให้เกิดปัญหาในการคลอด`
- Crafted: `สมองที่ใหญ่ขึ้น คือต้นเหตุของปัญหาในการคลอด`

### `conceptual-seam-break` *(style · all-registers · soft)*

If your draft has more than ~25 Thai words without a break, look for a seam. Skilled translators routinely produce 2–3 Thai sentences from one English sentence.

### `topic-pronoun-drop` *(style · all-registers · soft)*

Drop pronominal subjects after the topic is established. Re-state only when
control changes. A paragraph beginning `เราเรียนรู้จากความผิดพลาด...` can run
several sentences before *เรา* needs to reappear. See Frame 5
(`f5/zero-anaphora`); audit catch `pronoun-spam`.

### `ko-pacing-particle` *(style · all-registers · soft)*

Use ก็ as a pacing particle, not a connective. `พอ traffic ขึ้น DB ก็เริ่มอืด`
— feels native. AI tends to drop ก็ entirely or use it wrong. See Frame 6
(`f6/ko-pacing`, `f6/ko-resumptive`).

### `mai-yamok-reduplication` *(style · all-registers · soft)*

Use ๆ (mai-yamok) for casual reduplication. `เรื่อย ๆ`, `ใหม่ ๆ`, `บ่อย ๆ` — natural Thai signal.

### `mai-yamok-spacing` *(style · register-scoped · soft)*

Two rules for the space before ๆ (vetted 2026-05-13, see
[`notes/chrome-session-2026-05-13.md`](../../../notes/chrome-session-2026-05-13.md) §3):

1. **`ต่าง ๆ` always takes the space.** Near-universal across edited
   Thai — government, tech-blog, even amateur personal-blog tend to
   space this one as a stock phrase. If audit ever sees `ต่างๆ`, flag it.
2. **Other reduplications follow register.** Personal blog / marketing-
   warm / casual-explainer / dev-blog: drop the space (`สั้นๆ`,
   `ง่ายๆ`, `อะไรๆ`, `เด็กๆ`, `เตี้ยๆ`). Government / academic /
   formal-explainer / institutional: keep the space (`สั้น ๆ`,
   `ง่าย ๆ`). Tech-news (Register-4 Blognone-style) is mixed within
   publication — pick one and stay consistent within a piece.

Evidence: Pantip Blueplanet (settembre) and GotoKnow plain-diary
(Vicharn Panich) drop the space on non-`ต่าง ๆ` reduplications
(7/7 samples). Bank of Thailand keeps the space (2/2). Blognone
homepage mixes within publication (4 no-space casual + 6 spaced
`ต่าง ๆ` instances). Small-N (~20 samples); phrase as default,
not hard check.

### `baeb-hedger` *(style · scoped · soft)*

Use แบบ as a hedger / approximator. `แบบว่า`, `แบบเร็ว ๆ`, `แบบที่เคยทำ` — natural in dev/casual register; rare in AI output. Scope: dev/casual register.

## Verbs and nouns

### `verb-over-nominal` *(style · all-registers · soft)*

Verbs over noun forms when an action is the point. Prefer `แปลหนังสือ` to
`ทำการแปลหนังสือ` to `การทำการแปลหนังสือ`. Reserve การ-/ความ- for genuinely
abstract topics or for headings. Audit catches: `tham-kan-padding`,
`kan-nominalization`.

### `bare-adjective` *(style · all-registers · soft)*

Adjectives directly, not มีความ + adjective. `โค้ดนี้ซับซ้อน` not
`โค้ดนี้มีความซับซ้อน`. Audit catch: `mi-khwam-padding`.

### `active-voice-default` *(style · all-registers · soft)*

Active voice unless the patient is genuinely the topic. Only use ถูก- when the
action is genuinely adversative (ถูกวิจารณ์, ถูกแฮก, ถูกปฏิเสธ) or when no
agent is recoverable. Audit catch: `non-adversative-thuk`.

## Openers and closings

### `concrete-opener` *(style · all-registers · soft)*

Open with one of: a fact, a confession, a symptom the reader recognizes, a
rhetorical question, a concrete number. Never a panorama (`ในยุคปัจจุบัน...`).
Audit catches: `panorama-opener`, `assert-consensus-opener`.

### `inline-def-parenthetical` *(style · all-registers · soft)*

Inline parenthetical for definitions, not footnotes. `Kubernetes (หรือเรียกสั้น ๆ ว่า K8s)` — common pattern.

### `question-heading` *(style · all-registers · soft)*

Question-headings when the body answers them, declarative when the body elaborates. Avoid noun-phrase-only headings for explainers.

- Good: `รวบหนี้…ช่วยให้การเงินดีขึ้นได้อย่างไร?` / `แล้วทำไมถึงต้องเปลี่ยน?` /
  `เคสที่ pricing พัง`

### `no-recap-close` *(style · all-registers · soft)*

Close without recap. Real Thai writing ends with: a forward-looking line, a
reframed question, a quiet handoff (`เท่านี้ก่อน`, `ลองเอาไปเล่นดู`), or just
stops. `โดยสรุป` is grammatically fine but reads lower-quality in modern Thai.

- **Bad**: `โดยสรุปแล้ว Kubernetes เป็นเครื่องมือที่มีประโยชน์อย่างยิ่งในการ...`
- **Good (war-story)**: `เท่านี้ก่อนนะครับ ใครเคยเจอเคสแปลก ๆ มาคุยกันได้`
- **Good (explainer)**: `เพื่อให้คุณมีชีวิตทางการเงินที่ดีขึ้น`
- **Good (synthesis)**: reframe the original question — don't summarize.

### `advisory-close` *(style · all-registers · soft)*

Advisory closings beat imperative CTAs. Use `ควร` + responsibility framing (`กู้เท่าที่จำเป็นและชำระคืนไหว`) over `รีบสมัครเลย!`.

## Concreteness

### `numeric-anchor` *(style · all-registers · soft)*

Numbers and named examples carry the prose. `p99 ลดจาก 800ms เหลือ ~120ms`, `งบ 4 ส่วน: ใช้/ลงทุน/ออม/ฉุกเฉิน`, `50 pods` — anchor abstract claims.

### `uneven-list` *(style · all-registers · soft)*

Uneven, specific lists beat symmetric tricolons. Replace `รวดเร็ว ปลอดภัย และมีประสิทธิภาพ` with `เร็วขึ้นชัด ๆ จาก 800ms เหลือ ~120ms และ memory ไม่บวมเหมือนเดิม`.

### `ying-proportional` *(style · all-registers · soft)*

`ยิ่ง X เท่าไหร่ ยิ่ง Y เท่านั้น` for proportional claims — Thai-native intensification, replaces empty `อย่างมาก`.

### `nee-khue-pivot` *(style · all-registers · soft)*

`นี่คือเหตุผลที่...` as a clean pivot from problem to concept. Beats `ดังนั้นในวันนี้เราจะมาแนะนำ...`.

## Voice and personality

### `phom-default` *(style · scoped · soft)*

First-person ผม is the default for personal tech writing; เรา for team/collective. Drop both only in pure reference docs and news register. Scope: personal tech writing and team/collective contexts.

### `parenthetical-aside` *(style · all-registers · soft)*

Conversational asides in parentheses or dashes. `(เพื่อความง่ายขอใช้เป็น 80M)`, `(ใครเคยเจอแบบนี้บ้าง)`. Signals human authorship strongly.

### `rhetorical-question` *(style · all-registers · soft)*

Rhetorical questions to advance arguments. `แล้วถ้าโหลดเพิ่มอีกสิบเท่าล่ะ?` is a normal Thai connective, not a gimmick.

### `haha-particle` *(style · scoped · soft)*

Allow `555` or `5555+` once per long post in personal blog register. Forbidden in news register and most explainer/tech-doc contexts. Scope: personal blog only.

### `voice-over-politeness` *(style · all-registers · soft)*

Author voice over Thai politeness defaults. Don't add ครับ/ค่ะ to confident essayists when translating. Don't pad with อาจจะ when the source asserts.

## ทับศัพท์ — four-bucket judgment guide

Every foreign term goes into one of four buckets. Pick once per term per document,
commit.

### Bucket 1 — translate to Thai

When a settled Thai equivalent exists and is recognizable.

- *justice* → ความยุติธรรม
- *freedom* → เสรีภาพ
- *cooperation* → ความร่วมมือ
- *capitalism* → ทุนนิยม
- *productivity* → ผลิตภาพ

### Bucket 2 — transliterate (Thai script)

For proper nouns, neologisms with no clean Thai equivalent, or technical terms whose
English form would jar in running prose.

- *algorithm* → อัลกอริทึม
- *blockchain* → บล็อกเชน
- เซิร์ฟเวอร์, ซอฟต์แวร์, ดาต้า, แอป
- Common transliterated brands: เฟซบุ๊ก, กูเกิล (less common in modern body text —
  Latin script wins)

### Bucket 3 — keep in Latin script

For:

- Brand names that are visual identities: Facebook, Google, Apple
- Industry-specific acronyms: GDP, CEO, AI, API, DCA, IPO
- Technical terms developers use in English: deploy, scale, container, payload,
  latency, throughput, query, index, cluster, pipeline
- Famous titles cited as titles: *The Wealth of Nations*
- Terms whose discussion centers on the term itself
  (`คำว่า meritocracy แปลตรงตัวได้ลำบาก`)

### Bucket 4 — coin-and-gloss

For important author concepts that recur.

- First mention: Thai coinage + (English in parentheses + brief gloss).
- Example: `ระเบียบในจินตนาการ (imagined order — ระเบียบที่คนเชื่อร่วมกันว่ามีอยู่จริง)`
- Subsequent mentions: Thai only.

### Heuristics

- Term appears > 5 times and is the author's coinage → Bucket 4.
- Term has a Royal Institute–approved Thai compound → Bucket 1.
- Term is < 3 syllables and visually punchy in Latin (CEO, AI) → Bucket 3.
- Term is a place / person / brand → Bucket 2 on first appearance with Latin in parens;
  Bucket 3 only if the brand is visually distinctive.
- **Never mix buckets for the same term within a document.**

### `code-mix-noun-binding` *(style · all-registers · soft)*

Code-mix at the noun, not the verb. `deploy โค้ด`, `scale ระบบ`, `query ตาราง` — verb
in English, object in Thai is fine. Reverse (`ทำการ deployment ของ code`) reads
bureaucratic.

## Translation craft (English → Thai)

### `italics-via-particle` *(style · all-registers · soft)*

Render English emphatic italics with word-order or particles, not with bold/italic Thai. Thai typography rarely italicizes for emphasis. Use:

- Final particle: `...แน่นอน`, `...ก็จริง`
- Foregrounding: putting the emphasized item in topic slot
- Lexical replacement: `แท้จริง`, `จริง ๆ`, `เสียด้วยซ้ำ`

### `idiom-localize` *(style · all-registers · soft)*

Localize idioms; preserve metaphors. "It's raining cats and dogs" → `ฝนตกหนักมาก` (meaning, not idiom). But authorial extended metaphors get a calque-coined term, kept consistent throughout. For bare-verb calques (e.g. "burst" → ระเบิด, "drop" → ทิ้ง, "cap" → ปิดฝา), see `verb-calque` in grammar.md — Thai often uses a different verb for the same action.

### `date-trailing` *(style · all-registers · soft)*

Numeric placement. English: `in 2019 the law was passed.` In Thai narrative, dates often trail: `กฎหมายฉบับนี้ประกาศใช้เมื่อปี 2019`.

### `foreign-name-format` *(style · all-registers · soft)*

Foreign names. First mention: Thai transliteration + parenthesized original — `ไมเคิล แซนเดล (Michael Sandel)`. Subsequent: Thai only. Famous-enough names skip the parenthetical (`แฮรารี`).

### `term-establish-once` *(style · all-registers · soft)*

Don't translate the same technical term twice in the same paragraph. First mention establishes the Thai/transliterated form; later mentions don't gloss again.

### `source-fidelity` *(style · all-registers · soft)*

Don't add anything the source doesn't have. No added ครับ/ค่ะ on confident essayists. No hedging อาจจะ where the source asserts. If the source omits a transition, omit it. Fidelity to voice, not tour-guiding.

### `heading-noun-only` *(style · all-registers · soft)*

Headings: shorter than the English, often noun-only.

- English: `How Imagined Orders Shape Cooperation`
- Thai: `ระเบียบในจินตนาการกับความร่วมมือ`
- Not: `วิธีที่ระเบียบในจินตนาการหล่อหลอมความร่วมมือ`

Thai chapter titles favor noun-noun juxtaposition with `กับ` / `และ` / colon.

## Structure

### `prose-before-bullets` *(style · all-registers · soft)*

Commit to prose paragraphs of 2–4 sentences before bulleting. Bullets earn their place when items are parallel-shaped or the list is 4+.

### `numbered-section-heading` *(style · all-registers · soft)*

Numbered sections (1. / 2. / 3.) are fine and common in bank explainers. Pair each with a short heading; don't bullet inside without prose context.

### `disclaimer-as-voice` *(style · scoped · soft)*

Disclaimers absorbed into voice, not bolted on. ttb's `กู้เท่าที่จำเป็น` reads as ethics, not ad. Krungsri's `ทั้งนี้ ผู้ลงทุนควร...` is one sentence, then the piece ends. Scope: bank/finance and regulated-content registers.
