'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSceneAudio } from './scene-audio';

export default function SceneExperience() {
  const frame = useRef<HTMLIFrameElement>(null);
  const enteredAt = useRef(0);
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { primed, mode, enable, mute, perspective } = useSceneAudio();
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const armTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setFailed(true), 45000);
    };
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      const data = event.data;
      if (data?.type === 'portfolio-scene-ready') {
        clearTimeout(timeout);
        setReady(true);
        setFailed(false);
      } else if (data?.type === 'portfolio-scene-progress') armTimeout();
      else if (data?.type === 'portfolio-scene-ambience')
        perspective(data.volume, data.frequency);
    };
    window.addEventListener('message', receive);
    armTimeout();
    return () => {
      window.removeEventListener('message', receive);
      clearTimeout(timeout);
    };
  }, [attempt, perspective]);
  useEffect(() => {
    if (!entered || !ready) return;
    const timer = setTimeout(
      () => setRevealed(true),
      Math.max(0, 650 - (performance.now() - enteredAt.current)),
    );
    return () => clearTimeout(timer);
  }, [entered, ready]);
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setLoaderHidden(true), 650);
    return () => clearTimeout(timer);
  }, [revealed]);
  function enter() {
    // Keep the sound unlock in the actual click/keyboard activation handler.
    enable();
    enteredAt.current = performance.now();
    setEntered(true);
  }
  function retry() {
    setReady(false);
    setFailed(false);
    setRevealed(false);
    setLoaderHidden(false);
    enteredAt.current = performance.now();
    setAttempt((value) => value + 1);
  }
  return (
    <main className="scene-experience" aria-busy={entered && !ready}>
      {primed && (
        <iframe
          key={attempt}
          ref={frame}
          src="/scene/index.html"
          title="3D desk and Windows XP portfolio"
          allow="autoplay; fullscreen"
          allowFullScreen
          tabIndex={revealed ? 0 : -1}
          inert={!revealed}
          aria-hidden={!revealed}
          onError={() => setFailed(true)}
        />
      )}
      {!loaderHidden && (
        <div
          className={`scene-loading ${revealed ? 'is-leaving' : ''}`}
          inert={revealed}
          aria-hidden={revealed}
        >
          {!entered ? (
            <button
              type="button"
              className="scene-enter"
              data-scene-sound-control
              onClick={enter}
            >
              click to enter
            </button>
          ) : failed ? (
            <div className="scene-entry-error">
              <p role="status">The desktop could not load.</p>
              <div>
                <button onClick={retry}>try again</button>
                <a href="/xp/">open Windows XP</a>
              </div>
            </div>
          ) : (
            <span className="scene-entry-wait" role="status">
              loading…
            </span>
          )}
        </div>
      )}
      {loaderHidden && (
        <div className="scene-sound-dock">
          <button
            type="button"
            className="scene-sound-control"
            data-scene-sound-control
            disabled={mode === 'unavailable'}
            aria-label={mode === 'playing' ? 'Mute sound' : 'Enable sound'}
            aria-pressed={mode === 'playing'}
            onClick={mode === 'playing' ? mute : enable}
          >
            {mode === 'playing' ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      )}
    </main>
  );
}
