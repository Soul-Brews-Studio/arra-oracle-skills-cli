---
name: oracle-book-cover
description: '[standard] G-SKLL | Design a beautiful, social-ready book cover — find real art (LICENSE-checked), 5-lens prism (Reader/Editor/Artist/Designer/Ads), render 2-3 candidates as PNG, pick/blend, bake into book.typ cover block ONLY, re-render, export social crops. IP gate built in; never touches chapters. Trigger: "book cover", "ปกหนังสือ", "ทำปก", "redesign cover", "social cover".'
---

# /oracle-book-cover — beautiful, social-ready, license-clean covers

> ปกที่ "หยุด scroll ได้" + ใช้ art จริง + ปลอดภัยเรื่องลิขสิทธิ์ + **ไม่แตะเนื้อหาเล่ม**.
> Born from Book 2 *Making Hermes Actually Work* (2026-06-13) — 3 รอบกว่าจะลงตัว, codify ไว้ที่นี่.

## When to use
ออกแบบ/รื้อปกหนังสือ (typst) ให้สวย โพสต์โซเชียลได้ ล่อตาล่อใจ. **ปกอย่างเดียว** — บท/เนื้อหา/หน้านับ คงเดิม.

---

## ⚖️ Step 0 — IP & LICENSE gate (บังคับทำก่อนเสมอ)

**บทเรียนแพงสุดของ skill นี้: เช็คลิขสิทธิ์ art ก่อนใช้ ไม่ใช่หลังใช้.** ก่อนเอารูป/โลโก้/ฟอนต์ใดมาขึ้นปก:

1. **หา LICENSE ของแหล่ง art**: `find <repo> -iname 'LICENSE*' -o -iname 'NOTICE*'` + อ่าน. MIT/Apache/OFL = ใช้ได้ (มีเงื่อนไขแนบ notice). "All rights reserved" / ไม่มี license = **อย่าใช้**.
2. **ยืนยันว่า asset อยู่ในเรปจริง** (ไม่ใช่ไฟล์หลงมา): `git -C <repo> ls-files --error-unmatch <path>` + `git log --diff-filter=A -- <path>` (ใครเพิ่ม commit ไหน). **verify-before-trust** — ใช้ตัว authoritative (`ls-tree`,`cat-file -s`) อย่าฟันธงจาก check ตัวเดียวที่ flaky.
3. **Trademark/แบรนด์**: อย่าจัดสไตล์ให้เลียนแบรนด์ดัง (เช่น "Hermès" ทอง-ดำ luxury = ชน Hermès แฟชั่น). อย่าทำให้ดูเหมือนเจ้าของ art "รับรอง" หนังสือเรา. ฟรี/แจก **ไม่ยกเว้น** trademark/copyright.
4. **แนบเครดิต**: ใส่ credit line บนปก (เล็กๆ ท้าย) + copy LICENSE ของแหล่งมาไว้กับเล่ม (`CREDITS.md` + `CREDITS-<src>-<LIC>.txt`). เคารพ [[feedback_no_names_no_sources]] — ถ้าเป็น public content เลี่ยง surface แบรนด์คนอื่นเกินจำเป็น.
5. **ให้ human ตัดสินความเสี่ยง** ที่ตรวจต้นทางลึกไม่ได้ (เช่น sprite ที่ contributor ใส่มา ต้นทางไม่ชัด) — AskUserQuestion: keep+credit / drop / ทำเอง.

> ผลลัพธ์ Step 0 = รายการ art ที่ "ใช้ได้ + วิธีให้เครดิต" เท่านั้นที่ผ่านไป Step ต่อไป.

---

## Step 1 — หา art จริง (multi-modal sweep)
อย่าเดา/อย่าใช้รูป recolor จืดๆ. fan out หา art ของแบรนด์/โปรเจกต์จริง:
```javascript
// Workflow: 3 parallel Haiku — source-artwork / repo-images / provenance
// reuse: ψ/lab/2026-06-13_cover-and-session-mining/workflows/hunt-hermes-cover-art.js
```
มองหา: logo/wordmark, character/mascot (พื้นโปร่ง = วางบนดำสวย), banner, caduceus/motif. **แล้วเปิดดูจริงด้วยตา** (Read รูป) — อย่าเชื่อแค่ชื่อไฟล์.

## Step 2 — /oracle-prism 5 เลนส์ (กับ concept ปก)
| เลนส์ | ถาม |
|---|---|
| 📖 Reader | เห็นแวบเดียวรู้ไหมว่าอะไร + ทำไมต้องคว้า |
| ✏️ Editor | มี **คำเด่นคำเดียว** ไหม (อย่าให้ wordmark แข่งกันหลายตัว) |
| 🖌️ Artist | สี/คอนทราสต์ premium ไหม · negative space · motif |
| 🎨 Designer | thumbnail test (อ่านออกที่ ~150px) · 1 focal point |
| 📣 Ads | hook/badge benefit-led · scroll-stopping · มี crop 1:1+4:5 |

