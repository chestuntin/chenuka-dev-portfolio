'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { configureSound, getSoundSettings, loadSoundSettings } from './sounds';

export type SceneSoundMode =
  | 'pending'
  | 'blocked'
  | 'playing'
  | 'muted'
  | 'unavailable';
type Controls = {
  start: () => void;
  enable: () => void;
  mute: () => void;
  perspective: (volume: number, frequency: number) => void;
  dispose: () => void;
};
const SETTINGS_KEY = 'xp-sound-settings-v2';

function createAmbience(report: (mode: SceneSoundMode) => void): Controls {
  loadSoundSettings();
  const context = new AudioContext();
  const audio = new Audio('/scene/audio/atmosphere/office.mp3');
  audio.preload = 'auto';
  audio.loop = true;
  const source = context.createMediaElementSource(audio);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 10000;
  filter.Q.value = 0.2;
  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(context.destination);
  let disposed = false,
    audible = false,
    roomVolume = 0.08,
    fadeUntil = 0;
  let blockedTimer: ReturnType<typeof setTimeout> | undefined;
  const publish = (mode: SceneSoundMode) => {
    if (!disposed) report(mode);
  };
  function ramp(duration?: number) {
    if (disposed || context.state === 'closed') return;
    const { muted, volume } = getSoundSettings();
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(
      muted ? 0 : roomVolume * volume,
      now + (duration ?? Math.max(0.18, fadeUntil - now)),
    );
  }
  function update() {
    if (disposed || document.hidden) return;
    const { muted, volume } = getSoundSettings();
    if (muted || volume === 0) {
      ramp(0.2);
      publish('muted');
      return;
    }
    if (
      context.state === 'running' &&
      !audio.paused &&
      audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      clearTimeout(blockedTimer);
      if (!audible) {
        audible = true;
        fadeUntil = context.currentTime + 2.4;
      }
      ramp();
      publish('playing');
    }
  }
  function start() {
    if (disposed || document.hidden) return;
    const { muted, volume } = getSoundSettings();
    if (muted || volume === 0) {
      publish('muted');
      return;
    }
    if (
      context.state === 'running' &&
      !audio.paused &&
      audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      update();
      return;
    }
    // Call both APIs synchronously so a click can unlock Safari and Chrome audio.
    void context
      .resume()
      .then(update)
      .catch(() => publish('blocked'));
    void audio
      .play()
      .then(update)
      .catch((error: DOMException) => {
        publish(error.name === 'NotAllowedError' ? 'blocked' : 'unavailable');
      });
    clearTimeout(blockedTimer);
    blockedTimer = setTimeout(() => {
      if (context.state !== 'running') publish('blocked');
    }, 500);
  }
  function preferencesChanged() {
    loadSoundSettings();
    update();
    if (!getSoundSettings().muted) start();
  }
  function storage(event: StorageEvent) {
    if (event.key === SETTINGS_KEY || event.key === null) preferencesChanged();
  }
  function visibility() {
    if (document.hidden) {
      audio.pause();
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.value = 0;
      audible = false;
    } else start();
  }
  function gesture(event: Event) {
    const target = event.target as Element | null;
    if (target?.closest?.('[data-scene-sound-control]')) return;
    if (event.type === 'portfolio-sound-gesture' || event.isTrusted) start();
  }
  audio.addEventListener('playing', update);
  context.addEventListener('statechange', update);
  window.addEventListener('storage', storage);
  window.addEventListener('portfolio-sound-gesture', gesture);
  document.addEventListener('pointerdown', gesture, true);
  document.addEventListener('keydown', gesture, true);
  document.addEventListener('visibilitychange', visibility);
  audio.load();
  return {
    start,
    enable() {
      const { volume } = getSoundSettings();
      configureSound(volume || 1, false);
      audible = false;
      start();
    },
    mute() {
      configureSound(getSoundSettings().volume, true);
      audible = false;
      update();
    },
    perspective(volume, frequency) {
      if (!Number.isFinite(volume) || !Number.isFinite(frequency) || disposed)
        return;
      roomVolume = Math.max(0, Math.min(0.15, volume));
      filter.frequency.setTargetAtTime(
        Math.max(200, Math.min(20000, frequency)),
        context.currentTime,
        0.15,
      );
      if (audible) ramp();
    },
    dispose() {
      disposed = true;
      clearTimeout(blockedTimer);
      audio.removeEventListener('playing', update);
      context.removeEventListener('statechange', update);
      window.removeEventListener('storage', storage);
      window.removeEventListener('portfolio-sound-gesture', gesture);
      document.removeEventListener('pointerdown', gesture, true);
      document.removeEventListener('keydown', gesture, true);
      document.removeEventListener('visibilitychange', visibility);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      void context.close().catch(() => {});
    },
  };
}

export function useSceneAudio() {
  const controls = useRef<Controls | null>(null);
  const [primed, setPrimed] = useState(false);
  const [mode, setMode] = useState<SceneSoundMode>('pending');
  useEffect(() => {
    try {
      controls.current = createAmbience(setMode);
      controls.current.start();
    } catch {
      setMode('unavailable');
    }
    // Start requesting ambience before mounting the heavier scene iframe.
    setPrimed(true);
    return () => {
      controls.current?.dispose();
      controls.current = null;
    };
  }, []);
  const enable = useCallback(() => controls.current?.enable(), []);
  const mute = useCallback(() => controls.current?.mute(), []);
  const perspective = useCallback(
    (volume: number, frequency: number) =>
      controls.current?.perspective(volume, frequency),
    [],
  );
  return { primed, mode, enable, mute, perspective };
}
