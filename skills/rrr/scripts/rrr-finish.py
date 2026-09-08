#!/usr/bin/env python3
"""Read-only Git finish preflight. There is deliberately no execute mode."""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlsplit, urlunsplit

GIT_LOCAL_ENV_VARS = {
    "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_CONFIG", "GIT_CONFIG_PARAMETERS",
    "GIT_CONFIG_COUNT", "GIT_OBJECT_DIRECTORY", "GIT_DIR", "GIT_WORK_TREE",
    "GIT_IMPLICIT_WORK_TREE", "GIT_GRAFT_FILE", "GIT_INDEX_FILE",
    "GIT_NO_REPLACE_OBJECTS", "GIT_REPLACE_REF_BASE", "GIT_PREFIX",
    "GIT_SHALLOW_FILE", "GIT_COMMON_DIR",
}


def _run(repo: str, *arguments: str) -> tuple[int, str]:
    environment = {**os.environ, "GIT_OPTIONAL_LOCKS": "0"}
    # A caller may itself be running inside a Git hook. Repository-local Git
    # variables inherited from that hook override `git -C repo` and can make a
    # preview inspect (or tests mutate) the caller's repository instead.
    for name in GIT_LOCAL_ENV_VARS:
        environment.pop(name, None)
    process = subprocess.run(
        ["git", "-C", repo, *arguments],
        text=True,
        capture_output=True,
        env=environment,
    )
    return process.returncode, process.stdout.strip() if process.returncode == 0 else process.stderr.strip()


def _safe_url(value: str) -> str:
    """Keep destination identity while removing embedded transport credentials."""
    if not value:
        return value
    if "://" in value:
        parsed = urlsplit(value)
        host = parsed.hostname or ""
        if parsed.port:
            host += f":{parsed.port}"
        netloc = f"[redacted]@{host}" if parsed.username or parsed.password else host
        query = "[redacted]" if parsed.query else ""
        fragment = "[redacted]" if parsed.fragment else ""
        return urlunsplit((parsed.scheme, netloc, parsed.path, query, fragment))
    return re.sub(r"^[^/@:]+@([^:]+):", r"[redacted]@\1:", value)


def _names(payload: str) -> list[str]:
    names: list[str] = []
    for line in payload.splitlines():
        if not line:
            continue
        parts = line.split("\t")
        names.extend(parts[1:] if len(parts) > 1 else parts)
    return sorted(set(names))


def _symlink_component(repo: Path, relative: str) -> bool:
    candidate = Path(relative)
    if candidate.is_absolute() or ".." in candidate.parts:
        return True
    current = repo
    for part in candidate.parts:
        current = current / part
        if current.is_symlink():
            return True
    return False


