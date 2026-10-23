'use client';
import { useEffect, useRef, useState } from 'react';
export default function SceneExperience() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin === location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === 'portfolio-scene-ready'
      ) {
        setReady(true);
        setFailed(false);
      }
    };
    window.addEventListener('message', receive);
    const timeout = setTimeout(() => setFailed(true), 25000);
    return () => {
      window.removeEventListener('message', receive);
      clearTimeout(timeout);
    };
  }, []);
  return (
    <main className="scene-experience">
      <iframe
        ref={frame}
        src="/scene/index.html"
        title="3D desk and Windows XP portfolio"
        allow="autoplay; fullscreen"
        allowFullScreen
        onError={() => setFailed(true)}
      />
      {!ready && (
        <div className="scene-loading" role="status">
          {failed ? (
            <>
              <p>The 3D view could not load on this browser.</p>
              <a href="/xp/">Open the desktop</a>
            </>
          ) : (
            <span>Loading desk…</span>
          )}
        </div>
      )}
    </main>
  );
}
