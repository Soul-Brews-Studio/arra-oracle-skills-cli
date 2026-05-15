#!/usr/bin/env python3
"""Session goldminer v3 — scan Claude Code .jsonl files for session timeline.

Fixes (ported from home-comming-oracle/dig-deep.py):
- --deep now scans subagent dirs: <project>/<uuid>/subagents/*.jsonl
- --subagents alias for explicit subagent inclusion
- Proper timezone detection (MAW_DISPLAY_TZ > TZ > system > UTC)
- Coverage metadata entry appended to output when --deep is used
- toolCalls, fileSizeKB, isSubagent fields added in --deep mode
"""
import json, os, glob, sys, subprocess, re
from datetime import datetime, timedelta
from pathlib import Path

project_dirs = [d for d in os.environ.get('PROJECT_DIRS', '').split(':') if d]

# Parse flags and positional args
_raw_args = sys.argv[1:]
deep = '--deep' in _raw_args
include_subagents = '--subagents' in _raw_args
_positional = [a for a in _raw_args if not a.startswith('--')]
count = int(_positional[0]) if _positional else 10  # 0 = no limit


def detect_tz():
    """Detect local timezone offset. Priority: MAW_DISPLAY_TZ > TZ > system > UTC."""
    for var in ('MAW_DISPLAY_TZ', 'TZ'):
        val = os.environ.get(var, '')
        if val:
            try:
                return timedelta(hours=int(val)), f"GMT+{val}"
            except ValueError:
                pass
    try:
        r = subprocess.run(['date', '+%z'], capture_output=True, text=True, timeout=3)
        offset_str = r.stdout.strip()
        if offset_str and len(offset_str) >= 5:
            sign = 1 if offset_str[0] == '+' else -1
            hours = int(offset_str[1:3])
            mins = int(offset_str[3:5])
            total = sign * (hours * 60 + mins)
            label = f"GMT{offset_str[0]}{hours:02d}:{mins:02d}"
            return timedelta(minutes=total), label
    except:
        pass
    return timedelta(hours=0), "UTC"


tz_offset, tz_name = detect_tz()


def build_repo_map():
    mapping = {}
    try:
        r = subprocess.run(['ghq', 'list', '-p'], capture_output=True, text=True, timeout=5)
        for path in r.stdout.strip().split('\n'):
            if path:
                mapping[path.replace('/', '-').replace('.', '-')] = path.split('/')[-1]
    except:
        pass
    return mapping


def get_repo_name(project_dir, repo_map):
    base = os.path.basename(project_dir.rstrip('/'))
    clean = re.sub(r'-wt-\d+.*$', '', base)   # strip -wt-1, -wt-8 etc
    return repo_map.get(clean) or clean.split('-')[-1] or clean


repo_map = build_repo_map()

# ── Collect .jsonl files ──────────────────────────────────────────────────────
all_files = []   # list of (filepath, project_dir, is_subagent)
total_found = 0

for d in project_dirs:
    # Top-level sessions (always included)
    for f in glob.glob(os.path.join(d, '*.jsonl')):
        all_files.append((f, d, False))
        total_found += 1

    # Deep scan: subagent sessions inside <uuid>/subagents/
    if deep or include_subagents:
        for uuid_dir in glob.glob(os.path.join(d, '*')):
            if not os.path.isdir(uuid_dir):
                continue
            sub_dir = os.path.join(uuid_dir, 'subagents')
            if os.path.isdir(sub_dir):
                for f in glob.glob(os.path.join(sub_dir, '*.jsonl')):
                    if os.path.getsize(f) > 0:
                        all_files.append((f, d, True))
                        total_found += 1

# Deduplicate
if deep or include_subagents:
    # Deep mode: deduplicate by full path
    seen_paths = {}
    for fp, d, is_sub in all_files:
        if fp not in seen_paths:
            seen_paths[fp] = (fp, d, is_sub)
    all_unique = list(seen_paths.values())
else:
    # Standard mode: deduplicate by basename (original behaviour)
    seen_base = {}
    for f, d, is_sub in all_files:
        base = os.path.basename(f)
        if base not in seen_base or os.path.getmtime(f) > os.path.getmtime(seen_base[base][0]):
            seen_base[base] = (f, d, is_sub)
    all_unique = list(seen_base.values())

files_sorted = sorted(all_unique, key=lambda x: os.path.getmtime(x[0]), reverse=True)
if count > 0:
    files_sorted = files_sorted[:count]

# ── Load sessions-index from all dirs ─────────────────────────────────────────
index_map = {}
for d in project_dirs:
    try:
        with open(os.path.join(d, 'sessions-index.json')) as f:
            for e in json.load(f).get('entries', []):
                index_map[e['sessionId']] = e
    except:
        pass


