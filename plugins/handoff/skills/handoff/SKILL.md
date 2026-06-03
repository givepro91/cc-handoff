---
name: handoff
description: Record the current session's decisions, reasoning, open work, and next steps into docs/handoff/HANDOFF.md so the next session — or another machine — can continue. Use when wrapping up a session, pausing work, or before context is compacted/cleared.
when_to_use: When the user runs /handoff, when finishing a session, when work will continue on another machine, or when context is about to be compacted/reset.
argument-hint: "[quick]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash(git status*), Bash(git log*), Bash(git diff --stat*), Bash(git rev-parse*), Bash(mkdir -p*)
---

# /handoff — write a session handoff

Record the current session's state into `docs/handoff/HANDOFF.md` so the next session — even on another machine — continues without losing context.

## Principles

- **Data lives in the repo (git).** `docs/handoff/HANDOFF.md` is committed and pushed, so it travels to other machines. Auto memory and transcripts live only on this machine — do not rely on them.
- **Detailed *why* goes in commit messages; open work and next steps go in HANDOFF.md.** Don't duplicate — the "Decisions" section should point at `git log` commit hashes.
- **Honesty.** No guessing. Record only what was actually done and verified; mark unverified items as "unverified". Never dress up incomplete work as done.

## Procedure

1. **Find the project root**: `git rev-parse --show-toplevel`.
2. **Ensure opt-in**: if `docs/handoff/` is missing, create it with `mkdir -p docs/handoff`. (The presence of this directory is the per-project opt-in switch for the hook automation.)
3. **Gather current state** (facts, not guesses): `git status --porcelain`, `git diff --stat`, `git log --oneline -5`, plus the decisions, alternatives considered, blockers, and next actions from the conversation.
4. **Write/update `docs/handoff/HANDOFF.md`** using the template below. If a file already exists, read and update it (overwriting is fine — the detailed decision history is preserved by `git log`).
5. **If the argument is `quick`**, update only the "Restore in 30s" + "Next steps" sections, concisely.
6. After writing, offer to commit if the user wants (do not commit without approval).

## Template

```markdown
# Handoff — <task> · <YYYY-MM-DD> · <machine/branch>

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
- ...

## Gotchas / agreements (optional)
- Recurring traps realized this session / tone & conventions / constraints the user gave
```

## Relationship to the hooks

- The `SessionStart` hook auto-injects this file into the next session's context — the new session reads it and continues on its own.
- The `Stop` hook blocks once and instructs this write when "3+ files changed but HANDOFF is stale" (never-miss). Calling `/handoff` yourself records it proactively before that happens.
- The `PreCompact` hook leaves a lossless backup in `docs/handoff/.snapshots/` (git-ignored) right before compaction.
