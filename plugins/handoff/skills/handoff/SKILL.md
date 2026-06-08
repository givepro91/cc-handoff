---
name: handoff
description: Record the current session's decisions, reasoning, open work, and next steps into the current branch's handoff (docs/handoff/<branch>.md) so the next session — or another machine — can continue. Use when wrapping up a session, pausing work, or before context is compacted/cleared.
when_to_use: When the user runs /handoff, when finishing a session, when work will continue on another machine, or when context is about to be compacted/reset.
argument-hint: "[quick|status|resolve]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Bash(git status*), Bash(git log*), Bash(git diff --stat*), Bash(git rev-parse*), Bash(git branch*), Bash(git remote*), Bash(mkdir -p*)
---

# /handoff — write a session handoff (branch-aware)

Record the current session's state into **`docs/handoff/<branch>.md`** (one handoff per branch) so the next session — even on another machine — continues without losing context.

## Why per-branch (v2)

Multiple sessions/worktrees work on different branches in parallel. A single shared `HANDOFF.md` gets overwritten and you can't tell which handoff is latest or resolved. v2 gives **one file per branch** + a **derived status board** (`/handoff status`) so there's no ambiguity and no merge conflict (each worktree only writes its own branch file; no committed index).

## Principles

- **Data lives in the repo (git).** The branch handoff is committed and pushed, so it travels to other machines. Auto memory and transcripts live only on this machine — do not rely on them.
- **Detailed *why* goes in commit messages; open work and next steps go in the handoff.** Don't duplicate — the "Decisions" section should point at `git log` commit hashes.
- **Honesty.** No guessing. Record only what was actually done and verified; mark unverified items as "unverified". Never dress up incomplete work as done.

## Arguments

- *(none)* or `quick` → write/update this branch's handoff (`quick` = only "Restore in 30s" + "Next steps").
- `status` → render the status board (do not write anything).
- `resolve` → mark this branch's handoff `status: resolved` (use after merge, or when the work is done).

## Procedure — write (default / `quick`)

1. **Find the project root**: `git rev-parse --show-toplevel`. **Current branch**: `git rev-parse --abbrev-ref HEAD`. Compute the slug (replace `/` and other unsafe chars with `-`, e.g. `feat/login` → `feat-login`).
2. **Ensure opt-in**: if `docs/handoff/` is missing, `mkdir -p docs/handoff`. (Its presence is the per-project opt-in switch for the hook automation.)
3. **Migrate legacy if needed**: if `docs/handoff/<slug>.md` does not exist but a legacy `docs/handoff/HANDOFF.md` does, base the new file on its content (the SessionStart hook usually does this automatically; do it here if it hasn't). Leave the legacy file in place unless the user asks to delete it.
4. **Gather current state** (facts, not guesses): `git status --porcelain`, `git diff --stat`, `git log --oneline -5`. If a remote exists, capture the linked issue/PR number when known (from the branch name or `gh`).
5. **Write/update `docs/handoff/<slug>.md`** using the template below. Keep the YAML front-matter at the very top and refresh `updated`. If the file exists, read and update it (overwriting the body is fine — detailed decision history is preserved by `git log`).
6. After writing, offer to commit if the user wants (do not commit without approval).

## Template

```markdown
---
branch: <branch name>
status: active            # active | resolved | merged
updated: <ISO-8601 timestamp>
issue: <number>           # optional
pr: <number>              # optional
---

# Handoff — <task> · <YYYY-MM-DD> · <machine>

## Restore in 30s
What you were doing / where you got to / what you just finished. (So the next session orients in seconds.)

## Next steps
- [ ] Concrete next action — down to files & commands (e.g. add branch X in `web/app/proto/_wire.ts`, then `npm run build`)
- [ ] Blocker / sticking point + what was already tried (avoid repeating the same dead end)
- [ ] Parked item + why

## Touch points
- `path/to/file:line` — what / why
- verify: `command` → expected result

## Decisions
- <key decision in one line> → detailed why in commit `<hash>` (or title)

## Gotchas / agreements (optional)
- Recurring traps realized this session / tone & conventions / constraints the user gave
```

## Procedure — `status` (read-only board)

1. `Glob` `docs/handoff/*.md` (exclude the legacy `HANDOFF.md` if a branch file already covers it).
2. Read each file's front-matter (`branch`, `status`, `updated`, `issue`, `pr`).
3. Render a board, sorted by `updated` (newest first), marking the current branch:

```
🟢 feat-login   (current)  2h ago   #42
🟢 fix-cache               1d ago   #51
✅ main         resolved   3d ago
```

Use 🟢 active · ✅ resolved · ⤵️ merged. This view is **derived** — never write an index file.

## Procedure — `resolve`

1. Find this branch's `docs/handoff/<slug>.md`.
2. Set `status: resolved` (or `merged` if the branch was merged) in the front-matter and refresh `updated`. Leave the body as a record.

## Relationship to the hooks

- The `SessionStart` hook auto-injects **the current branch's** handoff into the next session, and auto-migrates a legacy `HANDOFF.md` to the branch file on first run.
- The `Stop` hook blocks once and instructs this write when "3+ files changed but the branch handoff is stale" (never-miss). Calling `/handoff` yourself records it proactively before that happens.
- The `PreCompact` hook leaves a lossless per-branch transcript backup in `docs/handoff/.snapshots/` (git-ignored) right before compaction.
