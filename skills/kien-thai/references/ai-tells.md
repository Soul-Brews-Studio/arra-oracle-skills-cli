# AI tells in Thai prose (mechanical)

Mechanical Thai-correctness rules. Cross-references to Frames F1–F7 in SKILL.md.
Register-conditional rules tagged `· register`. Companions: `craft.md` (soft),
`grammar.md` (surface). Inline-code Thai examples may exceed the 90-column rule.

## Connectives and transitions  *(F6, F7)*

### `chueung-stacking` *(mechanical · all-registers · hard)*

AI uses ซึ่ง to glue every dependent clause. Native writers use a period or restructure.

- **Bad**: `Kubernetes เป็นระบบจัดการคอนเทนเนอร์ ซึ่งพัฒนาโดย Google ซึ่งเปิดเป็นโอเพนซอร์ส ซึ่งได้รับความนิยมอย่างแพร่หลาย`
- **Good**: `Kubernetes เป็นระบบจัดการคอนเทนเนอร์ของ Google ปัจจุบันเป็นโอเพนซอร์สและมีคนใช้เยอะมาก`

Budget: at most **one ซึ่ง per sentence**, and prefer ที่ when the antecedent is
concrete.

### `formal-connective-stack` *(mechanical · all-registers · hard)*

AI piles them; humans pick one or skip.

- **Bad**: `ทั้งนี้ระบบยังรองรับการขยายตัว อีกทั้งยังมีความปลอดภัยสูง นอกจากนี้ยังใช้งานง่าย`
- **Good**: `ระบบขยายได้ ปลอดภัยพอใช้ และตั้งค่าไม่ยาก`

`ทั้งนี้` in real bank writing appears almost exclusively near the disclaimer/CTA. Not
as a paragraph opener.

### `yangrai-kotam-overuse` *(mechanical · all-registers · hard)*

Humans use แต่, แต่ว่า, ทว่า sparingly, or just a new sentence.

- **Bad**: `อย่างไรก็ตาม การใช้งานในระดับ production มีข้อจำกัดบางประการ`
- **Good**: `แต่พอเอาขึ้น production จริง ก็มีอะไรให้ปวดหัวอีก`

Heuristic: drop "however" in roughly half its English occurrences.

### `doi-sprawl` *(mechanical · all-registers · hard)*

`โดยที่... โดยการ... โดยมี...` chains.

- **Bad**: `ระบบทำงานโดยที่มีการจัดเก็บข้อมูลโดยใช้ database โดยมีการ query ผ่าน API`
- **Good**: `ระบบเก็บข้อมูลใน database และสามารถ query ได้ผ่าน API`

Cap at one โดย per paragraph. Prefer ด้วย, ผ่าน, จาก, with, or just no connective.

### `nai-khanathi-contrast` *(mechanical · all-registers · hard)*

`ในขณะที่` is mainly temporal in Thai. For contrast, use แต่, ส่วน, กลับ.

- **Bad**: `ในขณะที่ A เชื่อ X, B เชื่อ Y`
- **Good**: `A เชื่อ X แต่ B เชื่อ Y` / `A เชื่อ X ส่วน B กลับเชื่อ Y`

### `whenever-calque` *(mechanical · all-registers · hard)*

English "whenever" maps to two distinct Thai constructions; AI defaults to one
without checking intent.

- **`ทีไร`** = per-instance if-then habituality. "Each time X, Y happens."
  Requires a per-instance closure on the right clause — see grammar
  `tirai-frame-closure`.
- **`ไม่ว่าจะ…เมื่อไหร่`** = universal quantification. "No matter when X, Y."
  Requires `ก็จะ` linker on the consequent — see grammar `frame-scoped-ko`.

The two are not synonyms. English collapses them into "whenever"; Thai forces
the choice.

- **Bad (universal-intent forced into `ทีไร`)**: `โทรหาเขาทีไร เขารับเสมอ`
- **Good**: `ไม่ว่าจะโทรหาเขาเมื่อไหร่ เขาก็จะรับสายเสมอ`

- **Bad (per-instance-intent forced into bare `เมื่อไหร่`)**:
  `ปิดบัญชีสิ้นเดือนเมื่อไหร่ ตัวเลขไม่ตรง`
