# cc-handoff

> Never lose context between Claude Code sessions — even across machines.

A [Claude Code](https://docs.claude.com/en/docs/claude-code) plugin that automatically preserves a session's **decisions, open work, and next steps** into a git-tracked `docs/handoff/HANDOFF.md`, so the next session — on this machine or another — picks up exactly where you left off.

## The one-line design

> **Tools live machine-global. Data lives in the repo (git).**

`--resume`, auto memory, and `/rewind` checkpoints all live under `~/.claude` on a *single machine* — they don't follow a `git push` to your other laptop. So the canonical handoff is a file that travels with the repo.

## Why this exists

- **`/compact` is lossy.** Anthropic states it plainly: *"overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later."* Decisions and the *why* behind them are exactly what gets dropped.
- **Manual and model-discretion handoffs forget.** If you have to remember to run `/handoff`, you eventually won't — and a crashed/closed session takes everything with it.
- **Hooks don't forget.** A `Stop` hook can return `decision: "block"` with a `reason` that becomes the model's next instruction — the one robust way to *force* the handoff to be written when work happened but wasn't recorded.

## How it works — a hybrid of hooks

| Hook | When | What it does |
|------|------|--------------|
| `SessionStart` | startup / resume / clear / compact | Injects `docs/handoff/HANDOFF.md` into context — **auto-restore** |
| `PreCompact` | right before compaction | Backs up the raw transcript + a git breadcrumb to `docs/handoff/.snapshots/` — **loss protection** |
| `Stop` | end of a turn | If ≥N files changed *and* the handoff is stale, blocks **once** and asks the model to write it — **never-miss enforcement** |
| `/handoff` skill | manual | Write a precise handoff whenever you want |

**Honest limitation:** there is no way to make the model write an intelligent handoff at the exact instant you close the terminal — `SessionEnd` hook output is ignored. Instead this catches turn-end and pre-compaction, which covers virtually every real case.

## Install

```sh
# Add this repo as a marketplace, then install (user scope = available in every project)
/plugin marketplace add givepro91/cc-handoff
/plugin install handoff@cc-handoff
```

Or from a local clone:

```sh
/plugin marketplace add /path/to/cc-handoff
/plugin install handoff@cc-handoff
```

## Enable per project (opt-in)

Installing the plugin does **not** disturb any project on its own. A project opts in by having a `docs/handoff/` directory — without it, every hook stays silent.

```sh
/handoff        # creates docs/handoff/ + the first HANDOFF.md → hooks activate from then on
```

Optionally, pin it in your project `CLAUDE.md` / `AGENTS.md` so new sessions read it first:

```
At session start, if docs/handoff/HANDOFF.md exists, read it first and continue from "Next steps".
```

## Configuration

| Env var | Default | Meaning |
|---------|---------|---------|
| `HANDOFF_MIN_CHANGED_FILES` | `3` | Minimum changed files before the `Stop` hook will block |
| `HANDOFF_STOP_ENFORCE` | _(on)_ | Set to `0` to disable `Stop` enforcement (snapshot + restore still run) |

## Data layout

- `docs/handoff/HANDOFF.md` — **git-tracked.** The canonical handoff; travels across machines via commit + push.
- `docs/handoff/.snapshots/` — **git-ignored** (added automatically). Lossless pre-compaction backups, local to the machine.

Keep the detailed *why* of each decision in your **commit messages** (`git log` is portable too); keep open work and next steps in `HANDOFF.md`.

## What a handoff looks like

```markdown
# Handoff — <task> · <date> · <machine/branch>

## Restore in 30s
What you were doing / where you got to / what you just finished.

## Next steps
- [ ] Concrete next action — down to files & commands
- [ ] Blocker + what was already tried
- [ ] Parked item + why

## Touch points
- path/to/file:line — what / why · verify: `command` → expected

## Decisions
- <decision> → detailed why in commit `<hash>`
```

## Project structure

```
cc-handoff/
├── .claude-plugin/marketplace.json      # marketplace manifest
└── plugins/handoff/
    ├── .claude-plugin/plugin.json       # plugin manifest
    ├── hooks/
    │   ├── hooks.json                   # registers SessionStart · PreCompact · Stop
    │   ├── _lib.mjs                      # shared helpers
    │   ├── session-start.mjs            # restore
    │   ├── pre-compact.mjs              # snapshot
    │   └── stop.mjs                     # never-miss enforcement (medium)
    └── skills/handoff/SKILL.md          # /handoff manual capture
```

Hooks are plain Node ESM (no dependencies). Requires a recent Node on `PATH`.

## License

MIT © 2026 Jay (Spacewalk)
