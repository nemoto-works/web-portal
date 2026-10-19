export const LANES = [-1, 0, 1];

export function createSession({ now = 0, restEveryMs = 45_000 } = {}) {
  return {
    phase: 'ready',
    score: 0,
    combo: 0,
    bestCombo: 0,
    judged: 0,
    startedAt: now,
    activeSince: now,
    activeElapsed: 0,
    restEveryMs,
    nextRestAt: restEveryMs,
  };
}

export function judgeTarget(progress, tappedLane, targetLane) {
  if (tappedLane !== targetLane) return { label: 'MISS', points: 0 };
  const distance = Math.abs(0.9 - progress);
  if (distance <= 0.055) return { label: 'GREAT', points: 100 };
  if (distance <= 0.14) return { label: 'GOOD', points: 60 };
  return { label: 'MISS', points: 0 };
}

export function applyJudgement(session, judgement) {
  const hit = judgement.points > 0;
  const combo = hit ? session.combo + 1 : 0;
  return {
    ...session,
    score: session.score + judgement.points,
    combo,
    bestCombo: Math.max(session.bestCombo, combo),
    judged: session.judged + 1,
  };
}

export function advanceActiveTime(session, deltaMs) {
  if (session.phase !== 'playing') return session;
  const activeElapsed = session.activeElapsed + Math.max(0, deltaMs);
  if (activeElapsed >= session.nextRestAt) {
    return { ...session, phase: 'rest', activeElapsed };
  }
  return { ...session, activeElapsed };
}

export function finishRest(session) {
  return {
    ...session,
    phase: 'playing',
    nextRestAt: session.activeElapsed + session.restEveryMs,
  };
}

export function targetProgress(elapsedMs, durationMs = 2200) {
  return Math.min(1, Math.max(0, elapsedMs / durationMs));
}