- **Good**: `ปิดบัญชีสิ้นเดือนทีไร ตัวเลขไม่เคยตรงสักที`

Heuristic: if the sentence describes a *habit* with per-instance frustration or
expectation, use `ทีไร`. If it describes a *universal guarantee* across all
possible times, use `ไม่ว่าจะ…เมื่อไหร่ … ก็จะ`.

## Passive and agency  *(F1)*

### `non-adversative-thuk` *(mechanical · all-registers · hard)*

Thai ถูก- / โดน- carry adversative reading. Native writers use them for genuinely
unfortunate events and re-cast everything else to active.

- `โดน` — strongly adversative, colloquial (`โดนแฮก`, `โดนปฏิเสธ`).
- `ถูก` — neutral-mild adversative, formal (`ถูกประเมิน`, `ถูกตรวจสอบ`).
- Active voice — everything else.

- **Bad**: `ข้อมูลจะถูกส่งไปยังเซิร์ฟเวอร์โดยไคลเอนต์ และจะถูกประมวลผลโดยระบบ`
- **Good**: `ไคลเอนต์ส่งข้อมูลไปที่เซิร์ฟเวอร์ แล้วระบบประมวลผลต่อ`

- **Bad**: `หนังสือเล่มนี้ถูกเขียนโดยแฮรารี`
- **Good**: `หนังสือเล่มนี้แฮรารีเป็นคนเขียน` / `แฮรารีเขียนหนังสือเล่มนี้`

### `is-considered-calque` *(mechanical · all-registers · hard)*

Calque of "is considered (to be)."

- **Bad**: `แนวคิดนี้ถูกพิจารณาว่าเป็นหนึ่งในแนวคิดที่สำคัญที่สุด`
- **Good**: `ถือกันว่าแนวคิดนี้สำคัญมาก` / `นับว่าเป็นแนวคิดสำคัญ` /
  `คนมองว่าเป็นแนวคิดสำคัญ`

## Nominalization and padding (calque shapes)

### `tham-kan-padding` *(mechanical · all-registers · hard)*

Pure padding.

- **Bad**: `ทำการติดตั้ง / ทำการรัน / ทำการตรวจสอบ / ทำการศึกษาเรื่องนี้`
- **Good**: `ติดตั้ง / รัน / เช็ค / ศึกษาเรื่องนี้`

### `kan-nominalization` *(mechanical · all-registers · hard)*

- **Bad**: `การทำการทดสอบและการทำการ deploy ของระบบ`
- **Good**: `เทสและ deploy ระบบ` / `ตอน deploy กับตอนเทส`

Reserve การ- for genuinely abstract topics (การปฏิวัติ, การเรียนรู้) and for headings.

### `mi-khwam-padding` *(mechanical · all-registers · hard)*

- **Bad**: `โค้ดนี้มีความซับซ้อนและมีความยากในการ maintain`
- **Good**: `โค้ดนี้ซับซ้อนและดูแลยาก`

- **Bad**: `ภาษามีความสำคัญต่อการอยู่รอดของเผ่าพันธุ์`
- **Good**: `ภาษาสำคัญต่อการอยู่รอดของเผ่าพันธุ์`

Reserve มีความ for genuine emphasis.

Counter-exception: see `dangling-additive-frame` — `เป็นความ + V` (predicate-noun, e.g. `เป็นความตั้งใจ`)
is required Thai grammar, not padding. Don't strip it to a bare verb.

### `garn-thi-tham-hai` *(mechanical · all-registers · hard)*

Calque of "the fact that X causes Y."

- **Bad**: `การที่สมองของมนุษย์มีขนาดใหญ่ขึ้นทำให้การคลอดยากขึ้น`
- **Good**: `ขนาดสมองที่ใหญ่ขึ้นบังคับให้มนุษย์ต้องคลอดก่อนกำหนด`

Topicalize the noun, pick a vivid verb, drop การที่.

### `nai-rueang-khong-topic` *(mechanical · all-registers · hard)*

Calques of "regarding / as for." Often unnecessary.

- **Bad**: `ในเรื่องของเศรษฐกิจ ประเทศไทยกำลัง...`
- **Good**: `เศรษฐกิจไทยกำลัง...` / `ส่วนเศรษฐกิจ ประเทศไทย...`

### `khong-chain` *(mechanical · all-registers · hard)*

