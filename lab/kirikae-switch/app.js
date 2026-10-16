'use strict';

const modes = [
  { id: 'work', label: '仕事', messages: ['時間は有限。', '細かく報告する。', '仕事は積み重ね。'] },
  { id: 'family', label: '家族', messages: ['子どもとの時間は一瞬。', 'スマホより目の前。'] },
  { id: 'study', label: '学習', messages: ['一ページでも前進。', '理解を急がない。'] },
  { id: 'rest', label: '休息', messages: ['今日はここまで。', '明日のために休む。'] },
];
const storageKey = 'nemoto-works:kirikae:mode';
const ritual = document.querySelector('.ritual');
const control = document.querySelector('.switch-control');
const buttons = [...document.querySelectorAll('.mode-button')];
let mode = modes[0];
let on = false;
try {
  mode = modes.find(item => item.id === localStorage.getItem(storageKey)) || mode;
} catch { /* Storage may be disabled; the switch still works. */ }

const designs = [
  '<span class="switch-panel push-panel" aria-hidden="true"><span class="switch-label">切</span><span class="switch-bezel"><span class="switch-plunger"><span class="switch-mark"></span></span></span>',
  '<span class="switch-panel toggle-panel" aria-hidden="true"><span class="toggle-legend legend-off">切</span><span class="toggle-legend legend-on">入</span><span class="toggle-base"><span class="toggle-joint"></span><span class="toggle-lever"><span class="toggle-grip"></span></span></span>',
  '<span class="switch-panel slide-panel" aria-hidden="true"><span class="slide-legend">切</span><span class="slide-legend">入</span><span class="slide-slot"><span class="slide-knob"><span></span><span></span><span></span></span></span>',
];
control.innerHTML = designs[Math.floor(Math.random() * designs.length)] +
  '<span class="switch-screw screw-left"></span><span class="switch-screw screw-right"></span></span>';

function render() {
  ritual.classList.toggle('is-on', on);
  buttons.forEach((button, index) => {
    const selected = modes[index] === mode;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelector('.eyebrow').textContent = mode.label + (on ? 'モード' : 'に切り替える');
  document.querySelector('h1').textContent = on
    ? mode.messages[Math.floor(Math.random() * mode.messages.length)]
    : 'ここで、切り替える。';
  control.setAttribute('aria-checked', String(on));
  control.setAttribute('aria-label', `${mode.label}モードを${on ? '終える' : '始める'}`);
  const label = control.querySelector('.switch-label');
  if (label) label.textContent = on ? '入' : '切';
  document.querySelector('.instruction').textContent = on ? '切り替えました。' : '押して、自分に宣言する。';
}
buttons.forEach((button, index) => button.addEventListener('click', () => {
  mode = modes[index];
  on = false;
  try { localStorage.setItem(storageKey, mode.id); } catch { /* Optional persistence. */ }
  render();
}));
control.addEventListener('click', () => { on = !on; render(); });
render();
