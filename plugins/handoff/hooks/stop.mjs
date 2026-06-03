#!/usr/bin/env node
// Stop hook — medium enforcement: only when meaningful work happened (default 3+ files
// changed) AND docs/handoff/HANDOFF.md is out of date, block the stop ONCE and instruct
// the model to write the handoff. The reason of decision:"block" is injected as the
// model's next instruction.
//
// Loop guard:   stop_hook_active=true → pass immediately.
// Global off:   HANDOFF_STOP_ENFORCE=0
// Threshold:    HANDOFF_MIN_CHANGED_FILES (default 3)
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  readInput, projectDir, handoffFile, isOptedIn, isGitRepo, changedFiles, output,
} from './_lib.mjs';

const input = readInput();

if (input.stop_hook_active === true) process.exit(0);          // already force-continuing → avoid loop
if (process.env.HANDOFF_STOP_ENFORCE === '0') process.exit(0); // global off

const dir = projectDir(input);
if (!isOptedIn(dir)) process.exit(0);                          // per-project opt-in (docs/handoff/ exists)
if (!isGitRepo(dir)) process.exit(0);

const files = changedFiles(dir);
if (!files) process.exit(0);

const threshold = parseInt(process.env.HANDOFF_MIN_CHANGED_FILES || '3', 10);
if (files.length < threshold) process.exit(0);                 // ignore trivial changes

// staleness: stale if HANDOFF is missing, or older than the most recently edited changed file
const hf = handoffFile(dir);
let stale = true;
if (existsSync(hf)) {
  const hmt = statSync(hf).mtimeMs;
  let newest = 0;
  for (const f of files) {
    try { const m = statSync(join(dir, f)).mtimeMs; if (m > newest) newest = m; } catch { /* deleted */ }
  }
  stale = hmt < newest;
}
if (!stale) process.exit(0);                                   // already up to date → pass

output({
  decision: 'block',
  reason: [
    `Update the handoff before ending. ${files.length} file(s) changed in this session but docs/handoff/HANDOFF.md is out of date.`,
    ``,
    `Write/update docs/handoff/HANDOFF.md now with these sections, then finish:`,
    `  ## Restore in 30s — what you were doing / where you got to / what you just finished`,
    `  ## Next steps — concrete next actions (files & commands) / blockers + what was already tried / parked items + why`,
    `  ## Touch points — path:line, verification command → expected result`,
    `  ## Decisions — one line each (detailed *why* lives in git commit bodies)`,
    ``,
    `No guessing — only what was actually done/verified; mark anything unverified as "unverified". Then end naturally.`,
    `(If this project doesn't need handoffs, empty docs/handoff/ or set HANDOFF_STOP_ENFORCE=0.)`,
  ].join('\n'),
});
process.exit(0);
