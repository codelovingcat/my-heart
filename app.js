const heartStage = document.querySelector(".heart-stage");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const soundToggle = document.querySelector("#sound-toggle");
const heartWrap = document.querySelector(".heart-wrap");

let audioContext = null;
let masterGain = null;
let soundEnabled = false;
let heartbeatTimer = null;
let interactionTimer = null;
let pointerFrame = null;
let pointerInside = false;
let waveBurstTimer = null;

const BEAT_INTERVAL_MS = 1620;
const SECOND_BEAT_DELAY_MS = 230;
const MASTER_VOLUME = 0.68;

requestAnimationFrame(() => {
  heartStage.classList.add("is-ready");
  heartStage.setAttribute("aria-busy", "false");
});

function applyPointerPosition(clientX, clientY) {
  if (prefersReducedMotion.matches) {
    return;
  }

  const rect = heartStage.getBoundingClientRect();
  const relativeX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const relativeY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

  const shiftX = (relativeX - 0.5) * 12;
  const shiftY = (relativeY - 0.5) * 9;
  const rotateX = (0.5 - relativeY) * 1.8;
  const rotateY = (relativeX - 0.5) * 2.4;

  if (pointerFrame !== null) {
    cancelAnimationFrame(pointerFrame);
  }

  pointerFrame = requestAnimationFrame(() => {
    heartStage.style.setProperty("--pointer-x", `${relativeX * 100}%`);
    heartStage.style.setProperty("--pointer-y", `${relativeY * 100}%`);
    heartStage.style.setProperty("--pointer-shift-x", `${shiftX.toFixed(2)}px`);
    heartStage.style.setProperty("--pointer-shift-y", `${shiftY.toFixed(2)}px`);
    heartStage.style.setProperty("--pointer-rotate-x", `${rotateX.toFixed(2)}deg`);
    heartStage.style.setProperty("--pointer-rotate-y", `${rotateY.toFixed(2)}deg`);
    pointerFrame = null;
  });
}

function resetPointerPosition() {
  if (prefersReducedMotion.matches) {
    return;
  }

  heartStage.style.setProperty("--pointer-x", "50%");
  heartStage.style.setProperty("--pointer-y", "50%");
  heartStage.style.setProperty("--pointer-shift-x", "0px");
  heartStage.style.setProperty("--pointer-shift-y", "0px");
  heartStage.style.setProperty("--pointer-rotate-x", "0deg");
  heartStage.style.setProperty("--pointer-rotate-y", "0deg");
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = MASTER_VOLUME;
    masterGain.connect(audioContext.destination);
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

function playThump(startTime, frequency, gainValue, duration, bodyFrequency, bodyGain) {
  const context = getAudioContext();

  const oscillator = context.createOscillator();
  const oscillatorGain = context.createGain();
  const oscillatorFilter = context.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency * 1.55, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency, startTime + 0.026);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(31, frequency * 0.5), startTime + duration);

  oscillatorFilter.type = "lowpass";
  oscillatorFilter.frequency.setValueAtTime(210, startTime);
  oscillatorFilter.Q.setValueAtTime(0.9, startTime);

  oscillatorGain.gain.setValueAtTime(0.0001, startTime);
  oscillatorGain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.009);
  oscillatorGain.gain.exponentialRampToValueAtTime(gainValue * 0.22, startTime + duration * 0.4);
  oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(oscillatorFilter);
  oscillatorFilter.connect(oscillatorGain);
  oscillatorGain.connect(masterGain);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);

  const bodyOscillator = context.createOscillator();
  const bodyGainNode = context.createGain();
  const bodyFilter = context.createBiquadFilter();

  bodyOscillator.type = "sine";
  bodyOscillator.frequency.setValueAtTime(bodyFrequency * 1.2, startTime);
  bodyOscillator.frequency.exponentialRampToValueAtTime(bodyFrequency, startTime + 0.045);
  bodyOscillator.frequency.exponentialRampToValueAtTime(Math.max(24, bodyFrequency * 0.62), startTime + duration * 1.15);

  bodyFilter.type = "lowpass";
  bodyFilter.frequency.setValueAtTime(115, startTime);
  bodyFilter.Q.setValueAtTime(0.55, startTime);

  bodyGainNode.gain.setValueAtTime(0.0001, startTime);
  bodyGainNode.gain.exponentialRampToValueAtTime(bodyGain, startTime + 0.016);
  bodyGainNode.gain.exponentialRampToValueAtTime(bodyGain * 0.16, startTime + duration * 0.5);
  bodyGainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 1.15);

  bodyOscillator.connect(bodyFilter);
  bodyFilter.connect(bodyGainNode);
  bodyGainNode.connect(masterGain);

  bodyOscillator.start(startTime);
  bodyOscillator.stop(startTime + duration * 1.15 + 0.03);

  const noise = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  const noiseGain = context.createGain();

  noise.buffer = createNoiseBuffer(context, 0.12);
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.setValueAtTime(320, startTime);
  noiseFilter.Q.setValueAtTime(0.5, startTime);

  noiseGain.gain.setValueAtTime(0.0001, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(gainValue * 0.22, startTime + 0.006);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  noise.start(startTime);
  noise.stop(startTime + 0.14);
}