## Step 3 — render 2-3 candidate เป็น PNG เดี่ยวๆ (เร็ว)
อย่า build ทั้งเล่มเพื่อดูปก. compile **หน้าปกเดี่ยว** → PNG → **Read ดูจริง** → iterate:
```bash
typst compile --format png \
  --font-path /System/Library/Fonts --font-path /System/Library/Fonts/Supplemental \
  --font-path "$HOME/Library/Fonts" cover-cand.typ "cand-{p}.png"
# ถ้าออก 2 หน้า = content ล้น → ลดขนาด/ช่องไฟ จนเหลือ 1 หน้า
```

## Step 4 — เลือก/ผสม (โชว์ render จริงให้ human)
AskUserQuestion ให้ human เลือกจาก **ภาพจริง** (ไม่ใช่ ASCII). design ดีขึ้นด้วยการเทียบ. ผสม variant ได้ (luxury wordmark + brand pixel + character).

## Step 5 — bake เข้า `book.typ` (cover block เท่านั้น)
แทนเฉพาะ block `#page[...]` แรก. **ห้ามแตะ** preamble/บท/เนื้อหา. แก้ทั้ง working copy + tracked copy ให้ตรงกัน. เพิ่ม `cp <art>` ใน `render.sh` ให้รูปอยู่ข้าง `.typ` ตอน compile.

## Step 6 — re-render เต็มเล่ม + verify
```bash
bash render.sh
pdfinfo book.pdf | grep -i pages   # ต้องเท่าเดิม (body ไม่เปลี่ยน)
pdftoppm -f 1 -l 1 -png -singlefile book.pdf /tmp/cov && # Read /tmp/cov.png
git diff --name-only   # ต้องเห็นแค่ book.typ + art + pdf — ไม่มี chapter .md
```

## Step 7 — social crops (ตาม Ads lens)
export **1080×1080 (1:1)** + **1080×1350 (4:5)** จากปก สำหรับ FB/IG — asset แยก ไม่ใช่ในเล่ม.

---

## 🎨 Techniques (พิสูจน์แล้ว, reuse ได้)
| trick | how |
|---|---|
| **black & gold luxury** | พื้นดำ (`#141414`/`#000`) + ทอง (`#e8c25a`/`#f4d97a`→`#b8860b` gradient) |
| **banner bg-match** | pixel banner มีพื้นทึบ → sample สีมุม `magick img.png -format '%[hex:p{2,2}]' info:` แล้วตั้ง `#page(fill: rgb("#<hex>"))` → กล่องหาย |
| **elegant wordmark** | `#text(font:"Didot", fill: gradient.linear(...))` — ต้อง `--font-path /System/Library/Fonts/Supplemental` |
| **character on black** | รูปพื้นโปร่ง → วางบนดำได้เลย pop |
| **hook pill** | `#box(stroke: gold, radius:18pt)[🎁 แจกฟรี · N หน้า]` |
| **byline (Rule 6)** | `<Oracle> 🔮 (AI, ไม่ใช่คน) — จาก <human>` |
| **series tag** | `#place(top+right)[#box(fill:gold)[เล่ม N]]` |
| **hero layout (Book-1 style — preferred)** | NO top Didot "Hermes" text. `hermes-wordmark.png` is the hero (`width: 80-82%`); **character `hermes-char.png` enlarged + prominent** (`width: 44-48%`). `#v(1fr)` before the wordmark to center the hero cluster. See [[feedback_book_cover_layout]]. |
| **PDF filename** | publish/render output as **`NN - Title.pdf`** (`01 - Setting Up Hermes.pdf`, `02 - Making Hermes Actually Work.pdf`, `03 - Inside Hermes.pdf`) — set `render.sh`'s typst output to the prefixed name |

## กฎเหล็ก
1. **ปกอย่างเดียว** — ห้ามแตะบท/เนื้อหา/หน้านับ (verify page count เท่าเดิม)
2. **IP gate ก่อนเสมอ** (Step 0) — license-check + credit + ไม่เลียนแบรนด์
3. **eyeball ทุก render** — Read PNG จริง อย่าเชื่อว่า "น่าจะสวย"
4. **deterministic** — typst/magick ทำ ไม่ต้อง agent
5. **human gates outward** — commit/push/โพสต์ = ขออนุมัติ
6. **Rule 6** — sign ปกว่าเป็น AI

## Reusable assets (ในเรป — [[feedback_keep_code_in_repo]])
- `ψ/lab/2026-06-13_cover-and-session-mining/cover-experiments/cover-AB.typ` — ปก black-gold ตัวเต็ม
- `book/making-hermes-work/book.typ` — cover block จริงที่ ship + `CREDITS.md`
- `workflows/hunt-hermes-cover-art.js` — art finder

## Related
- `/oracle-write-complete-book`, `/oracle-write-mini-book` — เรียก skill นี้สำหรับ step ปก
- `/oracle-prism` — เลนส์รีวิว · `/fan-out` — art finder fan-out

---
🤖 Hermes Oracle — born session 1a20f7f2 ("ปกอ่านยาก ไม่อิมแพค" → black-gold + IP-clean). Resonance: Form and Formless.
