import { playSound } from './sounds';

// Forward same-origin desktop/portfolio input into the retained CRT camera runtime.
export function connectDesktopBridge() {
  const embedded = window.parent !== window;
  const cleanups: (() => void)[] = [];
  const documents = new WeakSet<Document>();
  const frames = new WeakSet<HTMLIFrameElement>();
  let pending: Record<string, unknown> | null = null,
    animation = 0;
  const send = (input: Record<string, unknown>) =>
    embedded &&
    window.parent.postMessage(
      {
        type: 'portfolio-xp-input',
        ...input,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
      location.origin,
    );
  function attach(
    doc: Document,
    offset: (x: number, y: number) => { x: number; y: number },
  ) {
    if (documents.has(doc)) return;
    documents.add(doc);
    const input = (event: Event) => {
      window.dispatchEvent(new Event('portfolio-activity'));
      const eventType = event.type;
      if (
        event.isTrusted &&
        (eventType === 'mousedown' || eventType === 'keydown')
      ) {
        try {
          window.top?.dispatchEvent(new Event('portfolio-sound-gesture'));
        } catch {}
      }
      if (eventType === 'keydown' || eventType === 'keyup') {
        send({ eventType, key: (event as KeyboardEvent).key });
        return;
      }
      const mouse = event as MouseEvent;
      if (event.isTrusted && (mouse.button === 0 || mouse.button === 2)) {
        if (eventType === 'mousedown') playSound('mouseDown');
        if (eventType === 'mouseup') playSound('mouseUp');
      }
      const point = offset(mouse.clientX, mouse.clientY);
      const message = {
        eventType,
        clientX: point.x,
        clientY: point.y,
        button: mouse.button,
      };
      if (eventType === 'mousemove') {
        pending = message;
        if (!animation)
          animation = requestAnimationFrame(() => {
            animation = 0;
            if (pending) send(pending);
            pending = null;
          });
      } else send(message);
    };
    for (const name of [
      'mousemove',
      'mousedown',
      'mouseup',
      'keydown',
      'keyup',
    ]) {
      doc.addEventListener(name, input, { capture: true, passive: true });
      cleanups.push(() => doc.removeEventListener(name, input, true));
    }
    function scan() {
      for (const frame of doc.querySelectorAll('iframe')) {
        if (frames.has(frame)) continue;
        frames.add(frame);
        const load = () => {
          try {
            const child = frame.contentDocument;
            if (child)
              attach(child, (x, y) => {
                const bounds = frame.getBoundingClientRect();
                return offset(
                  bounds.left + (x * bounds.width) / (frame.offsetWidth || 1),
                  bounds.top + (y * bounds.height) / (frame.offsetHeight || 1),
                );
              });
          } catch {
            /* External apps keep their browser isolation. */
          }
        };
        frame.addEventListener('load', load);
        cleanups.push(() => frame.removeEventListener('load', load));
        load();
      }
    }
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(doc, { childList: true, subtree: true });
    cleanups.push(() => observer.disconnect());
  }
  attach(document, (x, y) => ({ x, y }));
  return () => {
    cleanups.forEach((clean) => clean());
    if (animation) cancelAnimationFrame(animation);
  };
}