function playHeartbeat() {
  if (!soundEnabled || !audioContext || document.hidden) {
    return;
  }

  const start = audioContext.currentTime + 0.01;
  playThump(start, 74, 0.115, 0.22, 44, 0.055);
  playThump(start + SECOND_BEAT_DELAY_MS / 1000, 58, 0.086, 0.25, 36, 0.044);
}

function startHeartbeatTimer() {
  if (!soundEnabled || document.hidden || heartbeatTimer !== null) {
    return;
  }

  heartbeatTimer = window.setInterval(playHeartbeat, BEAT_INTERVAL_MS);
}

async function startHeartbeatSound() {
  const context = getAudioContext();

  if (context.state === "suspended") {
    await context.resume();
  }

  soundEnabled = true;
  soundToggle.setAttribute("aria-pressed", "true");
  soundToggle.textContent = "Sound on";

  if (!document.hidden) {
    playHeartbeat();
    startHeartbeatTimer();
  }
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

function handleVisibilityChange() {
  if (!soundEnabled || !audioContext) {
    return;
  }

  if (document.hidden) {
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    if (audioContext.state === "running") {
      void audioContext.suspend();
    }

    return;
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume().then(() => {
      if (soundEnabled) {
        playHeartbeat();
        startHeartbeatTimer();
      }
    });
    return;
  }

  playHeartbeat();
  startHeartbeatTimer();
}

function triggerWaveBurst() {
  heartStage.classList.remove("burst");
  void heartStage.offsetWidth;
  heartStage.classList.add("burst");

  if (waveBurstTimer !== null) {
    window.clearTimeout(waveBurstTimer);
  }

  waveBurstTimer = window.setTimeout(() => {
    heartStage.classList.remove("burst");
    waveBurstTimer = null;
  }, 700);
}

function triggerHeartInteraction() {
  triggerWaveBurst();
  heartWrap.classList.remove("interaction-pulse");
  void heartWrap.offsetWidth;
  heartWrap.classList.add("interaction-pulse");

  if (interactionTimer !== null) {
    window.clearTimeout(interactionTimer);
  }

  interactionTimer = window.setTimeout(() => {
    heartWrap.classList.remove("interaction-pulse");
    interactionTimer = null;
  }, 500);

  if (soundEnabled && audioContext && !document.hidden) {
    playHeartbeat();
  }
}

soundToggle.addEventListener("click", () => {
  if (soundEnabled) {
    stopHeartbeatSound();
    return;
  }

  void startHeartbeatSound();
});

heartWrap.addEventListener("click", (event) => {
  if (event.detail !== 0) {
    triggerHeartInteraction();
  }
});

heartWrap.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  triggerHeartInteraction();
});

heartStage.addEventListener("pointerenter", () => {
  pointerInside = true;
});

heartStage.addEventListener("pointermove", (event) => {
  pointerInside = true;
  applyPointerPosition(event.clientX, event.clientY);
});

heartStage.addEventListener("pointerleave", () => {
  pointerInside = false;
  resetPointerPosition();
});

window.addEventListener("blur", () => {
  if (pointerInside) {
    pointerInside = false;
    resetPointerPosition();
  }
});

document.addEventListener("visibilitychange", handleVisibilityChange);

window.addEventListener("pagehide", () => {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
  }

  if (interactionTimer !== null) {
    window.clearTimeout(interactionTimer);
  }

  if (pointerFrame !== null) {
    cancelAnimationFrame(pointerFrame);
  }

  if (waveBurstTimer !== null) {
    window.clearTimeout(waveBurstTimer);
  }

  if (audioContext && audioContext.state !== "closed") {
    void audioContext.close();
  }
});
