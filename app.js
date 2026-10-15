const modeButtons = [...document.querySelectorAll('.mode-button')];
const startButton = document.querySelector('#start-button');
const resetButton = document.querySelector('#reset-button');
const minutesNode = document.querySelector('#minutes');
const secondsNode = document.querySelector('#seconds');
const progressBar = document.querySelector('#progress-bar');
const statusNode = document.querySelector('#timer-status');

let selectedMinutes = 25;
let totalSeconds = selectedMinutes * 60;
let remainingSeconds = totalSeconds;
let intervalId = null;

function formatTime() {
  minutesNode.textContent = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  secondsNode.textContent = String(remainingSeconds % 60).padStart(2, '0');
  progressBar.style.transform = `scaleX(${remainingSeconds / totalSeconds})`;
  document.title = intervalId ? `${minutesNode.textContent}:${secondsNode.textContent} — Nemoto Works` : 'Nemoto Works — 小さく、役立つ道具を。';
}

function stopTimer() {
  window.clearInterval(intervalId);
  intervalId = null;
  startButton.textContent = remainingSeconds === totalSeconds ? 'スタート' : '再開';
}

function resetTimer() {
  stopTimer();
  remainingSeconds = totalSeconds;
  startButton.textContent = 'スタート';
  statusNode.textContent = `${selectedMinutes}分、${selectedMinutes === 25 ? '集中してみましょう。' : 'ひと息つきましょう。'}`;
  formatTime();
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    modeButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    selectedMinutes = Number(button.dataset.minutes);
    totalSeconds = selectedMinutes * 60;
    resetTimer();
  });
});

startButton.addEventListener('click', () => {
  if (intervalId) {
    stopTimer();
    statusNode.textContent = '一時停止しています。';
    return;
  }

  if (remainingSeconds === 0) remainingSeconds = totalSeconds;
  startButton.textContent = '一時停止';
  statusNode.textContent = selectedMinutes === 25 ? '集中時間です。' : '休憩時間です。';
  intervalId = window.setInterval(() => {
    remainingSeconds -= 1;
    formatTime();
    if (remainingSeconds <= 0) {
      stopTimer();
      startButton.textContent = 'もう一度';
      statusNode.textContent = selectedMinutes === 25 ? 'おつかれさまでした。休憩しましょう。' : '休憩終了です。';
      document.title = '時間になりました — Nemoto Works';
    }
  }, 1000);
});

resetButton.addEventListener('click', resetTimer);
document.querySelector('#year').textContent = new Date().getFullYear();
formatTime();
