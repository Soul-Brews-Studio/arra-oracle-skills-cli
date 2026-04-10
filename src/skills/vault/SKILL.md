---
name: vault
description: Connect external knowledge bases (Obsidian, Logseq, markdown folders) to Oracle. Use when user says "vault", "connect vault", "obsidian", "knowledge base", "search notes", or wants to link external note systems to Oracle context.
argument-hint: "[connect <path> | disconnect <name> | search <query> | list]"
hidden: true
---

# /vault - External Knowledge Connection

> "AI จะเก่งกับเราจริง ก็ต่อเมื่อมันได้เข้าถึงความรู้ของเรา"

Connect external knowledge bases so Oracle can think from ALL your accumulated knowledge, not just the current repo.

## Usage

```
/vault                                    # list connected vaults
/vault list                               # same
/vault connect ~/obsidian-vault           # register a vault
/vault connect ~/notes --name "personal"  # with label
/vault disconnect personal                # remove
/vault search "topic"                     # search across all vaults
/vault search "topic" --vault personal    # search specific vault
```

## Registry: `ψ/vault.json`

```json
{
  "vaults": [
    { "name": "obsidian", "path": "~/Documents/obsidian-vault", "type": "obsidian" },
    { "name": "notes", "path": "~/notes", "type": "markdown" }
  ],
  "updated": "2026-04-10T12:00:00Z"
}
```

---

## Mode 1: List (default)

Read `ψ/vault.json`. Display connected vaults:

```
📚 Connected Vaults (2)

  #  Name        Type       Path                          Files
  ── ─────────── ────────── ───────────────────────────── ──────
  1  obsidian    obsidian   ~/Documents/obsidian-vault    1,234
  2  notes       markdown   ~/notes                       89

  /vault connect <path>    — add a new vault
  /vault search "topic"    — search across all
```

If no vaults connected:
```
📚 No vaults connected.

  /vault connect ~/path/to/notes    — connect your first vault
```

## Mode 2: Connect

### `/vault connect <path> [--name <label>]`

1. Verify path exists and is a directory
2. Auto-detect vault type:

| Type | Detection | Special handling |
|------|-----------|-----------------|
| `obsidian` | Has `.obsidian/` dir | Parse `[[wikilinks]]`, respect `.obsidian/app.json` |
| `logseq` | Has `logseq/` dir | Parse `((block refs))` |
| `markdown` | Default | Plain .md files |
| `notion` | Has Notion export structure | Handle nested folders |

3. Count .md files: `find <path> -name "*.md" | wc -l`
4. Auto-generate name from directory basename if `--name` not given
5. Save to `ψ/vault.json`

```
📚 Connected: obsidian (1,234 files)
   Path: ~/Documents/obsidian-vault
   Type: obsidian (auto-detected)
```

### Validation

- Path must exist and be readable
- Warn if path is inside current repo (use ψ/ instead)
- Warn if >10,000 files (large vault — search may be slow)

## Mode 3: Disconnect

### `/vault disconnect <name>`

Remove from `ψ/vault.json` with confirmation:

```
Remove vault "obsidian" (~/Documents/obsidian-vault)?
  (Only removes the connection — your files are untouched)
  [Y/n]
```

## Mode 4: Search

### `/vault search "topic" [--vault <name>]`

Search across all connected vaults (or a specific one):

```bash
# Search all vaults
for vault in $(cat ψ/vault.json | jq -r '.vaults[].path'); do
  grep -rl --include="*.md" "topic" "$vault" 2>/dev/null
done
```

Display results grouped by vault:

```
📚 Search: "oracle" across 2 vaults

  obsidian (3 matches):
    ~/obsidian/projects/oracle-notes.md (5 mentions)
    ~/obsidian/daily/2026-03-15.md (2 mentions)
    ~/obsidian/ideas/ai-collaboration.md (1 mention)

  notes (1 match):
    ~/notes/oracle-setup.md (3 mentions)

  💡 Read a file: just ask me to read any of these paths
```

### Context reading

After search, if user asks about a result, read the file directly:

```bash
# Read matched file for context
cat ~/obsidian/projects/oracle-notes.md
```

## Integration with Other Skills

| Skill | How vault helps |
|-------|----------------|
| `/trace --deep` | Include vault search results alongside ψ/ and git |
| `/learn` | Output study notes to a vault |
| `/recap` | Pull from vault's daily notes for context |
| `/rrr` | Reference vault learnings in retrospectives |

When these skills search for context, they should check `ψ/vault.json` and include vault paths in their search scope.

---

## Rules

- Never modify vault files without explicit user permission
- Vault paths are stored as-is (with `~`) — expand at search time
- Connection is one-way: Oracle reads from vaults, doesn't write to them (unless user asks)
- `ψ/vault.json` is committable — shared across sessions

ARGUMENTS: $ARGUMENTS
