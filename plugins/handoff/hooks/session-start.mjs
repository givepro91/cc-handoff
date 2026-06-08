#!/usr/bin/env node
// SessionStart hook — auto-restore: inject the CURRENT BRANCH's handoff into the new
// session's context. Fires on every source (startup/resume/clear/compact).
// v2: per-branch file docs/handoff/<slug>.md. Legacy single HANDOFF.md is auto-migrated
// to the current branch file on first run (lossless — the legacy file is left in place).
// Silent unless opted in (docs/handoff/ exists) and a handoff for this branch exists.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { readInput, projectDir, isOptedIn, resolveHandoff, output } from './_lib.mjs';

const input = readInput();
const dir = projectDir(input);
if (!isOptedIn(dir)) process.exit(0);

const r = resolveHandoff(dir, { migrate: true });   // auto-migrate legacy → branch file
if (!r.exists) process.exit(0);

let content = '';
try { content = readFileSync(r.file, 'utf8'); } catch { process.exit(0); }
if (!content.trim()) process.exit(0);

const rel = `docs/handoff/${basename(r.file)}`;
const CAP = 4000;
const preview = content.length > CAP
  ? content.slice(0, CAP) + `\n…(truncated — read ${rel} in full)`
  : content;

const lines = [
  `📋 A handoff from a previous session exists: ${rel}${r.branch ? ` (branch: ${r.branch})` : ''}`,
  'Before starting, read this file, verify it is not out of sync with the current code, then continue from "Next steps".',
];
if (r.migratedFrom) {
  lines.push(`(Migrated legacy docs/handoff/HANDOFF.md → ${rel}. The legacy file was left untouched; you may delete it once confirmed.)`);
}
lines.push('Other branches may have their own handoffs — run /handoff status to see all of them.');
lines.push('', `--- ${rel} ---`, preview);

output({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: lines.join('\n'),
  },
});
process.exit(0);
