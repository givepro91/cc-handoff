#!/usr/bin/env node
// SessionStart hook — auto-restore: inject the previous session's handoff into the new
// session's context. Fires on every source (startup/resume/clear/compact).
// Silent if docs/handoff/HANDOFF.md does not exist.
import { existsSync, readFileSync } from 'node:fs';
import { readInput, projectDir, handoffFile, output } from './_lib.mjs';

const input = readInput();
const dir = projectDir(input);
const hf = handoffFile(dir);

if (!existsSync(hf)) process.exit(0);

let content = '';
try { content = readFileSync(hf, 'utf8'); } catch { process.exit(0); }
if (!content.trim()) process.exit(0);

const CAP = 4000;
const preview = content.length > CAP
  ? content.slice(0, CAP) + '\n…(truncated — read docs/handoff/HANDOFF.md in full)'
  : content;

output({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: [
      '📋 A handoff from a previous session exists: docs/handoff/HANDOFF.md',
      'Before starting, read this file, verify it is not out of sync with the current code, then continue from "Next steps".',
      '',
      '--- docs/handoff/HANDOFF.md ---',
      preview,
    ].join('\n'),
  },
});
process.exit(0);