- **Bad**: `การพัฒนาของระบบเศรษฐกิจของประเทศไทย`
- **Good**: `การพัฒนาเศรษฐกิจไทย`

Thai compounds by juxtaposition, not by ของ.

### `thi-mi-padding` *(mechanical · all-registers · hard)*

AI calques English `[noun] that has [quality]` patterns into `[noun]ที่มี[คุณ]`.
Thai usually compounds noun-noun directly without `ที่มี` scaffolding.

- **Bad**: `เครื่องมือที่มีประสิทธิภาพสูง`
- **Good**: `เครื่องมือประสิทธิภาพสูง` (noun-noun compound)

- **Bad**: `บทความที่มีความน่าสนใจ`
- **Good**: `บทความที่น่าสนใจ` (drop `มี + ความ`; `ที่ + adj` stays when no noun-noun option)

This compounds with `mi-khwam-padding` (มีความ + adj). When you see
`ที่มี + ความ + adj`, both layers are usually padding — strip both.

## Banned panorama openers

### `panorama-opener` *(mechanical · all-registers · hard)*

Banned. Real writers open with a fact, a confession, a symptom, a question.

- **Bad**: `ในยุคปัจจุบันที่เทคโนโลยีพัฒนาอย่างก้าวกระโดด การพัฒนาซอฟต์แวร์จึงมีความสำคัญ...`
- **Good (war-story)**: `สวัสดีครับ วันนี้จะเล่าเรื่องตอน traffic พุ่งจน DB ล่มให้ฟัง`
- **Good (news)**: `Red Hat ประกาศถอด Xorg ออกจาก RHEL 10`
- **Good (explainer)**: `มีเงินใช้แค่เดือนชนเดือน ไม่เคยเหลือเก็บ — เคยรู้สึกแบบนี้ไหม`
- **Good (question hook)**: `เคยสงสัยไหมว่าทำไม API ที่ดูเร็วบนเครื่องตัวเอง พอขึ้น production ถึงช้า`

### `assert-consensus-opener` *(mechanical · all-registers · hard)*

Real writers don't assert consensus they have to declare. They show the symptom.

- **Bad**: `เป็นที่ทราบกันดีว่าการออมเงินสำคัญต่อชีวิตทางการเงิน` /
  `ปฏิเสธไม่ได้ว่า AI กำลังเปลี่ยนวงการนี้`
- **Good (symptom)**: `เก็บเงินไม่ค่อยอยู่? เคยรู้สึกว่าทำไมเงินหายเร็วจัง` /
  `ทีมที่ใช้ AI ช่วยเขียน code เริ่มเห็นผลแล้ว`

## Padding and overhedging

### `mai-wa-cha-pen-list` *(mechanical · all-registers · hard)*

`ไม่ว่าจะเป็น A, B, หรือ C` reads as translated catalog. Used sparingly in real
copy; AI defaults to it for any 2–3 item enumeration.

- **Bad**: `ไม่ว่าจะเป็นการลงทุนในหุ้น กองทุนรวม หรือพันธบัตร`
- **Good**: `หุ้น กองทุนรวม หรือพันธบัตร` (bare enumeration) /
  `ทั้งหุ้น กองทุนรวม และพันธบัตร` (totalizing)

### `over-hedging` *(mechanical · all-registers · hard)*

Hedge stacks (`อาจจะมีความเป็นไปได้ที่จะ...`,
`อาจจะ...ก็เป็นไปได้ว่า...อาจ`) and the marketing-register cousin
`น่าจะ X อยู่ด้วยซ้ำ` (modal + progressive + emphatic) read timid. Native
copy asserts and reserves a singular `อาจ` for genuine uncertainty.

- **Bad (stacked)**: `อาจจะมีความเป็นไปได้ที่ราคาจะปรับขึ้น`
- **Bad (marketing hedge stack)**: `จานเดิมที่เคยกำไรดี ตอนนี้น่าจะขาดทุนอยู่ด้วยซ้ำ`
- **Good (single hedge)**: `ราคาอาจปรับขึ้น`
- **Good (assertion)**: `จานเดิมที่เคยกำไรดี ตอนนี้กลายเป็นขาดทุน`

## Pronouns and politeness  *(F5, register)*

### `khrap-kha-in-body` *(mechanical · register · hard)*

