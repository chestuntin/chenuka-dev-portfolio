// XP system sounds retain their event assignments; physical mouse clips accompany real input.
export type Sound =
  | 'mouseDown'
  | 'mouseUp'
  | 'boot'
  | 'navigation'
  | 'warning'
  | 'recycle'
  | 'logoff'
  | 'shutdown'
  | 'startup';
const soundSettingsKey = 'xp-sound-settings-v2';
let volume = 1;
let muted = false;
const voices = new Map<HTMLAudioElement, number>();
const soundGains: Record<Sound, number> = {
  mouseDown: 1,
  mouseUp: 1,
  boot: 1,
  navigation: 1,
  warning: 1,
  recycle: 1,
  logoff: 1,
  shutdown: 1,
  startup: 1,
};
const soundFiles: Record<Sound, string> = {
  mouseDown: 'mouse-down.mp3',
  mouseUp: 'mouse-up.mp3',
  boot: 'xp-boot-sequence.wav',
  navigation: 'navigation.wav',
  warning: 'warning.wav',
  recycle: 'recycle.wav',
  logoff: 'logoff.wav',
  shutdown: 'shutdown.wav',
  startup: 'startup.wav',
};
export function getSoundSettings() {
  return { volume, muted };
}
export function configureSound(v: number, m: boolean) {
  volume = Math.max(0, Math.min(1, v));
  muted = m;
  for (const [a, gain] of voices) {
    a.volume = volume * gain;
    a.muted = muted;
  }
  try {
    localStorage.setItem(soundSettingsKey, JSON.stringify({ volume, muted }));
  } catch {}
}
export function loadSoundSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(soundSettingsKey) || 'null');
    if (
      s &&
      typeof s.volume === 'number' &&
      Number.isFinite(s.volume) &&
      typeof s.muted === 'boolean'
    )
      configureSound(s.volume, s.muted);
  } catch {}
}
export function playSound(name: Sound) {
  if (typeof Audio === 'undefined' || muted) return;
  const a = new Audio(`/sounds/${soundFiles[name]}`);
  a.volume = volume * soundGains[name];
  voices.set(a, soundGains[name]);
  const done = () => voices.delete(a);
  a.onended = done;
  a.onerror = done;
  void a.play().catch(done);
}
