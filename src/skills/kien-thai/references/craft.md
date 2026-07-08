# Voice and craft preferences (style)

Subjective style/voice preferences distinct from the mechanical Thai-correctness
rules in `ai-tells.md`. These are taste calls — apply them to lift prose quality,
but a violation here doesn't make a piece "AI-shaped" the way an `ai-tells.md`
violation does. Many are register-conditional (see scope notes inline; cross-ref
`register.md`).

These rules originated in observation of skilled Thai writers (bank long-form,
tech blogs, translation craft) and represent shared craft conventions, not Thai
grammar rules.

## Headlines and openers

### `cliche-headline` *(craft · all-registers · soft)*

- **Bad**: `ทุกสิ่งที่คุณต้องรู้เกี่ยวกับ X`
- **Good**: question pair (`X คืออะไร / Y ได้จริงไหม`) / specific pain frame /
  numbered angle (`5 เรื่องที่...`)

Note: this is closer to "effective writing" advice than a Thai-specific rule.
Listed here because Thai SaaS/SEO content homogenizes around these clichés just
as English does.

### `definition-first-seo` *(craft · marketing · soft)*

`X คือ ...` as the first sentence is the SEO-blog default — homogenizes openings
across SaaS, fintech, and accounting tutorials. Replace with reader-symptom or
question-hook unless the term genuinely needs defining for the audience.

- **Bad**: `ภาษีหัก ณ ที่จ่าย คือ ภาษีที่ผู้จ่ายเงินต้องหักไว้...`
- **Good (symptom)**: `เคยจ่ายค่าจ้างแล้วโดนถามจากบัญชีว่าหัก ณ ที่จ่ายแล้วรึยังไหม?`
- **Good (question)**: `ถ้าคุณเคยจ่ายเงินค่าบริการให้บริษัทอื่น คุณต้องหักภาษีไว้ — แล้วทราบไหมว่าต้องหักเท่าไหร่?`

Reserve `X คือ ...` for reference docs and explainers where the definition really
is the goal, not for marketing or conversion-oriented copy.

## Closings

### `cta-bang` *(craft · scoped · soft)*

- **Bad**: `รีบสมัครเลย!` / `อย่ารอช้า!`
- **Good (advisory)**: `กู้เท่าที่จำเป็นและชำระคืนไหว` / `ผู้ลงทุนควรทำความเข้าใจก่อนตัดสินใจ`

**Scope**: full strictness in Explainer, Marketing/B2B-formal, Marketing/fintech-warm,
News, Academic. **Softened in Marketing/SaaS-SME and Marketing/retail-tech** — a
single `!` at hook or CTA is fine, but the rest of the close should still stay
advisory rather than imperative-with-bang.

The rule pairs the imperative-with-bang form (Bad) against Krungsri/SCB advisory
disclaimers (Good). The Good examples show *what bank-explainer copy uses
instead* — they're not direct rephrasings of the Bad.

## Intensifiers and lists

### `empty-intensifier` *(craft · scoped · soft)*

Style preference, not a correctness rule. Real Thai prose substitutes a number,
named example, or Thai-native intensification rather than `อย่าง + abstract noun`
of the overheated kind.

- **Bad**: `อย่างมหาศาล / อย่างน่าทึ่ง / อย่างไม่น่าเชื่อ` (and similar abstract-noun
  calques pitched at hyperbole).
- **Good**: substitute a number, a named example, or `ยิ่ง X เท่าไหร่ ยิ่ง Y เท่านั้น`.

**Not on the Bad list** (corpus trace shows native use):

- `อย่างมาก` — appears in skilled tech-writing (Somkiat). Caution applies to
  *stacking* (`สำคัญอย่างมาก` repeated across paragraphs) rather than the word
  itself.
- `อย่างมีประสิทธิภาพ` — convention in marketing/b2b-formal and marketing/
  fintech-warm (AWS Thailand, Wisesight, Bluebik, SCB). Reads as register
  signal, not AI tell. In those registers, leave it alone. In tech-writing or
  explainer register where the corpus prefers concrete verbs, still prefer the
  concrete form.

### `generic-reassurance` *(craft · scoped · soft)*

