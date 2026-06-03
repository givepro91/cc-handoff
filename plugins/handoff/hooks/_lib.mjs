// 공유 헬퍼 — handoff 플러그인 hook 들이 import.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/** stdin(JSON) 파싱. 실패해도 {} 반환. */
export function readInput() {
  let raw = '';
  try { raw = readFileSync(0, 'utf8'); } catch { /* no stdin */ }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

/** 프로젝트 루트: CLAUDE_PROJECT_DIR > hook input.cwd > process.cwd(). */
export function projectDir(input) {
  return process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
}

export function handoffDir(dir) { return join(dir, 'docs', 'handoff'); }
export function handoffFile(dir) { return join(handoffDir(dir), 'HANDOFF.md'); }

/** 프로젝트별 opt-in: docs/handoff/ 가 있어야 hook 활성. */
export function isOptedIn(dir) { return existsSync(handoffDir(dir)); }

/** git 명령 실행. 실패 시 null. */
export function git(dir, args) {
  try {
    return execSync(`git ${args}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}

export function isGitRepo(dir) { return git(dir, 'rev-parse --is-inside-work-tree') === 'true'; }

/** git status --porcelain → 변경 파일 경로 배열(rename 은 대상 경로). */
export function changedFiles(dir) {
  const out = git(dir, 'status --porcelain');
  if (out == null) return null;
  return out.split('\n')
    .filter((l) => l.length > 3)               // "XY path"
    .map((l) => l.slice(3))                     // 상태 2자 + 공백 제거
    .map((p) => p.split(' -> ').pop());         // rename: orig -> new
}

export function output(obj) { process.stdout.write(JSON.stringify(obj)); }
