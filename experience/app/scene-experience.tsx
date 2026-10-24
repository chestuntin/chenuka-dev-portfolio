'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSceneAudio } from './scene-audio';

export default function SceneExperience() {
  const frame = useRef<HTMLIFrameElement>(null);
  const started = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState({ loaded: 0, total: 0, kind: '' });
  const { primed, mode, enable, mute, perspective } = useSceneAudio();
  useEffect(() => {
    started.current = performance.now();
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
      } else if (
        data?.type === 'portfolio-scene-progress' &&
        Number.isFinite(data.loaded) &&
        Number.isFinite(data.total) &&
        data.total > 0
      ) {
        setProgress({
          loaded: Math.max(0, Math.min(data.total, data.loaded)),
          total: data.total,
          kind: data.kind,
        });
        armTimeout();
      } else if (data?.type === 'portfolio-scene-ambience') {
        perspective(data.volume, data.frequency);
      }
    };
    window.addEventListener('message', receive);
    armTimeout();
    return () => {
      window.removeEventListener('message', receive);
      clearTimeout(timeout);
    };
  }, [attempt, perspective]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(
      () => setRevealed(true),
      Math.max(0, 1800 - (performance.now() - started.current)),
    );
    return () => clearTimeout(timer);
  }, [ready]);
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setLoaderHidden(true), 850);
    return () => clearTimeout(timer);
  }, [revealed]);
  function retry() {
    setReady(false);
    setFailed(false);
    setRevealed(false);
    setLoaderHidden(false);
    setProgress({ loaded: 0, total: 0, kind: '' });
    setAttempt((value) => value + 1);
  }
  const percent = ready
    ? 100
    : progress.total
      ? Math.floor((progress.loaded / progress.total) * 100)
      : 0;
  const status = ready
    ? 'Your desktop is ready'
    : progress.kind === 'texture'
      ? 'Loading textures and light'
      : progress.kind === 'audio'
        ? 'Preparing the desk sounds'
        : progress.kind === 'gltfModel'
          ? 'Arranging the room'
          : 'Connecting to your desktop';
  const soundLabel =
    mode === 'playing'
      ? 'Sound on'
      : mode === 'muted'
        ? 'Sound off'
        : mode === 'unavailable'
          ? 'Sound unavailable'
          : 'Enable sound';
  const soundControl = (
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
      <span>{soundLabel}</span>
    </button>
  );
  return (
    <main className="scene-experience" aria-busy={!ready}>
      {primed && (
        <iframe
          key={attempt}
          ref={frame}
          src="/scene/index.html"
          title="3D desk and Windows XP portfolio"
          allow="autoplay; fullscreen"
          allowFullScreen
          tabIndex={revealed ? 0 : -1}
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
          <div className="scene-loader-top">
            <span className="scene-loader-led" />
            CHENUKA JAYATHILAKE
            <span className="scene-loader-edition">PORTFOLIO / 2026</span>
          </div>
          <div className="scene-loader-content">
            <div className="scene-loader-monitor" aria-hidden="true">
              <div className="scene-loader-screen">
                <span className="scene-loader-cursor">
                  C<span>_</span>
                </span>
                <div className="scene-loader-scan" />
              </div>
              <div className="scene-loader-chin">
                <i />
              </div>
              <div className="scene-loader-stand" />
            </div>
            <p className="scene-loader-eyebrow">A DESK ON THE WEB</p>
            <h1>
              {failed
                ? 'The room is taking a little longer.'
                : 'Opening the desktop.'}
            </h1>
            <p className="scene-loader-status" role="status" aria-live="polite">
              {failed
                ? 'You can retry the 3D view or go straight to Windows XP.'
                : status}
            </p>
            {!failed && (
              <div className="scene-loader-progress-wrap">
                <div
                  className={`scene-loader-progress ${progress.total || ready ? '' : 'is-indeterminate'}`}
                  role="progressbar"
                  aria-label="Desktop assets loaded"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.total || ready ? percent : undefined}
                >
                  <span
                    style={{
                      width:
                        progress.total || ready ? `${percent}%` : undefined,
                    }}
                  />
                </div>
                <div className="scene-loader-progress-meta">
                  <span>
                    {ready
                      ? 'READY'
                      : progress.total
                        ? `${progress.loaded} / ${progress.total} ASSETS`
                        : 'PREPARING THE SCENE'}
                  </span>
                  <span>
                    {progress.total || ready ? `${percent}%` : 'PLEASE WAIT'}
                  </span>
                </div>
              </div>
            )}
            {failed ? (
              <div className="scene-loader-actions">
                <button onClick={retry}>Try again</button>
                <a href="/xp/">Open Windows XP</a>
              </div>
            ) : (
              <div className="scene-loader-audio">
                {soundControl}
                <span>
                  {mode === 'playing'
                    ? 'Ambient sound is on.'
                    : mode === 'muted'
                      ? 'You can switch sound on at any time.'
                      : mode === 'unavailable'
                        ? 'The desktop will open without ambient sound.'
                        : 'For the room’s ambient sound.'}
                </span>
              </div>
            )}
          </div>
          <div className="scene-loader-bottom">
            <span>3D DESK / WINDOWS XP</span>
            <span className="scene-loader-bottom-line" />
            <span>WEBGL</span>
          </div>
        </div>
      )}
      {loaderHidden && <div className="scene-sound-dock">{soundControl}</div>}
    </main>
  );
}
