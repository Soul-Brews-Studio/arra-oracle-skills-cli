---
name: project-manager
description: Manage project lifecycle - learn, incubate, spinoff, reunion, offload, history. Use ghq + symlinks.
---

# Project Manager Skill

Complete project lifecycle management with 8 commands.

## Slug Format (Mixed Lookup)

Supports both formats:
- **Full**: `owner/repo` (priority) — e.g., `thedotmack/claude-mem`
- **Short**: `repo-name` (fallback) — e.g., `claude-mem`

```yaml
# ψ/memory/slugs.yaml
thedotmack/claude-mem: ~/Code/github.com/thedotmack/claude-mem
laris-co/arra-oracle-v3: ~/Code/github.com/laris-co/arra-oracle-v3
```

## Commands

| Command | Action | Script |
|---------|--------|--------|
| `/project search [query]` | Search repos (local→remote) | `scripts/search.sh` |
| `/project learn [url\|slug]` | Read-only study | `scripts/learn.sh` |
| `/project incubate [name]` | Work (auto-create if needed) | `scripts/incubate.sh` |
| `/project spinoff [name]` | Graduate to own repo | `scripts/spinoff.sh` |
| `/project reunion [slug\|all]` | Sync learnings + offload | `scripts/reunion.sh` |
| `/project offload [slug\|all]` | Remove symlinks (keep ghq) | `scripts/offload.sh` |
| `/project index [slug\|all]` | Index manifests to Oracle | `scripts/index.sh` |
| `/project history [slug]` | Git timeline analysis | `scripts/history.sh` |

## Lifecycle

```
/project search    → 🔍 Search repos (local ghq first, then GitHub API)
/project learn     → 📚 Study external repo (ψ/learn/)
/project incubate  → 🌱 Work on project (ψ/incubate/, auto-create if needed)
/project spinoff   → 🎓 Graduate to own repo
/project reunion   → 🤝 Sync learnings + offload
/project offload   → 📤 Just remove symlinks
/project index     → 🔮 Index manifests to Oracle
/project history   → 📊 Git activity analysis
```

## Limits

| Type | Max | Reason |
|------|-----|--------|
| **Incubate** | 5 | Cognitive load — focus over quantity |
| Learn | No limit | Read-only, low overhead |

**Before incubating new project**: Check count, offload if > 5.

## Quick Reference

### Search (find repos)
```bash
.claude/skills/project-manager/scripts/search.sh voice           # local first
.claude/skills/project-manager/scripts/search.sh voice --remote  # force GitHub API
.claude/skills/project-manager/scripts/search.sh --list-orgs     # show all orgs
```

### Learn (read-only)
```bash
.claude/skills/project-manager/scripts/learn.sh thedotmack/claude-mem
.claude/skills/project-manager/scripts/learn.sh claude-mem  # short slug
```

### Incubate (work, auto-create)
```bash
.claude/skills/project-manager/scripts/incubate.sh <name> [--org laris-co]
```

### Spinoff (graduate)
```bash
.claude/skills/project-manager/scripts/spinoff.sh <slug> <target-org/repo>
```

### Reunion (sync + offload)
```bash
.claude/skills/project-manager/scripts/reunion.sh thedotmack/claude-mem
.claude/skills/project-manager/scripts/reunion.sh claude-mem    # short slug
.claude/skills/project-manager/scripts/reunion.sh all           # all loaded
.claude/skills/project-manager/scripts/reunion.sh all --keep    # keep loaded
```

### Offload (remove symlinks)
```bash
.claude/skills/project-manager/scripts/offload.sh laris-co/arra-oracle-v3
.claude/skills/project-manager/scripts/offload.sh arra-oracle-v3  # short slug
.claude/skills/project-manager/scripts/offload.sh all        # clean slate
```

### Index (Oracle)
```bash
.claude/skills/project-manager/scripts/index.sh list              # show manifests
.claude/skills/project-manager/scripts/index.sh all               # index all
.claude/skills/project-manager/scripts/index.sh thedotmack/claude-mem  # specific
.claude/skills/project-manager/scripts/index.sh all --dry-run     # preview
```

### History (git analysis)
```bash
.claude/skills/project-manager/scripts/history.sh thedotmack/claude-mem
.claude/skills/project-manager/scripts/history.sh claude-mem --since="1 year ago"
```

## Reunion Pattern

1. **Connect** → `ghq get -u` (sync via ghq, not git pull)
2. **Scan** → Find `ψ/memory/*.md`, `learnings/`, `retrospectives/`, `docs/`
3. **Manifest** → Write to `ψ/memory/logs/index-YYYY-MM-DD-slug.json`
4. **Log** → Write to `ψ/memory/logs/reunion-YYYY-MM-DD.log`
5. **Offload** → Remove symlink (unless `--keep`)

## Index Pattern

1. **Read** → Load manifest JSON files
2. **Score** → Rank files by type (retrospectives=10, docs=5, CLAUDE.md=0)
3. **Filter** → Skip i18n, CLAUDE.md, low-value files
4. **Extract** → Get key content from high-value files
5. **Learn** → Write to `ψ/memory/learnings/` (two-layer pattern: learning file + auto-memory)

## Offload Pattern

- Remove symlink only (ghq keeps repo)
- Log to `ψ/memory/logs/offload-YYYY-MM-DD.log`
- Can restore: `/project learn [slug]` or `/project incubate [slug]`

## Files

- `scripts/search.sh` - Search repos (local ghq → GitHub API)
- `scripts/resolve-slug.sh` - Shared slug resolution (owner/repo + short)
- `scripts/learn.sh` - Clone + symlink to ψ/learn/
- `scripts/incubate.sh` - Clone (or create) + symlink to ψ/incubate/
- `scripts/spinoff.sh` - Move to external repo
- `scripts/reunion.sh` - Sync learnings + optional offload
- `scripts/offload.sh` - Remove symlinks, keep ghq
- `scripts/index.sh` - Index manifests to Oracle
- `scripts/history.sh` - Git activity analysis
- `templates/slugs.yaml` - Registry template