Wrong register for body copy of explainers, tech docs, marketing. Real bank explainers
(SCB, ttb, Krungsri body) use **zero** ครับ/ค่ะ. Particles appear in: quoted speakers,
personal blog openings/sign-offs, social/chat copy.

- **Bad (explainer)**: `การออมเงินสำคัญมากครับ คุณควรเริ่มเก็บตั้งแต่วันนี้ครับ`
- **Good (explainer)**: `การออมเงินสำคัญ ยิ่งเริ่มเร็วเท่าไหร่ยิ่งดี`

### `than-pronoun` *(mechanical · all-registers · hard)*

Reads as legal/old-bank copy. Default is **คุณ** (instructional/direct) or **เรา**
(concept-teaching).

### `first-person-avoidance` *(mechanical · register · hard)*

In personal blog / dev war-story register, dropping first-person reads as translated
press release.

- **Bad**: `จึงทำการศึกษาและทดลองใช้งาน`
- **Good**: `ผมเลยลองเล่นดู` / `เราเลยเอามาลองที่ทีมก่อน`

### `pronoun-spam` *(mechanical · all-registers · hard)*

English needs *we / you / it*; Thai drops them once topic is set. The drop is
context-dependent — when the topic carries through, repeating the pronoun reads
as translated. When emphasis or rhythm calls for repetition (philosophical /
lyrical prose), keeping pronouns is fine. Only fire this rule when the repetition
adds nothing but English-shape.

- **Bad**: `เราใช้ Redis เก็บ session เราพบว่าเรา query เร็วขึ้น`
- **Good**: `เราใช้ Redis เก็บ session พบว่า query เร็วขึ้น`

### `dummy-man` *(mechanical · all-registers · hard)*

- **Bad**: `มันเป็นที่ชัดเจนว่า...`
- **Good**: `เห็นได้ชัดว่า...` / `ชัดเจนว่า...`

### `samrap-broad-for` *(mechanical · all-registers · hard)*

- **Bad**: `สำหรับผมแล้ว ผมคิดว่า...`
- **Good**: `ผมคิดว่า...` / `ในความเห็นของผม...`

## Punctuation  *(F3, Style)*

### `comma-apposition` *(mechanical · all-registers · hard)*

Thai uses spaces for apposition, not commas. For foreign academic/expert names on
first mention, prefix with a title (`คุณ` / `อาจารย์` / `ดร.`).

- **Bad**: `แฮรารี, นักประวัติศาสตร์ชาวอิสราเอล, แย้งว่า...`
- **Good**: `คุณแฮรารี นักประวัติศาสตร์ชาวอิสราเอล แย้งว่า...` (spaces only, title prefix)

### `em-dash-semicolon` *(mechanical · all-registers · hard)*

Thai prose rarely uses `—` or `;`. Real writers use bare relative clauses
(ซึ่ง / ที่), paragraph breaks, or just whitespace. Periods are off-default —
see `mid-paragraph-period`.

- **Bad**: `แนวคิดนี้ — ซึ่งเริ่มต้นในศตวรรษที่ 18 — ได้เปลี่ยนโลก`
- **Good**: `แนวคิดนี้ซึ่งเริ่มต้นในศตวรรษที่ 18 ได้เปลี่ยนโลก` (bare relative clause)

### `nueng-nai-superlative` *(mechanical · all-registers · hard)*

Calque of "one of the most ___ X."

- **Bad**: `เขาเป็นหนึ่งในนักเศรษฐศาสตร์ที่มีอิทธิพลมากที่สุดในศตวรรษที่ 20`
- **Good**: `เขาคือนักเศรษฐศาสตร์ผู้ทรงอิทธิพลที่สุดคนหนึ่งในศตวรรษที่ 20`

### `mid-paragraph-period` *(mechanical · all-registers · hard)*

AI snaps periods after every short clause because English training data carries
over — result: prose with the rhythm of a typewriter. Native Thai prose
carries most sentence boundaries with spaces and paragraph breaks; periods
land on three legitimate moves only.

- **Bad (AI typewriter density)**: `ระบบทำงานเร็วขึ้น. ใช้ memory น้อยลง. ทีมพอใจมาก.`
- **Good (space-separated, default)**: `ระบบทำงานเร็วขึ้น ใช้ memory น้อยลง ทีมพอใจมาก`

