import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceActiveTime,
  applyJudgement,
  createSession,
  finishRest,
  judgeTarget,
  targetProgress,
} from '../engine.mjs';

test('target progress is clamped from zero to one', () => {
  assert.equal(targetProgress(-100, 1000), 0);
  assert.equal(targetProgress(500, 1000), 0.5);
  assert.equal(targetProgress(1200, 1000), 1);
});

test('matching lane near the ring earns GREAT', () => {
  assert.deepEqual(judgeTarget(0.9, -1, -1), { label: 'GREAT', points: 100 });
  assert.deepEqual(judgeTarget(0.9, 1, -1), { label: 'MISS', points: 0 });
});

test('judgements update score and reset combo on miss', () => {
  let session = createSession();
  session = applyJudgement(session, { label: 'GREAT', points: 100 });
  session = applyJudgement(session, { label: 'GOOD', points: 60 });
  assert.equal(session.score, 160);
  assert.equal(session.combo, 2);
  session = applyJudgement(session, { label: 'MISS', points: 0 });
  assert.equal(session.combo, 0);
  assert.equal(session.bestCombo, 2);
});

test('active play pauses for a rest and resumes with a new deadline', () => {
  let session = { ...createSession({ restEveryMs: 1000 }), phase: 'playing' };
  session = advanceActiveTime(session, 999);
  assert.equal(session.phase, 'playing');
  session = advanceActiveTime(session, 1);
  assert.equal(session.phase, 'rest');
  const pausedElapsed = session.activeElapsed;
  session = advanceActiveTime(session, 5000);
  assert.equal(session.activeElapsed, pausedElapsed);
  session = finishRest(session);
  assert.equal(session.phase, 'playing');
  assert.equal(session.nextRestAt, pausedElapsed + 1000);
});
