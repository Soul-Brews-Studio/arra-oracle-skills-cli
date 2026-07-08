---
name: oracle-cheatsheet
description: "Generate a copy-paste cheat sheet from the current session — commands used, traps hit, shortcuts discovered. Style: icon sections, code blocks, quick-ref tables, trap warnings. Use when user says 'cheatsheet', 'cheat sheet', 'สูตรโกง', 'รวมคำสั่ง', 'command reference', or wants a reusable command summary from what just happened."
---

# /oracle-cheatsheet — Session Command Cheat Sheet Generator

> สรุปทุกคำสั่งที่ใช้จริงใน session นี้เป็น cheat sheet — copy-paste ได้เลย ส่งให้เพื่อนได้เลย

## When to invoke

- User says "cheatsheet", "cheat sheet", "สูตรโกง", "รวมคำสั่ง", "command reference"
- หลังจบ session ยาว ๆ อยากรวมคำสั่งไว้ที่เดียว
- อยากสรุปให้เพื่อนหรือทีม

## Topic selection (สำคัญ — ไม่ต้องถาม)

**เอาจากบริบทล่าสุดที่คุยกันอยู่เลย** ไม่ต้องถาม user ว่าจะทำเรื่องอะไร เพราะ cheat sheet เป็นการรวบรวม code/command ที่ใช้จริง — มัน specific กับ context ล่าสุดอยู่แล้ว

- ถ้าเพิ่งคุยเรื่อง maw arra plugin → cheat sheet = maw arra commands
- ถ้าเพิ่งคุยเรื่อง crash recovery → cheat sheet = crash recovery commands
- ถ้าเพิ่งคุยเรื่อง deploy → cheat sheet = deploy commands
- **อ่าน conversation memory ล่าสุด** แล้วเริ่มเขียนเลย ไม่ต้อง AskUserQuestion

## Style guide (สำคัญ — นี่คือ DNA ของ skill นี้)

**ต้องเขียนแบบนี้เสมอ:**

1. **เปิดด้วย title + tagline สั้น 1 บรรทัด** (ใต้ `#`)
2. **Icon sections** — ใช้ emoji นำแต่ละหมวด: 🐾 🔧 📨 🔍 🌐 📋 🔁 ⚡ ⚠️
3. **Code blocks copy-paste ได้ทันที** — ไม่ใช่ pseudo-code, ไม่มี `<placeholder>` ที่ต้องเดา ใส่ค่าจริงจาก session
4. **ตาราง ลัด** — ท้าย sheet มีตาราง `| ทำอะไร | คำสั่ง |` สรุปสั้น ๆ
5. **trap ที่เจอจริง** — ตาราง `| trap | วิธีเลี่ยง |` จากประสบการณ์ session นี้
6. **ไม่มี prose ยาว** — ทุก section คือ heading + code + หมายเหตุสั้น 1-2 บรรทัด
7. **env/config section** — รวม env vars + config ที่ต้องตั้งไว้ที่เดียว
8. **ปิดด้วย 🤖 signature** ตาม Rule 6

## Procedure

### 1. Mine session for commands

```bash
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
ENCODED_PWD=$(echo "$ORACLE_ROOT" | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_DIR="$HOME/.claude/projects/${ENCODED_PWD}"
LATEST_JSONL=$(ls -t "$PROJECT_DIR"/*.jsonl 2>/dev/null | head -1)
```

Spawn a **Haiku subagent** (model: "haiku") with the session JSONL:

```bash
python3 - <<'PYEOF'
import json, os
jsonl = os.environ.get('LATEST_JSONL', '')
if not jsonl or not os.path.exists(jsonl): exit(0)
cmds = set()
with open(jsonl) as f:
    for line in f:
        try:
            m = json.loads(line)
            if m.get('type') != 'assistant': continue
            for block in (m.get('message', {}).get('content', []) or []):
                if isinstance(block, dict) and block.get('type') == 'tool_use':
                    if block.get('name') == 'Bash':
                        cmd = block.get('input', {}).get('command', '')
                        if cmd:
                            # extract first meaningful command
                            first = cmd.split('&&')[0].split('|')[0].strip()
                            if first and not first.startswith('#') and not first.startswith('echo'):
                                cmds.add(first[:80])
        except: pass
for c in sorted(cmds):
    print(c)
PYEOF
```

Pass the output to the subagent with this prompt:
> "Here are shell commands actually used in a Claude Code session. Group them by purpose (team management, search/query, git/PR, fleet communication, server, etc.). For each group, pick the most useful 3-5 commands. Return as markdown sections with code blocks. No prose — just heading + code + 1-line note."

### 2. Mine traps from conversation memory

Scan the conversation for:
- Error messages that led to a different approach
- Commands that were retried with different arguments
- Explicit "trap" or "gotcha" or "bug" mentions
- `⚠️` warnings given during the session

Format each as a row: `| trap description | workaround |`

### 3. Build the cheat sheet

**Path**: `ψ/writing/cheatsheets/YYYY-MM-DD_<topic>.md`

Use this exact structure (fill from session data):

```markdown
# <topic> สูตรโกง

> <1-line tagline — what this covers, from what session>

---

## 🔧 <Category 1>

### <sub-topic>

` ` `bash
<real commands from session>
` ` `

## 📨 <Category 2>

...

## ⚡ ลัด

| ทำอะไร | คำสั่ง |
|--------|--------|
| ... | `...` |

## ⚠️ trap ที่เจอจริง

| trap | วิธีเลี่ยง |
|------|-----------|
| ... | ... |

---

🤖 ตอบโดย arra-oracle-v3 จาก Nat → arra-oracle-v3-oracle
```

### 4. Customize per topic

**If the session is about a specific tool/feature** (e.g., maw arra plugin, deploy, federation):
- Focus sections on that tool's commands
- Include install/setup at the top
- Include env/config section

**If the session is broad** (many topics):
- Group by workflow phase (setup → develop → review → deploy)
- Include a "today's highlight" section at top

**If user says "for a friend" / "ให้เพื่อน"**:
- Add install/prereq section at top
- Make every code block self-contained (no context needed)
- Add "ติดตั้งครั้งเดียว" vs "ใช้ทุกวัน" separation

### 5. Announce

```bash
PSI=$(readlink -f "$ORACLE_ROOT/ψ" 2>/dev/null || echo "$ORACLE_ROOT/ψ")
mkdir -p "$PSI/writing/cheatsheets"
SHEET_FILE="$PSI/writing/cheatsheets/$(date +%Y-%m-%d)_${SLUG}.md"
echo "📋 Cheat sheet: $SHEET_FILE"
```

## Notes

- **ไม่ใช้ /kien-thai** — cheat sheet เป็น code-heavy reference ไม่ใช่ prose
- **ภาษาผสม ไทย+อังกฤษ** — heading ไทย, code อังกฤษ, หมายเหตุสั้นไทย
- **ไม่ recap** — ไม่มี "สรุป" ท้ายไฟล์ จบที่ trap table
- **ค่าจริงจาก session** — ใส่ repo name, issue number, port, path จริง ไม่ใช่ generic
- **Reuse**: cheat sheet ที่เขียนแล้วอยู่ใน `ψ/writing/cheatsheets/` — ถ้ามีอยู่แล้วให้ **append/update** ไม่ใช่เขียนใหม่ทั้งหมด