- **Bad**: `ไม่ต้องกังวล เป็นเรื่องที่เข้าใจได้`
- **Good**: specifics — what the reader concretely should do next.

**Scope**: full strictness in Explainer, Marketing/B2B-formal, Marketing/fintech-warm,
News, Academic. **Softened in Marketing/SaaS-SME** — a brief reassurance at hook or
pivot is acceptable when paired with a concrete next-step
(`ไม่ต้องกลัวเริ่มไม่ทัน — ลองฟรี 30 วันได้เลย`).

## Voice and framing

### `concrete-cases-over-topology` *(craft · all-registers · soft)*

AI writes "there exists X between A and B" when the human would write "in
some cases X happens this way, or that way." Topology statements
(`มีเส้นทาง...`, `มีความสัมพันธ์...`, `มีการเชื่อมโยง...`) read abstract;
case-by-case description (`บางกรณี...`, `คดีบางลักษณะ...`,
`ในบางสถานการณ์...`) reads concrete and useful. Strictest in
official / operational / minutes register where the audience is operational,
not architectural.

- **Bad**: `มีเส้นทางการส่งต่อสำนวนระหว่าง ปปท. และ ปปช.`
- **Good**: `คดีบางลักษณะอาจจะมีการส่งต่อให้ทาง ปปช. ดำเนินการ หรือมีการได้รับมอบหมายจาก ปปช. ให้ดำเนินการ`

Heuristic: when about to write `มี [abstract relation] ระหว่าง A และ B`,
ask whether 2–3 enumerated cases would carry more information.

### `positive-capability-framing` *(craft · scoped · soft · provisional)*

Earlier framing of this rule conflated two distinct issues. Split:

**(a) `บังคับ` on inanimate system subject — animacy issue.** `ระบบบังคับ
ให้...` reads wrong because `บังคับ` (coerce/force) carries an agentive,
animate sense that doesn't fit a system subject. This is mechanical, closer
to `ai-tells.md` territory than craft.

- **Bad**: `ระบบบังคับให้แนบหลักฐาน...ก่อนเปลี่ยนสถานะ`
- **Better**: lose `บังคับ` — use a sequencing chain (see (b)) or `ระบบ
  จะ...ให้` framing.

**(b) Sequencing-pivot choice in operational register.** Native operational
Thai uses `ถึงจะ` as the "only-then" marker: `ต้อง Y ก่อน X ถึงจะ Z ได้` /
`เมื่อ Y แล้ว X ถึงจะ Z ได้`. The temporal chain itself is native and
fine — the earlier claim that enforcement chains read as English-projection
was wrong; `ต้อง...ก่อนถึงจะ...ได้` is standard Thai.

`ก็ต่อเมื่อ` also exists but skews legal / contract / formal-policy
register and reads heavy in operational UX spec.

- **Operational (native pivot)**: `เมื่อยืนยันตัวตนผ่านแล้ว บัญชีถึงจะ
  ถอนเงินได้`
- **Formal/policy register**: `บัญชีจะถอนเงินได้ก็ต่อเมื่อผ่านการยืนยันตัว
  ตนแล้ว`

**Semantic caveat — don't substitute `ก็ต่อเมื่อ + ได้` mechanically.** The
form `จะ X ได้ก็ต่อเมื่อ Y` reads as *permission* (system is permitted to X
once Y), not *automatic execution* (system X-es automatically once Y). For
specs where the intent is auto-execution on condition, use `ถึงจะ` or
temporal fronting (`เมื่อ Y แล้ว ระบบจะ X ให้`). `+ ได้` is not a free
swap for `จะ` in this position.

**Provisional**: corpus has no curated operational/system-spec register;
this rule reasons across registers we haven't sourced. `ก็ต่อเมื่อ` traces
to one corpus instance in translation register only. Revisit when
operational corpus exists.

## See also

Sentence shape and bullet/prose balance live as positive rules in
`style-rules.md` — `mixed-sentence-length`, `prose-before-bullets`,
`uneven-list`, `no-recap-close`. craft.md only houses the soft AI-signature
patterns that don't have a clean positive twin (cliché headlines, definition-
first SEO opener, scoped CTA/reassurance bans, empty intensifiers).
