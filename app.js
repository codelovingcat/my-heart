const soundToggle = document.querySelector("#sound-toggle");

let audioContext = null;
let soundEnabled = false;
let heartbeatTimer = null;

const BEAT_INTERVAL_MS = 1620;
const SECOND_BEAT_DELAY_MS = 230;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function playThump(startTime, frequency, gainValue, duration) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(44, startTime + duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(150, startTime);
  filter.Q.setValueAtTime(0.7, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playHeartbeat() {
  if (!soundEnabled || !audioContext) {
    return;
  }

  const start = audioContext.currentTime + 0.01;
  playThump(start, 76, 0.12, 0.20);
  playThump(start + SECOND_BEAT_DELAY_MS / 1000, 62, 0.095, 0.24);
}

function startHeartbeatSound() {
  const context = getAudioContext();

  if (context.state === "suspended") {
    void context.resume();
  }

  soundEnabled = true;
  soundToggle.setAttribute("aria-pressed", "true");
  soundToggle.textContent = "Sound on";

  playHeartbeat();
  heartbeatTimer = window.setInterval(playHeartbeat, BEAT_INTERVAL_MS);
}

function stopHeartbeatSound() {
  soundEnabled = false;
  soundToggle.setAttribute("aria-pressed", "false");
  soundToggle.textContent = "Sound off";

  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

soundToggle.addEventListener("click", () => {
  if (soundEnabled) {
    stopHeartbeatSound();
    return;
  }

  startHeartbeatSound();
});

window.addEventListener("pagehide", () => {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
  }

  if (audioContext && audioContext.state !== "closed") {
    void audioContext.close();
  }
});
