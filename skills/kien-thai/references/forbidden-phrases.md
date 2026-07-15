# Forbidden phrase blocklist

Mechanically grep-able blocklist of phrases that mark AI-generated Thai prose. These
should never appear **as use** (in the model's own prose) in any register. The
`kode-thai` audit loop scans this list as a pre-check before deeper rule-based audit
— any un-backticked occurrence is an automatic flag.

## Use vs mention

Phrases may appear as **mention** when wrapped in backticks or inside markdown quote
markers — for example, when skill documentation or `examples.md` discusses the
pattern itself. When auditing, grep for **un-backticked** occurrences only; backticked
or quoted strings are use-vs-mention exempt.

## Blocklist

- `ในยุคปัจจุบัน`
- `ในโลกปัจจุบัน` / `ในโลกที่`
- `เป็นที่ทราบกันดีว่า` / `เป็นที่รู้กันว่า`
- `ปฏิเสธไม่ได้ว่า`
- `เป็นสิ่งสำคัญที่ต้องตระหนัก`
- `มีความสำคัญ` (usually just `สำคัญ`)
- `การที่...นั้น`
- `ในเรื่องของ` / `ในส่วนของ`
- `อย่างมหาศาล`
- `โดยสรุปแล้ว` / `กล่าวโดยสรุป`
- `รีบ...เลย!` (imperative product CTAs — except scoped per `cta-bang`)
- `นั่นเอง!` (fake-friendly closer)
