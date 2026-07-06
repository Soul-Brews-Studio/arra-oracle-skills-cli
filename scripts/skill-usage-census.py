#!/usr/bin/env python3
"""
skill-usage-census.py — count Oracle skill invocations across all Claude Code
session transcripts under ~/.claude/projects/*/*.jsonl.

Detects two kinds of invocation, structurally (not raw grep) to avoid
false positives from pasted documentation / tool_result echoes:

  a) USER-TYPED : a `user`-type line whose message.content is a *string*
     matching a pure `<command-name>/NAME</command-name>` envelope
     (optionally alongside <command-message>/<command-args> tags and
     nothing else). Counted once per message/line.

  b) AGENT-INVOKED : an `assistant`-type line whose message.content list
     contains a dict block {"type": "tool_use", "name": "Skill",
     "input": {"skill": "NAME", ...}}. Each block counts as one invocation.

Why structural, not grep: tool_result blocks (e.g. a Bash/Read output that
happens to contain the literal text "<command-name>..." or "name": "Skill")
live inside `user`-type list-content blocks of type "tool_result", or inside
assistant "text" blocks — never as top-level tool_use / bare command-name
string content. Parsing JSON and checking field structure filters these out
without any heuristic guessing. Verified empirically: raw substring grep for
<command-name> across a 14-skill sample matched 889 lines, of which exactly
106 were tool_result echoes (list-content) — all correctly excluded by the
type=='user' and isinstance(content, str) structural check, with 0 of the
remaining 782 failing a stricter "pure envelope, no extra text" check.

Usage:
  ./skill-usage-census.py                          # all skills found, markdown table
  ./skill-usage-census.py --skills recap,dig,trace  # only these
  ./skill-usage-census.py --json                    # full JSON dump incl. monthly histogram
"""

import argparse
import glob
import json
import os
import re
import sys
from collections import defaultdict

HOME = os.path.expanduser("~")
DEFAULT_GLOB = os.path.join(HOME, ".claude", "projects", "*", "*.jsonl")

# Pure envelope tags emitted by Claude Code for a real slash-command invocation.
COMMAND_NAME_RE = re.compile(r"<command-name>/([A-Za-z0-9_.\-]+)</command-name>")
_ENVELOPE_STRIP_RES = [
    re.compile(r"<command-message>.*?</command-message>", re.DOTALL),
    re.compile(r"<command-name>.*?</command-name>", re.DOTALL),
    re.compile(r"<command-args>.*?</command-args>", re.DOTALL),
    re.compile(r"<local-command-stdout>.*?</local-command-stdout>", re.DOTALL),
]


def extract_user_typed_skill(content):
    """Return skill name(s) (set) if `content` is a pure command envelope string."""
    if not isinstance(content, str):
        return None
    names = set(m.group(1) for m in COMMAND_NAME_RE.finditer(content))
    if not names:
        return None
    # Strict check: after stripping the known envelope tags, nothing else remains.
    rest = content
    for pat in _ENVELOPE_STRIP_RES:
        rest = pat.sub("", rest)
    if rest.strip():
        return None
    return names


def extract_agent_invoked_skills(content):
    """Return list of skill names invoked via the Skill tool in an assistant message."""
    out = []
    if not isinstance(content, list):
        return out
    for block in content:
        if (
            isinstance(block, dict)
            and block.get("type") == "tool_use"
            and block.get("name") == "Skill"
        ):
            inp = block.get("input")
            if isinstance(inp, dict):
                skill = inp.get("skill")
                if isinstance(skill, str) and skill:
                    out.append(skill)
    return out


class SkillStats:
    __slots__ = ("user_count", "agent_count", "last_used", "monthly")

    def __init__(self):
        self.user_count = 0
        self.agent_count = 0
        self.last_used = ""  # ISO timestamp string; lexicographic max == chronological max
        self.monthly = defaultdict(int)

    @property
    def total(self):
        return self.user_count + self.agent_count

    def note_timestamp(self, ts):
        if ts and ts > self.last_used:
            self.last_used = ts
        if ts and len(ts) >= 7:
            self.monthly[ts[:7]] += 1


