# Surface Thai grammar

Word/phrase-level Thai grammar — hard rules, all registers. Distinct from the
discourse frames in SKILL.md.

### `wrong-classifier` *(mechanical · all-registers · hard)*

Thai requires a classifier when counting or specifying a noun. AI defaults to `ใบ`
for "thing" or drops the classifier entirely. Each noun has an established
classifier; using the wrong one reads as foreign-fluent.

- **Bad**: `bucket หนึ่งใบ` / `request กิน token หนึ่งใบ` / `server หนึ่งตัว`
- **Good**: `bucket หนึ่งถัง` / `request กิน token หนึ่งอัน` / `server หนึ่งเครื่อง`

Common technical-noun classifiers:

- `เครื่อง` — server, computer, machine, device
- `ตัว` — variable, function, instance, character, parameter
- `อัน` — generic small/abstract object (token, item, record)
- `ถัง` — bucket, tank, container
- `ชิ้น` — piece, item (concrete physical thing)
- `รายการ` — list item, transaction, entry
- `บรรทัด` — line (of text/code)
- `หน้า` — page

If unsure, omit the count (`เก็บ token เพิ่ม`) over picking a wrong classifier.

**Register-aware**: conversational/personal-blog/explainer accept generic `อัน`/
`ตัว`; News/Academic/B2B-formal prefer the precise classifier.

### `missing-cha-modal` *(mechanical · all-registers · hard)*

English present tense covers future, modal, and habitual readings. Thai uses `จะ`
to mark future or hypothetical/modal clauses. AI omits it when the English source
has no explicit future marker, producing clauses that read as bare description
rather than the intended modal.

- **Bad**: `เลือกตัวไหนขึ้นอยู่กับว่า downstream รับ burst ได้แค่ไหน`
- **Good**: `จะเลือกตัวไหนขึ้นอยู่กับว่า downstream รับ burst ได้แค่ไหน`

- **Bad**: `วิธีนี้คุม average rate ได้`
- **Good**: `วิธีนี้จะคุม average rate ได้`

- **Bad**: `พอเริ่มยิงทีก็ระเบิดได้เต็มความจุ`
- **Good**: `พอจะเริ่มยิงทีก็ยิงได้เต็มความจุ` / `ตอนที่เริ่มยิงก็จะยิงได้เต็มความจุ`

### `function-word-confusion` *(mechanical · all-registers · hard)*

Short connectives carry distinct meanings; AI substitutes them based on shape rather
than function.

- **`จะ` (future/modal) vs `จน` (until / extent)**

  - **Bad**: `client ไม่ได้ยิง bucket จะเต็ม`
  - **Good**: `client ไม่ได้ยิง bucket จนเต็ม`

- **`เมื่อ` (formal "when") vs `เวลา` / `ตอนที่` (natural casual "when")** —
  `เมื่อ` reads stiffly in conversational/explainer/marketing registers.

  - **Bad (stiff)**: `token bucket ดีเมื่อ traffic burst`
  - **Good (natural)**: `token bucket ดีเวลามี burst` / `token bucket ดีตอนที่ traffic burst`

- **Missing `กับ` after `เหมาะ`** — `เหมาะ` requires an object marker.

  - **Bad**: `เหมาะตอนที่อยากให้...`
  - **Good**: `เหมาะกับตอนที่อยากให้...` / `เหมาะกับงานที่...`

Heuristic: when a short connective feels off, check whether AI picked the
register-formal cousin (`เมื่อ`) where the natural-register cousin (`เวลา` /
`ตอนที่`) fits better.

### `verb-calque` *(mechanical · all-registers · hard)*

Translating English verbs literally without checking whether Thai uses the same
verb for the same action. Distinct from idiom calque (style-rules `idiom-localize`) — this is
at the bare verb.

- **Bad**: `ระเบิดได้เต็มความจุ` (calque of "burst")
- **Good**: `ยิงได้เต็มความจุ`

- **Bad**: `ถ้า bucket เต็มก็ทิ้ง` (calque of "drop")
- **Good**: `ถ้า bucket เต็มก็โดน reject` / `ถ้า bucket เต็มก็จะโดนปฏิเสธ`

Heuristic: when a Thai verb feels metaphorical-but-flat, search for the English
verb it's translating. If the English verb is idiomatic-physical (burst / drop /
cap / throttle), the Thai equivalent is usually a different verb, not the literal
physical one.

### `capability-modal` *(mechanical · all-registers · hard)*

Thai expresses "can / is able to" with the discontinuous frame `สามารถ + V + ได้`.
AI sometimes uses bare verbs or overuses one half of the frame. Both halves work
together; for emphatic capability, use both.

- **Bad (bare)**: `ระบบ query ผ่าน API`
- **Good**: `ระบบสามารถ query ได้ผ่าน API` (full frame)
- **Acceptable (informal)**: `ระบบ query ได้ผ่าน API` (only `ได้`)

**Register-aware**: official / news / academic require the full `สามารถ + V +
ได้` frame. Personal-blog / explainer / marketing accept `V + ได้`. The
"Acceptable (informal)" lenience does **not** extend to official minutes — see
`formal-capability-frame` under Register 6 in `register.md`.

