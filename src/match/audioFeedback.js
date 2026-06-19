let audioContext = null;

export function playShotSound(power = 0.5) {
  playTone({
    frequency: 180 + power * 120,
    duration: 0.09 + power * 0.04,
    type: 'square',
    volume: 0.045,
    sweepTo: 110 + power * 80,
  });
}

export function playImpactSound(strength = 0.5) {
  playTone({
    frequency: 90 + strength * 90,
    duration: 0.05 + strength * 0.08,
    type: 'triangle',
    volume: 0.035 + strength * 0.035,
    sweepTo: 55,
  });
}

export function playBreakSound() {
  playTone({
    frequency: 420,
    duration: 0.12,
    type: 'square',
    volume: 0.05,
    sweepTo: 180,
  });
}

function playTone({ frequency, duration, type, volume, sweepTo }) {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}