def preview(
    repo: str = ".",
    baseline: str | None = None,
    task_branch: str | None = None,
    paths: Iterable[str] = (),
    initial_index: Iterable[str] = (),
) -> dict[str, Any]:
    refusals: list[str] = []
    code, root_text = _run(repo, "rev-parse", "--show-toplevel")
    output: dict[str, Any] = {"read_only": True, "refusals": refusals}
    if code:
        refusals.append("not a git repository")
        return output
    root = Path(root_text).resolve()
    output["repo_root"] = str(root)

    _, head = _run(repo, "rev-parse", "HEAD")
    _, branch = _run(repo, "branch", "--show-current")
    output.update({
        "baseline_head": baseline,
        "current_head": head,
        "immutable_push_sha": None,
        "branch": branch or None,
        "detached": not bool(branch),
        "task_branch": task_branch,
        "index_path": _run(repo, "rev-parse", "--git-path", "index")[1],
    })
    if baseline is None:
        refusals.append("baseline HEAD unavailable")
    elif _run(repo, "cat-file", "-e", f"{baseline}^{{commit}}")[0]:
        refusals.append("baseline HEAD is not a known commit")
    elif _run(repo, "merge-base", "--is-ancestor", baseline, head)[0] != 0:
        refusals.append("baseline HEAD is not an ancestor of current HEAD")
    if not branch:
        refusals.append("detached HEAD")
    if not task_branch or task_branch != branch:
        refusals.append("no positive task-branch binding")

    index_payload = _run(repo, "diff", "--cached", "--name-status", "--no-renames")[1]
    initial = sorted(set(initial_index))
    current_index_names = _names(index_payload)
    output["initial_index"] = initial
    output["current_index"] = index_payload.splitlines() if index_payload else []
    output["preexisting_index_overlap"] = sorted(set(initial) & set(current_index_names))
    if initial:
        refusals.append("pre-existing index requires exact hunk ownership proof")

    owned_paths = list(paths)
    output["literal_pathspecs"] = owned_paths
    facts: list[dict[str, Any]] = []
    if not owned_paths:
        refusals.append("literal task-owned paths unavailable")
    for relative in owned_paths:
        path_fact: dict[str, Any] = {"path": relative, "symlink_component": _symlink_component(root, relative)}
        literal = f":(literal){relative}"
        path_fact["status"] = _run(repo, "status", "--short", "--untracked-files=all", "--", literal)[1].splitlines()
        path_fact["summary"] = _run(repo, "diff", "--summary", "HEAD", "--", literal)[1].splitlines()
        if path_fact["symlink_component"]:
            refusals.append(f"task path has symlink or unsafe component: {relative}")
        facts.append(path_fact)
    output["path_facts"] = facts
    output["worktree_status"] = _run(repo, "status", "--porcelain=v1", "--untracked-files=all")[1].splitlines()
    output["change_summary"] = _run(repo, "diff", "--summary", "HEAD")[1].splitlines()
    if output["worktree_status"]:
        refusals.append("future immutable SHA unavailable before a verified commit")
    else:
        output["immutable_push_sha"] = head

    hooks_path = _run(repo, "config", "--path", "core.hooksPath")[1]
    if hooks_path:
        hook_root = Path(hooks_path) if Path(hooks_path).is_absolute() else root / hooks_path
    else:
        git_dir = Path(_run(repo, "rev-parse", "--absolute-git-dir")[1])
        hook_root = git_dir / "hooks"
    hooks = sorted(item.name for item in hook_root.glob("*") if item.is_file() and os.access(item, os.X_OK)) if hook_root.is_dir() else []
    output["hooks"] = {"path": str(hook_root), "executable": hooks}
    refusals.append("future commit parent/tree must be verified after hooks")

    remotes: dict[str, dict[str, Any]] = {}
    for name in ("origin", "upstream"):
        fetch_code, fetch = _run(repo, "remote", "get-url", name)
        push_code, push = _run(repo, "remote", "get-url", "--push", name)
        if fetch_code == 0:
            remotes[name] = {
                "fetch": _safe_url(fetch),
                "push": _safe_url(push) if push_code == 0 else None,
            }
    output["remotes"] = remotes
    origin = remotes.get("origin", {})
    upstream = remotes.get("upstream", {})
    output["fork_distinction"] = bool(upstream and origin.get("fetch") != upstream.get("fetch"))
    tracking_ref = f"refs/remotes/origin/{branch}" if branch else None
    output["remote_tracking_ref"] = tracking_ref
    output["remote_tracking_sha"] = _run(repo, "rev-parse", "--verify", tracking_ref)[1] if tracking_ref and _run(repo, "rev-parse", "--verify", tracking_ref)[0] == 0 else None
    if not origin.get("push"):
        refusals.append("effective origin push URL unavailable")
    refusals.extend([
        "mixed task/user hunk ownership is not proven",
        "no validated transport identity/policy gate",
        "no immutable push postcondition gate",
    ])
    # Stable ordering helps manifests and tests compare previews.
    output["refusals"] = list(dict.fromkeys(refusals))
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true", required=True)
    parser.add_argument("--repo", default=".")
    parser.add_argument("--baseline")
    parser.add_argument("--task-branch")
    parser.add_argument("--path", action="append", default=[])
    parser.add_argument("--initial-index-path", action="append", default=[])
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = preview(args.repo, args.baseline, args.task_branch, args.path, args.initial_index_path)
    if args.json:
        print(json.dumps(result, sort_keys=True))
    else:
        for key, value in result.items():
            if key != "refusals":
                print(f"INFO: {key}={value}")
        for reason in result["refusals"]:
            print(f"WOULD-REFUSE: {reason}")
        print("finish blocked: no validated push gate")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
