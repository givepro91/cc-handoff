# CLAUDE.md

`cc-handoff` — a Claude Code plugin for **branch-aware session handoffs**. Tools live machine-global; data lives in the repo's git (`docs/handoff/<branch>.md`). Hooks are plain Node ESM with no dependencies.

## Project
- **Layout:** `plugins/handoff/hooks/{session-start,stop,pre-compact}.mjs` + `_lib.mjs`; `skills/handoff/SKILL.md`; manifests in `.claude-plugin/`.
- **Verify:** `node --check plugins/handoff/hooks/*.mjs` + validate JSON (`hooks.json`, `plugin.json`, `marketplace.json`). No build, no deps (recent Node on PATH).
- **Behavior invariants:** SessionStart injects only the current branch's handoff (auto-migrates legacy `HANDOFF.md`); Stop blocks once when ≥`HANDOFF_MIN_CHANGED_FILES` changed and the branch handoff is stale (`stop_hook_active` loop guard, `HANDOFF_STOP_ENFORCE=0` off); per-project opt-in = `docs/handoff/` exists.

<!-- CC-RULES:START -->
<!-- Managed by /claude-md. Edits inside this block are overwritten on regen; put custom rules outside it. -->

## Working Discipline
- **Think before coding.** State assumptions; if uncertain, ask. Surface tradeoffs and competing interpretations instead of silently picking one.
- **Simplicity first.** Write the minimum code that solves the stated problem. No speculative features, abstractions, or configuration for single-use code.
- **Surgical changes.** Touch only what the task requires. Don't refactor or reformat adjacent code; match the existing style. Remove only what your change made unused.
- **Goal-driven.** Define a concrete success check (test / build / command / screenshot) before coding, then loop until it passes.

## Verification
- Always give yourself a way to verify — a test, a bash command, a curl, a screenshot. A working feedback loop is the single biggest quality lever.
- Report honestly: if a check fails, say so with the output; mark unverified work "unverified". Never present incomplete work as done.

## Parallel Git Workflow
- Never commit directly to the default branch (`main`/`master`). **One task = one ISSUE = one branch.**
- For parallel local sessions, isolate with a **worktree per task**: `git worktree add ../<task> -b <branch>`.
- Open small, surgical PRs that reference the issue (e.g. "Fixes #42"); keep one concern per PR.
- If cc-handoff is installed: **one branch = one handoff** (`docs/handoff/<branch>.md`).

## Self-Learning Rules
<!-- Append one concise rule per correction. `/learn` writes here automatically; newest first. -->
<!-- LEARN:ANCHOR -->
<!-- CC-RULES:END -->