### `time-period` *(mechanical · all-registers · hard)*

For time periods (centuries, decades, eras), Thai uses `ใน` — *during* the period —
not `ของ` (which marks possession or relation).

- **Bad**: `นักเศรษฐศาสตร์ที่ทรงอิทธิพลที่สุดของศตวรรษที่ 20`
- **Good**: `นักเศรษฐศาสตร์ที่ทรงอิทธิพลที่สุดในศตวรรษที่ 20`

### `quant-subject-cog-verb` *(mechanical · all-registers · hard)*

Quantitative or factual subjects (`ตัวเลข`, `ยอด`, `ราคา`, `ต้นทุน`, `รายได้`)
pair with cognitive / expectation verbs — `คาด` (sharpest, no opinion-bleed),
`คิด`, `หวัง` — not affective verbs (`รู้สึก`, `เชื่อ`-as-feeling). English freely
collapses cognitive and affective ("doesn't match what I *feel*"); Thai
distinguishes. Affective verbs on quantitative subjects read as English calque.

- **Bad**: `ตัวเลขไม่ตรงกับที่รู้สึก`
- **Good**: `ตัวเลขไม่ตรงกับที่คาด` (with proper frame closure when in a `ทีไร`
  construction — see `tirai-frame-closure`)

Adjacent calque trap on the same axis: the verb for "match / align" on
quantitative subjects is `ตรง`, not `ซ้ำ`. `ซ้ำ` = repeat/duplicate; reaching
for it under English "the numbers don't *match*" is calque.

- **Bad**: `ตัวเลขไม่เคยซ้ำสักที` (intended meaning: numbers never match)
- **Good**: `ตัวเลขไม่เคยตรงสักที`

Heuristic: when the subject is a number or quantity, the verb must be one a
spreadsheet could perform (calculate, match, exceed, fall short) — not one a
person performs on a feeling.

### `tirai-frame-closure` *(mechanical · all-registers · hard)*

`ทีไร` is a paired construction. The right clause must carry a per-instance
closure; bare endings parse as truncated. Safe closures:

- **Positive (habitual)**: `ทุกที` — punctual, per-instance. Safest.
- **Negative (frustration)**: `ไม่เคย…สักที`, `ไม่เคย…เลย`.

`ทุกครั้ง` is a soft drift toward aggregate/stative — usable but slides toward
the `เสมอ`-mismatch class. Prefer `ทุกที` for `ทีไร` pairings.

- **Bad (no closure)**: `ฝนตกทีไร น้ำท่วม`
- **Good**: `ฝนตกทีไร น้ำท่วมทุกที`

- **Bad (no closure)**: `เปิดบัญชีสิ้นเดือนทีไร ตัวเลขไม่ตรง`
- **Good**: `เปิดบัญชีสิ้นเดือนทีไร ตัวเลขไม่เคยตรงสักที`

Note: `เสมอ` paired with `ทีไร` is **partially idiomatic** — works for some
subject/verb combinations (e.g. `เจอเขาทีไร เขายิ้มเสมอ`, `โทรหาทีไร
สายไม่ว่างเสมอ`), fails for others (`ขับรถทีไร รถติดเสมอ`). The bounded-to-
trigger hypothesis (the right-clause state must be bound to the trigger event,
not exist independently) captures some cases but does not predict reliably.
Treat `ทีไร + เสมอ` pairings as a tagged exemplar collection — see
`examples.md` — not as a universal rule.

### `frame-scoped-ko` *(mechanical · all-registers · hard)*

The linker `ก็` is frame-scoped, not blanket-applicable. Different conditional
frames take different linker requirements:

- **`ทีไร` frame**: `ก็` is **redundant**. The frame already carries the if-then
  linker. `ก็` doubles it.
  - **Bad**: `ลองทำทีไร ก็พังทุกที`
  - **Good**: `ลองทำทีไร พังทุกที`
- **`ไม่ว่าจะ…เมื่อไหร่` frame** (universal quantification): `ก็จะ` is
  **required**. The universal frame needs an explicit pivot to the consequent.
  - **Bad**: `ไม่ว่าจะโทรหาเขาเมื่อไหร่ เขารับสายเสมอ`
  - **Good**: `ไม่ว่าจะโทรหาเขาเมื่อไหร่ เขาก็จะรับสายเสมอ`

Separately, `ก็` marks consequence in **causal** pairs (rain → wet,
deploy → bug). It fails on **constitutive** pairs where the second clause is
*built from* or *identical with* the first by definition (cost ↔ ingredient
prices, weight ↔ mass). For constitutive pairs, drop `ก็` or use `จะ` for
future-state.

- **Bad (constitutive + `ก็`)**: `ราคาวัตถุดิบขยับเมื่อไหร่ ต้นทุนต่อจานก็ขยับตาม`
- **Good**: `ราคาวัตถุดิบขยับเมื่อไหร่ ต้นทุนต่อจานขยับตามทันที`

Heuristic: ask whether the right-clause state could exist *without* the
left-clause event. If yes (rain creates wetness that wasn't there) → causal,
`ก็` fits. If no (cost is the ingredient prices) → constitutive, drop `ก็`.
