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

function createNoiseBuffer(context, duration = 0.18) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i += 1) {
    const fade = 1 - i / frameCount;
    data[i] = (Math.random() * 2 - 1) * fade;
  }

  return buffer;
}

function playThump(startTime, frequency, gainValue, duration) {
  const context = getAudioContext();

  const oscillator = context.createOscillator();
  const oscillatorGain = context.createGain();
  const oscillatorFilter = context.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency * 1.45, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency, startTime + 0.03);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(34, frequency * 0.58), startTime + duration);

  oscillatorFilter.type = "lowpass";
  oscillatorFilter.frequency.setValueAtTime(170, startTime);
  oscillatorFilter.Q.setValueAtTime(0.8, startTime);

  oscillatorGain.gain.setValueAtTime(0.0001, startTime);
  oscillatorGain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.012);
  oscillatorGain.gain.exponentialRampToValueAtTime(gainValue * 0.18, startTime + duration * 0.45);
  oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(oscillatorFilter);
  oscillatorFilter.connect(oscillatorGain);
  oscillatorGain.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);

  const noise = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  const noiseGain = context.createGain();

  noise.buffer = createNoiseBuffer(context);
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.setValueAtTime(230, startTime);
  noiseFilter.Q.setValueAtTime(0.6, startTime);

  noiseGain.gain.setValueAtTime(0.0001, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(gainValue * 0.34, startTime + 0.008);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(context.destination);

  noise.start(startTime);
  noise.stop(startTime + duration + 0.01);
}

function playHeartbeat() {
  if (!soundEnabled || !audioContext) {
    return;
  }

  const start = audioContext.currentTime + 0.01;
  playThump(start, 70, 0.11, 0.24);
  playThump(start + SECOND_BEAT_DELAY_MS / 1000, 55, 0.082, 0.27);
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

  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
  }

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
