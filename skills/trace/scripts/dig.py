#!/usr/bin/env python3
"""Session goldminer — scan Claude Code .jsonl files for session timeline."""
import json, os, glob, sys, subprocess, re, time
from datetime import datetime, timedelta, timezone

project_dirs = [d for d in os.environ.get('PROJECT_DIRS', '').split(':') if d]
count = int(sys.argv[1]) if len(sys.argv) > 1 else 10

# Auto-detect local timezone offset (works on any machine)
local_offset = timedelta(seconds=-time.timezone if time.daylight == 0 else -time.altzone)
local_tz = timezone(local_offset)

def build_repo_map():
    mapping = {}
    try:
        r = subprocess.run(['ghq', 'list', '-p'], capture_output=True, text=True, timeout=5)
        for path in r.stdout.strip().split('\n'):
            if path:
                mapping[path.replace('/', '-')] = path.split('/')[-1]
    except: pass
    return mapping

def get_repo_name(project_dir, repo_map):
    base = os.path.basename(project_dir.rstrip('/'))
    clean = re.sub(r'-wt-\d+$', '', base)   # strip -wt-1, -wt-8 etc
    return repo_map.get(clean) or clean.split('-')[-1] or clean

repo_map = build_repo_map()

# Get .jsonl files across all project dirs, deduplicate by basename, take N most recent
seen = {}
for d in project_dirs:
    for f in glob.glob(os.path.join(d, '*.jsonl')):
        base = os.path.basename(f)
        if base not in seen or os.path.getmtime(f) > os.path.getmtime(seen[base][0]):
            seen[base] = (f, d)   # store (filepath, project_dir) tuple
all_files = [(fp, d) for fp, d in seen.values()]
files = sorted(all_files, key=lambda x: os.path.getmtime(x[0]), reverse=True)[:count]

# Load sessions-index from all dirs
index_map = {}
for d in project_dirs:
    try:
        with open(os.path.join(d, 'sessions-index.json')) as f:
            for e in json.load(f).get('entries', []):
                index_map[e['sessionId']] = e
    except: pass

sessions = []
for fp, source_dir in files:
    sid = os.path.basename(fp).replace('.jsonl', '')
    first_ts = last_ts = None
    branch = summary_text = None
    is_sidechain = False
    real_human = []
    assistant_count = 0

    with open(fp) as fh:
        for line in fh:
            try: obj = json.loads(line)
            except: continue
            ts = obj.get('timestamp')
            if ts:
                if not first_ts or ts < first_ts: first_ts = ts
                if not last_ts or ts > last_ts: last_ts = ts
            t = obj.get('type', '')
            if t == 'summary':
                summary_text = obj.get('summary', '')
                branch = obj.get('gitBranch', '')
                is_sidechain = obj.get('isSidechain', False)
            elif t == 'assistant':
                assistant_count += 1
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

    if not first_ts: continue

    # Convert timestamps to local timezone
    def to_local(iso):
        try:
            dt = datetime.fromisoformat(iso.replace('Z', '+00:00'))
            return dt.astimezone(local_tz).strftime('%Y-%m-%d %H:%M')
        except: return iso

    dur_min = 0
    if first_ts and last_ts:
        try:
            t1 = datetime.fromisoformat(first_ts.replace('Z', '+00:00'))
            t2 = datetime.fromisoformat(last_ts.replace('Z', '+00:00'))
            dur_min = int((t2 - t1).total_seconds() / 60)
        except: pass

    # Prefer index summary over first prompt
    idx = index_map.get(sid, {})
    final_summary = idx.get('summary') or summary_text or (real_human[0] if real_human else 'No summary')
    final_branch = branch or idx.get('gitBranch') or 'unknown'

    sessions.append({
        'sessionId': sid[:12],
        'repoName': get_repo_name(source_dir, repo_map),
        'startLocal': to_local(first_ts),
        'endLocal': to_local(last_ts),
        'durationMin': dur_min,
        'realHumanMessages': len(real_human),
        'assistantMessages': assistant_count,
        'firstPrompt': real_human[0] if real_human else None,
        'gitBranch': final_branch,
        'summary': final_summary[:80],
        'isSidechain': is_sidechain,
    })

sessions.sort(key=lambda s: s['startLocal'])  # chronological (oldest first)

GAP_THRESHOLD = 30  # minutes

def parse_local(s):
    try: return datetime.strptime(s, '%Y-%m-%d %H:%M')
    except: return None

with_gaps = []
for i, s in enumerate(sessions):
    if i == 0:
        with_gaps.append({"type": "gap", "label": "sleeping / offline"})
    else:
        prev_end = parse_local(sessions[i-1]['endLocal'])
        curr_start = parse_local(s['startLocal'])
        if prev_end and curr_start:
            gap_min = int((curr_start - prev_end).total_seconds() / 60)
            if gap_min > GAP_THRESHOLD:
                with_gaps.append({"type": "gap", "gapMin": gap_min, "label": f"{gap_min}m gap"})
    with_gaps.append(s)
with_gaps.append({"type": "gap", "label": "no session yet"})

print(json.dumps(with_gaps, indent=2))