Legitimate period moves:

1. **End-of-paragraph snap.** Final period before the paragraph break,
   especially when finality is intended (`เท่านี้ก่อน.`).
2. **Fragment-snap close** (personal-blog only). A short fragment after a long
   sentence, with a period giving the punch (`...DB ล่ม. ปวดหัวมาก.`).
3. **Distinct-sentence boundary inside a paragraph** when two long sentences
   carry genuinely separate ideas and space alone would slur them together.
   Academic / translation register (Bookscape/openworlds) uses this most;
   news/explainer use it sparingly; marketing rarely.

Heuristic: if you have ≥2 mid-paragraph periods in a single paragraph and the
clauses they separate are short (<10 words each), it's typewriter density —
collapse to spaces. One period between two long sentences is fine; three
between three short clauses is not.

## Closure  *(F4)*

### `dangling-additive-frame` *(mechanical · all-registers · hard)*

Thai uses sentence-final particles (`ด้วย`, `แล้ว`, `ไป`, `อยู่`, `เลย`,
`ก็แล้วกัน`, `อยู่ดี`) to wrap clauses. English has no equivalent, so AI omits
them and Thai sentences feel dangling. Especially watch frames that *imply* "also
Y": `ไม่ได้...อย่างเดียว`, `ไม่ใช่แค่...`, `ไม่เพียงแต่...` almost always need
`ด้วย` or similar to finish the implicit additive clause.

- **Bad (dangling)**: `repo นี้ไม่ได้มากับกฎอย่างเดียว มี eval harness ผูกกับ claude และ codex`
- **Good (closed)**: `repo นี้ไม่ได้มากับกฎอย่างเดียว มี eval harness ผูกกับ claude และ codex ด้วย`

**Counter-exception — `เป็นความ + V` predicate-noun.** Thai's "X is [verb-as-noun]"
construction requires `เป็นความ-` (or an explicit subject); stripping to a bare verb
flips meaning to imperative.

- **Bad (bare verb)**: `ที่ผมไม่ตอบเขา ตั้งใจ` (reads as imperative "intend!")
- **Good (predicate-noun)**: `ที่ผมไม่ตอบเขา เป็นความตั้งใจ`
- **Good (explicit subject)**: `ที่ผมไม่ตอบเขา ผมตั้งใจ`

This is the inverse of rule `mi-khwam-padding` — `มีความ + adj` is bureaucratic padding,
but `เป็นความ + V` is required grammar.

### `seam-connective-missing` *(mechanical · all-registers · hard)*

Umbrella for a family of AI tells: omitting Thai's between-clause beats because
the English source has none. Different particles per seam type, but the underlying
pattern is one.

- **Contrastive correction** (`ไม่ได้ X อยู่ที่/เป็น/คือ Y`) → close with `ต่างหาก`
  (Frame 4). `dangling-additive-frame` above covers the additive variant.

  - **Bad**: `ปัญหาส่วนใหญ่ไม่ได้อยู่ที่ยอดขาย อยู่ที่ต้นทุน`
  - **Good**: `ปัญหาส่วนใหญ่ไม่ได้อยู่ที่ยอดขาย อยู่ที่ต้นทุนต่างหาก`

- **Result + means/exception** (`X. ไม่ต้อง Y`) → bridge with `โดย` / `ด้วย` / `ก็`.
  Cap one `โดย` per paragraph (`doi-sprawl`) — that single use is fine.

  - **Bad**: `เห็นภาพจริงของร้านตัวเอง ไม่ต้องเปิด Excel`
  - **Good**: `เห็นภาพจริงของร้านตัวเอง โดยไม่ต้องเปิด Excel`

- **Sequenced action** (`X. Y.`) → bridge with `แล้ว` (or `แล้ว ก็`, see Frame 6).

  - **Bad**: `ถ่ายรูปบิลจากตลาด ระบบอ่านรายการให้เอง`
  - **Good**: `ถ่ายรูปบิลแล้วระบบจะอ่านรายการให้เอง`

- **Problem-list to solution** → pivot via question, demonstrative bridge, or
  contrastive `แต่`. See Frame 7 special case.

Bullet-list cadence (`X. Y. Z. ระบบนี้ช่วย...`) is the AI signature when this rule
fires weakly across a paragraph.