def to_local(iso):
    try:
        dt = datetime.fromisoformat(iso.replace('Z', '+00:00'))
        return (dt + tz_offset).strftime('%Y-%m-%d %H:%M')
    except:
        return iso


# ── Parse sessions ─────────────────────────────────────────────────────────────
sessions = []
for fp, source_dir, is_subagent in files_sorted:
    sid = os.path.basename(fp).replace('.jsonl', '')
    first_ts = last_ts = None
    branch = summary_text = None
    is_sidechain = False
    real_human = []
    assistant_count = 0
    tool_calls = 0

    try:
        with open(fp) as fh:
            for line in fh:
                try:
                    obj = json.loads(line)
                except:
                    continue
                ts = obj.get('timestamp')
                if ts:
                    if not first_ts or ts < first_ts:
                        first_ts = ts
                    if not last_ts or ts > last_ts:
                        last_ts = ts
                t = obj.get('type', '')
                if t == 'summary':
                    summary_text = obj.get('summary', '')
                    branch = obj.get('gitBranch', '')
                    is_sidechain = obj.get('isSidechain', False)
                elif t == 'assistant':
                    assistant_count += 1
                    if deep or include_subagents:
                        msg = obj.get('message', {})
                        content = msg.get('content', [])
                        if isinstance(content, list):
                            for c in content:
                                if isinstance(c, dict) and c.get('type') == 'tool_use':
                                    tool_calls += 1
                elif t == 'user':
                    msg = obj.get('message', {})
                    content = msg.get('content', [])
                    text = ''
                    if isinstance(content, list):
                        for c in content:
                            if isinstance(c, dict) and c.get('type') == 'text':
                                text = c.get('text', '').strip()
                                break
                    elif isinstance(content, str):
                        text = content.strip()
                    if text and len(text) > 5 and not text.startswith('[Request interrupted'):
                        real_human.append(text[:80])
    except:
        continue

    if not first_ts:
        continue

    dur_min = 0
    if first_ts and last_ts:
        try:
            t1 = datetime.fromisoformat(first_ts.replace('Z', '+00:00'))
            t2 = datetime.fromisoformat(last_ts.replace('Z', '+00:00'))
            dur_min = int((t2 - t1).total_seconds() / 60)
        except:
            pass

    idx = index_map.get(sid, {})
    final_summary = idx.get('summary') or summary_text or (real_human[0] if real_human else 'No summary')
    final_branch = branch or idx.get('gitBranch') or 'unknown'

    entry = {
        'sessionId': sid[:12],
        'repoName': get_repo_name(source_dir, repo_map),
        'startGMT7': to_local(first_ts),
        'endGMT7': to_local(last_ts),
        'durationMin': dur_min,
        'realHumanMessages': len(real_human),
        'assistantMessages': assistant_count,
        'firstPrompt': real_human[0] if real_human else None,
        'gitBranch': final_branch,
        'summary': final_summary[:80],
        'isSidechain': is_sidechain,
    }

    # Extra fields only in deep/subagents mode
    if deep or include_subagents:
        entry['toolCalls'] = tool_calls
        entry['fileSizeKB'] = os.path.getsize(fp) // 1024
        entry['isSubagent'] = is_subagent

    sessions.append(entry)

sessions.sort(key=lambda s: s['startGMT7'])

GAP_THRESHOLD = 30  # minutes


def parse_local(s):
    try:
        return datetime.strptime(s, '%Y-%m-%d %H:%M')
    except:
        return None


with_gaps = []
for i, s in enumerate(sessions):
    if i == 0:
        with_gaps.append({"type": "gap", "label": "sleeping / offline"})
    else:
        prev_end = parse_local(sessions[i - 1]['endGMT7'])
        curr_start = parse_local(s['startGMT7'])
        if prev_end and curr_start:
            gap_min = int((curr_start - prev_end).total_seconds() / 60)
            if gap_min > GAP_THRESHOLD:
                with_gaps.append({"type": "gap", "gapMin": gap_min, "label": f"{gap_min}m gap"})
    with_gaps.append(s)
with_gaps.append({"type": "gap", "label": "no session yet"})

# Append coverage metadata when in deep/subagents mode (as a trailing sentinel entry)
if deep or include_subagents:
    with_gaps.append({
        "type": "coverage",
        "totalFound": total_found,
        "returned": len(sessions),
        "deep": deep,
        "includeSubagents": include_subagents,
        "timezone": tz_name,
        "projectDirs": len(project_dirs),
    })

print(json.dumps(with_gaps, indent=2))
