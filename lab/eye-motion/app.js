import {
  LANES,
  advanceActiveTime,
  applyJudgement,
  createSession,
  finishRest,
  judgeTarget,
  targetProgress,
} from './engine.mjs';

const canvas = document.querySelector('#stage');
const ctx = canvas.getContext('2d');
const startButton = document.querySelector('#start');
const laneButtons = [...document.querySelectorAll('[data-lane]')];
const scoreNode = document.querySelector('#score');
const comboNode = document.querySelector('#combo');
const statusNode = document.querySelector('#status');
const restDialog = document.querySelector('#rest-dialog');
const restCount = document.querySelector('#rest-count');
const resumeButton = document.querySelector('#resume');

let session = createSession();
let target = null;
let lastFrame = performance.now();
let restRemaining = 20;
let restTimer = null;
let nextLaneIndex = Math.floor(Math.random() * LANES.length);

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function spawnTarget(now) {
  nextLaneIndex = (nextLaneIndex + 1 + Math.floor(Math.random() * 2)) % LANES.length;
  target = { lane: LANES[nextLaneIndex], bornAt: now, duration: 2300 };
}

function targetPosition(progress, width, height, lane) {
  const eased = progress * progress;
  const horizonX = width / 2;
  const horizonY = height * 0.25;
  return {
    x: horizonX + lane * width * 0.29 * eased,
    y: horizonY + height * 0.58 * eased,
    radius: 5 + Math.pow(progress, 2.2) * Math.min(width, height) * 0.11,
  };
}

function draw(now) {
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(width / 2, height * 0.25, 0, width / 2, height * 0.4, height);
  gradient.addColorStop(0, '#243657');
  gradient.addColorStop(0.58, '#10182e');
  gradient.addColorStop(1, '#070b16');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(151, 190, 255, .22)';
  ctx.lineWidth = 1;
  for (const lane of LANES) {
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.25);
    ctx.lineTo(width / 2 + lane * width * 0.32, height);
    ctx.stroke();
  }
  for (let i = 0; i < 7; i += 1) {
    const p = i / 6;
    const y = height * 0.25 + Math.pow(p, 2) * height * 0.7;
    ctx.beginPath();
    ctx.moveTo(width * (0.5 - 0.32 * p * p), y);
    ctx.lineTo(width * (0.5 + 0.32 * p * p), y);
    ctx.stroke();
  }

  const ringY = height * 0.25 + height * 0.58 * 0.9 * 0.9;
  ctx.strokeStyle = 'rgba(255, 211, 92, .72)';
  ctx.lineWidth = 2;
  for (const lane of LANES) {
    const x = width / 2 + lane * width * 0.29 * 0.9 * 0.9;
    ctx.beginPath();
    ctx.arc(x, ringY, Math.min(width, height) * 0.105, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (target && session.phase === 'playing') {
    const progress = targetProgress(now - target.bornAt, target.duration);
    const pos = targetPosition(progress, width, height, target.lane);
    const ballGradient = ctx.createRadialGradient(
      pos.x - pos.radius * 0.35,
      pos.y - pos.radius * 0.4,
      pos.radius * 0.1,
      pos.x,
      pos.y,
      pos.radius,
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.22, '#a8d9ff');
    ballGradient.addColorStop(0.72, '#5c70ff');
    ballGradient.addColorStop(1, '#263077');
    ctx.fillStyle = ballGradient;
    ctx.shadowColor = '#7aa7ff';
    ctx.shadowBlur = pos.radius * 0.65;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (progress >= 1) handleJudgement({ label: 'MISS', points: 0 }, now);
  }
}

function updateStats() {
  scoreNode.textContent = String(session.score);
  comboNode.textContent = String(session.combo);
}

function handleJudgement(judgement, now = performance.now()) {
  session = applyJudgement(session, judgement);
  statusNode.textContent = judgement.label;
  statusNode.dataset.result = judgement.label.toLowerCase();
  updateStats();
  spawnTarget(now + 180);
}

function tapLane(lane) {
  if (session.phase !== 'playing' || !target) return;
  const progress = targetProgress(performance.now() - target.bornAt, target.duration);
  handleJudgement(judgeTarget(progress, lane, target.lane));
}

function showRest() {
  if (restDialog.open) return;
  restRemaining = 20;
  restCount.textContent = String(restRemaining);
  resumeButton.disabled = true;
  restDialog.showModal();
  restTimer = window.setInterval(() => {
    restRemaining -= 1;
    restCount.textContent = String(Math.max(0, restRemaining));
    if (restRemaining <= 0) {
      window.clearInterval(restTimer);
      resumeButton.disabled = false;
      resumeButton.focus();
    }
  }, 1000);
}

function frame(now) {
  const delta = Math.min(100, now - lastFrame);
  lastFrame = now;
  const previousPhase = session.phase;
  session = advanceActiveTime(session, delta);
  if (previousPhase !== 'rest' && session.phase === 'rest') showRest();
  draw(now);
  requestAnimationFrame(frame);
}

startButton.addEventListener('click', () => {
  session = { ...createSession({ now: performance.now() }), phase: 'playing' };
  startButton.textContent = '最初から';
  statusNode.textContent = '球が黄色い輪に重なったらタップ';
  statusNode.dataset.result = '';
  updateStats();
  spawnTarget(performance.now());
});

laneButtons.forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    tapLane(Number(button.dataset.lane));
  });
});

resumeButton.addEventListener('click', () => {
  restDialog.close();
  session = finishRest(session);
  lastFrame = performance.now();
  spawnTarget(lastFrame);
  statusNode.textContent = '再開しました';
});

window.addEventListener('resize', resizeCanvas);
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
});
resizeCanvas();
requestAnimationFrame(frame);
