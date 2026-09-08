# Finish and cleanup preview

Finish preview is read-only and runs Git with optional locks disabled. It reports
baseline/current HEAD, detached state, positive task branch, resolved linked-worktree Git
paths, supplied initial/current index and overlap, literal pathspec facts,
symlinks/deletes/renames/modes, executable hooks, sanitized fetch/push URLs and
fork/upstream distinction, cached remote-tracking ref, immutable candidate SHA, and
`WOULD-REFUSE` for every missing requirement. Initial index and owned paths must come
from the invocation manifest; preview never infers hunk ownership from a pathname.

Cleanup preview rejects paths lexically outside the owner-private RRR root before opening
them. It marks a regular scratch file eligible only after a unique creator receipt,
no-symlink ancestry, matching device/inode/content hash, `nlink == 1`, same-device
owner-private durable rescue parent, no-clobber target, and recorded quiescence. Even an
eligible result says `action: retain`; no cleanup is executed. Directories, cross-device
actions, Git worktrees/branches, processes, panes, manifests, remote refs, and universal
race-free claims are deferred.
