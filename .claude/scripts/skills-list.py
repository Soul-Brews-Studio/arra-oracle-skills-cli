#!/usr/bin/env python3
"""List all skills with profile tier, type, and script status.
Usage: python3 skills-list.py [--json]
"""
import os, re, sys, json

# Find repo root — try multiple paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
profiles_path = None
skills_dir = None

for candidate in [
    os.path.join(SCRIPT_DIR, '..', '..'),           # .claude/scripts → repo root
    os.path.join(SCRIPT_DIR, '..', '..', '..'),      # src/skills/X/scripts → repo root
    os.path.join(SCRIPT_DIR, '..', '..'),             # src/skills/X → repo/src
    os.getcwd(),                                       # current directory
]:
    p = os.path.join(candidate, 'src', 'profiles.ts')
    s = os.path.join(candidate, 'src', 'skills')
    if os.path.exists(p) and os.path.isdir(s):
        profiles_path = p
        skills_dir = s
        break

if not profiles_path:
    # Fallback: scan installed skills
    skills_dir = os.path.expanduser('~/.claude/skills')
    profiles_path = None

# Read profile constants from profiles.ts
std_skills = []
lab_skills = []
zombie_skills = []
if profiles_path and os.path.exists(profiles_path):
    with open(profiles_path) as f:
        content = f.read()
    std_match = re.search(r'STANDARD_SKILLS = \[(.*?)\]', content, re.DOTALL)
    if std_match:
        std_skills = re.findall(r"'([^']+)'", std_match.group(1))
    lab_match = re.search(r'LAB_SKILLS = \[(.*?)\]', content, re.DOTALL)
    if lab_match:
        lab_skills = re.findall(r"'([^']+)'", lab_match.group(1))
    zombie_match = re.search(r'ZOMBIE_SKILLS = \[(.*?)\]', content, re.DOTALL)
    if zombie_match:
        zombie_skills = re.findall(r"'([^']+)'", zombie_match.group(1))

std_set = set(std_skills)
lab_set = set(lab_skills)
zombie_set = set(zombie_skills)

# Discover all skills
all_skills = []
if os.path.isdir(skills_dir):
    for name in sorted(os.listdir(skills_dir)):
        skill_dir = os.path.join(skills_dir, name)
        if not os.path.isdir(skill_dir) or name.startswith('.'):
            continue

        skill_md = os.path.join(skill_dir, 'SKILL.md')
        if not os.path.exists(skill_md):
            continue

        desc = ''
        skill_type = 'skill'
        hidden = False

        if True:
            with open(skill_md) as f:
                content = f.read()
            # Extract description
            m = re.search(r'description:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
            if m:
                desc = m.group(1).strip("'\"")[:60]
            # Detect type
            if 'subagent' in content.lower() or 'Agent(' in content:
                skill_type = 'skill+agent'
            if os.path.isdir(os.path.join(skill_dir, 'scripts')):
                skill_type = 'skill+code'
            # Hidden?
            if re.search(r'hidden:\s*(true|yes)', content, re.IGNORECASE):
                hidden = True

        # Zombie?
        zombie = False
        if re.search(r'zombie:\s*(true|yes)', content if os.path.exists(skill_md) else '', re.IGNORECASE):
            zombie = True

        # Profile tier
        if name in zombie_set or zombie:
            profile = 'zombie'
        elif name in std_set:
            profile = 'standard'
        elif name in lab_set:
            profile = 'lab'
        else:
            profile = 'full'

        all_skills.append({
            'name': name,
            'profile': profile,
            'type': skill_type,
            'description': desc,
            'hidden': hidden,
            'zombie': zombie,
            'has_scripts': os.path.isdir(os.path.join(skill_dir, 'scripts')),
        })

# Output
visible_skills = [s for s in all_skills if s['profile'] != 'zombie']
zombie_only = [s for s in all_skills if s['profile'] == 'zombie']

if '--json' in sys.argv:
    print(json.dumps({
        'total': len(all_skills),
        'visible': len(visible_skills),
        'standard': len(std_skills),
        'full': len(visible_skills) - len(lab_skills),
        'lab': len(visible_skills),
        'zombie': len(zombie_only),
        'skills': all_skills,
    }, indent=2))
else:
    full_only = [s for s in all_skills if s['profile'] == 'full']
    lab_only = [s for s in all_skills if s['profile'] == 'lab']
    std_only = [s for s in all_skills if s['profile'] == 'standard']

    print()
    print(f'📦 Oracle Skills — {len(visible_skills)} skills ({len(zombie_only)} zombie)')
    print()

    # Standard
    print(f'  ── Standard ({len(std_only)}) ── /go standard ──────────────────────')
    for s in std_only:
        scripts = ' ✓' if s['has_scripts'] else ''
        print(f"     /{s['name']:24s} {s['type']:12s}{scripts}")

    # Full
    print()
    print(f'  ── Full (+{len(full_only)}) ── /go full ─────────────────────────')
    for s in full_only:
        scripts = ' ✓' if s['has_scripts'] else ''
        hidden = ' [hidden]' if s['hidden'] else ''
        print(f"     /{s['name']:24s} {s['type']:12s}{scripts}{hidden}")

    # Lab
    print()
    print(f'  ── Lab (+{len(lab_only)}) ── /go lab ──────────────────────────')
    for s in lab_only:
        scripts = ' ✓' if s['has_scripts'] else ''
        print(f"     /{s['name']:24s} {s['type']:12s}{scripts}")

    # Zombie (only show with --zombie flag)
    if '--zombie' in sys.argv and zombie_only:
        print()
        print(f'  ── Zombie ({len(zombie_only)}) ── internal only ───────────────────')
        for s in zombie_only:
            scripts = ' ✓' if s['has_scripts'] else ''
            print(f"     /{s['name']:24s} {s['type']:12s}{scripts} [zombie]")
    elif zombie_only:
        print()
        print(f'  + {len(zombie_only)} zombie skills (internal dev — use --zombie to show)')

    print()
    print(f'  standard={len(std_only)} | full={len(std_only)+len(full_only)} | lab={len(visible_skills)} | zombie={len(zombie_only)}')
    print()