def run_census(file_glob=DEFAULT_GLOB, skill_filter=None):
    stats = defaultdict(SkillStats)
    files = sorted(glob.glob(file_glob))

    files_scanned = 0
    lines_scanned = 0
    lines_malformed = 0
    lines_json_parsed = 0
    lines_deduped = 0

    # Claude Code re-parents a session's project directory when a repo is
    # renamed/moved: the *same* sessionId/message uuid then lives on under two
    # (or more) different ~/.claude/projects/<encoded-path>/ directories, with
    # divergent tails appended after the rename point. Naively summing over
    # every top-level file double-counts every message dated before the
    # rename. Dedup globally on each line's own "uuid" field (unique per
    # message, stable across the copies) so each real message is counted once
    # no matter how many project directories its session file was copied into.
    seen_uuids = set()

    for path in files:
        files_scanned += 1
        try:
            with open(path, "r", errors="ignore") as f:
                for line in f:
                    lines_scanned += 1
                    if not line.strip():
                        continue

                    # Cheap pre-filter: only lines that could possibly match either
                    # detection path get the (relatively) expensive json.loads call.
                    has_cmd_marker = "<command-name>" in line
                    has_skill_marker = '"Skill"' in line
                    if not has_cmd_marker and not has_skill_marker:
                        continue

                    try:
                        obj = json.loads(line)
                    except Exception:
                        lines_malformed += 1
                        continue
                    lines_json_parsed += 1

                    line_uuid = obj.get("uuid")
                    if line_uuid is not None:
                        if line_uuid in seen_uuids:
                            lines_deduped += 1
                            continue
                        seen_uuids.add(line_uuid)

                    ts = obj.get("timestamp", "")
                    obj_type = obj.get("type")
                    message = obj.get("message")
                    if not isinstance(message, dict):
                        continue
                    content = message.get("content")

                    if has_cmd_marker and obj_type == "user":
                        names = extract_user_typed_skill(content)
                        if names:
                            for name in names:
                                if skill_filter is not None and name not in skill_filter:
                                    continue
                                st = stats[name]
                                st.user_count += 1
                                st.note_timestamp(ts)

                    if has_skill_marker and obj_type == "assistant":
                        for name in extract_agent_invoked_skills(content):
                            if skill_filter is not None and name not in skill_filter:
                                continue
                            st = stats[name]
                            st.agent_count += 1
                            st.note_timestamp(ts)
        except (IsADirectoryError, PermissionError, OSError):
            continue

    meta = {
        "files_scanned": files_scanned,
        "lines_scanned": lines_scanned,
        "lines_json_parsed": lines_json_parsed,
        "lines_malformed": lines_malformed,
        "lines_deduped_cross_file": lines_deduped,
    }
    return stats, meta


def render_markdown(stats, meta, skill_filter):
    names = list(skill_filter) if skill_filter is not None else list(stats.keys())
    rows = []
    for name in names:
        st = stats.get(name, SkillStats())
        rows.append((name, st.user_count, st.agent_count, st.total, st.last_used[:10] if st.last_used else "-"))
    rows.sort(key=lambda r: r[3], reverse=True)

    lines = []
    lines.append("| Skill | User | Agent | Total | Last used |")
    lines.append("|---|---:|---:|---:|---|")
    for name, u, a, t, last in rows:
        lines.append(f"| {name} | {u} | {a} | {t} | {last} |")
    lines.append("")
    lines.append(
        f"_Scanned {meta['files_scanned']} files, {meta['lines_scanned']} lines "
        f"({meta['lines_json_parsed']} JSON-parsed, {meta['lines_malformed']} malformed, "
        f"{meta['lines_deduped_cross_file']} cross-file duplicate messages skipped)._"
    )
    return "\n".join(lines)


def render_json(stats, meta, skill_filter):
    names = list(skill_filter) if skill_filter is not None else list(stats.keys())
    out = {"meta": meta, "skills": {}}
    for name in names:
        st = stats.get(name, SkillStats())
        out["skills"][name] = {
            "user_count": st.user_count,
            "agent_count": st.agent_count,
            "total": st.total,
            "last_used": st.last_used,
            "monthly": dict(sorted(st.monthly.items())),
        }
    return json.dumps(out, indent=2, ensure_ascii=False)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--skills", type=str, default=None, help="comma-separated skill names to count (default: all found)")
    ap.add_argument("--json", action="store_true", help="output JSON instead of markdown table")
    ap.add_argument("--glob", type=str, default=DEFAULT_GLOB, help="override the jsonl glob pattern")
    args = ap.parse_args()

    skill_filter = None
    if args.skills:
        skill_filter = set(s.strip() for s in args.skills.split(",") if s.strip())

    stats, meta = run_census(file_glob=args.glob, skill_filter=skill_filter)

    if args.json:
        print(render_json(stats, meta, skill_filter))
    else:
        print(render_markdown(stats, meta, skill_filter))


if __name__ == "__main__":
    main()
