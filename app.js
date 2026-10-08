const heartStage = document.querySelector(".heart-stage");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const soundToggle = document.querySelector("#sound-toggle");
const heartWrap = document.querySelector(".heart-wrap");

let audioContext = null;
let soundEnabled = false;
let heartbeatTimer = null;
let interactionTimer = null;

const BEAT_INTERVAL_MS = 1620;

requestAnimationFrame(() => {
  heartStage.classList.add("is-ready");
  heartStage.setAttribute("aria-busy", "false");
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
const SECOND_BEAT_DELAY_MS = 230;
let pointerFrame = null;
let pointerInside = false;

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

function playHeartbeat(force = false) {
  if ((!soundEnabled && !force) || !audioContext) {
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

function triggerHeartInteraction() {
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

  if (soundEnabled && audioContext) {
    playHeartbeat();
  }
}

soundToggle.addEventListener("click", () => {
  if (soundEnabled) {
    stopHeartbeatSound();
    return;
  }

  startHeartbeatSound();
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

window.addEventListener("blur", () => {
  if (pointerInside) {
    pointerInside = false;
    resetPointerPosition();
  }
});

window.addEventListener("pagehide", () => {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
  }

  if (interactionTimer !== null) {
    window.clearTimeout(interactionTimer);
  }

  if (audioContext && audioContext.state !== "closed") {
    void audioContext.close();
  }
});
