---
name: go
description: 'Switch skill profiles. Profiles: standard (16), full (all), lab (experimental). Use when user says "go", "go standard", "go full", "go lab", "switch profile", "enable skills", "disable skills".'
argument-hint: "<standard|full|lab> | enable|disable <skill...>"
---

# /go

> Switch gear. Single source of truth.

## Usage

```
/go                     # show installed skills
/go standard            # switch to standard profile (16 skills)
/go full                # enable everything
/go lab                 # full + experimental skills
/go enable trace dig    # enable specific skills
/go disable watch       # disable specific skills
```

---

## Execution

Parse the user's `/go` arguments and run the matching `arra-oracle-skills` CLI command.

### `/go` (no args) — show current state

```bash
arra-oracle-skills list -g
```

### `/go <profile>` — switch profile

```bash
arra-oracle-skills install -g --profile <name> -y
```

Profiles: `standard`, `full`, `lab`

- `/go standard` → `arra-oracle-skills install -g --profile standard -y`
- `/go full` → `arra-oracle-skills install -g --profile full -y`
- `/go lab` → `arra-oracle-skills install -g --profile lab -y`

### `/go enable <skill...>` — enable specific skills

```bash
arra-oracle-skills install -g -s <skill...> -y
```

- `/go enable trace dig` → `arra-oracle-skills install -g -s trace dig -y`

### `/go disable <skill...>` — disable specific skills

```bash
arra-oracle-skills uninstall -g -s <skill...> -y
```

- `/go disable watch` → `arra-oracle-skills uninstall -g -s watch -y`

---

## Available Profiles

| Profile | Count | Description |
|---------|-------|-------------|
| **standard** | 16 | Daily driver — essential Oracle skills (default) |
| **full** | all | Everything |
| **lab** | all+ | Full + experimental / bleeding edge |

---

## Rules

1. **Always `-g`** — global (user-level) skills
2. **Always `-y`** — skip confirmation
3. **Restart required** — agent loads skills at session start
4. **`go` is always preserved** — it's in every profile
5. **Show result** — after running the command, tell the user what changed and remind them to restart

---

ARGUMENTS: $ARGUMENTS
