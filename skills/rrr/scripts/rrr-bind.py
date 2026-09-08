#!/usr/bin/env python3
"""Structural, correlation-only RRR runtime session binder."""
from __future__ import annotations
import datetime as dt
import json, os, re
from pathlib import Path

def parse_timestamp(value):
    if not isinstance(value, str): return None
    try: return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()
    except ValueError: return None

def json_records(text):
    malformed = 0; records = []
    for line in text.splitlines():
        if not line.strip(): continue
        try:
            record = json.loads(line)
            if isinstance(record, dict): records.append(record)
            else: malformed += 1
        except json.JSONDecodeError: malformed += 1
    return records, malformed

def claude_binding(session_id, text, path=""):
    records, malformed = json_records(text)
    matching = [r for r in records if r.get("sessionId") == session_id]
    if not matching: return {"status":"unbound","runtime":"claude","reason":"no structural sessionId match","malformed":malformed}
    roots = [r for r in matching if not r.get("isSidechain", False)]
    child = not roots or "/subagents/agent-" in path
    parent_session_id = Path(path).parents[1].name if child and "/subagents/" in path else None
    timestamps = [parse_timestamp(r.get("timestamp")) for r in matching]
    return {"status":"bound","runtime":"claude","session_id":session_id,"transcript_identity":f"claude:{session_id}","session_kind":"subagent" if child else "root","child":child,"parent_session_id":parent_session_id,"resumed":any(r.get("isResumed") for r in matching),"compacted":any(r.get("isCompactSummary") or r.get("type") in ("compacted","compaction") for r in matching),"truncated":any(r.get("truncated") for r in matching),"timestamps":[x for x in timestamps if x],"malformed":malformed,"path":path}

UUID_RE = re.compile(r"[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$", re.I)
def codex_binding(session_id, text, path=""):
    records, malformed = json_records(text)
    stem = Path(path).stem
    file_id = re.search(r"([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$", stem, re.I)
    metas = [r for r in records if r.get("type") == "session_meta" and isinstance(r.get("payload"), dict)]
    own = [r for r in metas if r["payload"].get("id") == session_id]
    if not file_id or not UUID_RE.fullmatch(session_id) or file_id.group(1).lower() != session_id.lower(): return {"status":"unbound","runtime":"codex","reason":"strict filename/session identity mismatch","malformed":malformed}
    if len(own) != 1: return {"status":"unbound","runtime":"codex","reason":"missing or ambiguous matching session_meta","malformed":malformed}
    meta = own[0]; source = meta["payload"].get("source")
    child = isinstance(source, dict) and "subagent" in source
    parent = source.get("subagent",{}).get("thread_spawn",{}).get("parent_thread_id") if child else None
    timestamps = [parse_timestamp(r.get("timestamp")) for r in records]
    return {"status":"bound","runtime":"codex","session_id":session_id,"transcript_identity":f"codex:{session_id}","session_kind":"subagent" if child else "root","child":child,"parent_session_id":parent,"cli_version":meta["payload"].get("cli_version"),"resumed":any(r.get("type") == "turn_context" and r.get("payload",{}).get("resumed") for r in records),"compacted":any(r.get("type") in ("compacted","compaction") for r in records),"truncated":any(r.get("truncated") for r in records),"timestamps":[x for x in timestamps if x],"malformed":malformed,"path":path}

def _candidate_files(runtime, session_id, home, env):
    if runtime == "claude":
        claude_root = Path(env.get("CLAUDE_CONFIG_DIR", home / ".claude"))
        yield from (claude_root / "projects").glob(f"**/{session_id}.jsonl")
    else:
        codex_root = Path(env.get("CODEX_HOME", home / ".codex"))
        yield from (codex_root / "sessions").glob(f"**/*{session_id}.jsonl")

def bind_environment(env=None, home=None):
    env = os.environ if env is None else env; home = Path.home() if home is None else Path(home)
    claude = env.get("CLAUDE_CODE_SESSION_ID")
    thread = env.get("CODEX_THREAD_ID"); session = env.get("CODEX_SESSION_ID")
    # A Claude process launched from Codex inherits CODEX_* variables. Claude sets
    # CLAUDECODE/CLAUDE_CODE_ENTRYPOINT for its own tool environment, so those markers
    # distinguish the current runtime from stale parent correlation IDs.
    claude_active = bool(claude and (env.get("CLAUDECODE") or env.get("CLAUDE_CODE_ENTRYPOINT")))
    if not claude_active and thread and session and thread != session:
        return {"status":"unbound","runtime":"codex","reason":"conflicting Codex runtime identities"}
    codex = thread or session
    if claude_active:
        codex = None
    if bool(claude) == bool(codex): return {"status":"unbound","reason":"missing or ambiguous runtime identity"}
    runtime, sid = ("claude", claude) if claude else ("codex", codex)
    if not UUID_RE.fullmatch(sid):
        return {"status":"unbound","runtime":runtime,"reason":"runtime identity is not a UUID"}
    files = list(_candidate_files(runtime, sid, home, env))
    if len(files) != 1: return {"status":"unavailable" if not files else "unbound","runtime":runtime,"reason":"no unique structurally attributable transcript"}
    try: text = files[0].read_text(errors="replace")
    except OSError: return {"status":"unavailable","runtime":runtime,"reason":"transcript unreadable"}
    return claude_binding(sid, text, str(files[0])) if runtime == "claude" else codex_binding(sid, text, str(files[0]))

if __name__ == "__main__": print(json.dumps(bind_environment(), sort_keys=True))
