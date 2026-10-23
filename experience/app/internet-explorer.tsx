'use client';
import { useEffect, useRef, useState } from 'react';
import { Star, Printer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { UtilityDialog } from './xp-dialogs';
import { playSound } from './sounds';

const HOME = '/portfolio/index.html';
const PAGE_TITLE = 'Chenuka Jayathilake';
type Page = { url: string; title: string };
type Panel = 'favorites' | 'history' | null;
function readPages(key: string): Page[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved)
      ? saved
          .filter(
            (p): p is Page =>
              typeof p?.url === 'string' &&
              /^https?:\/\//.test(p.url) &&
              typeof p?.title === 'string',
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function writePages(key: string, pages: Page[]) {
  try {
    localStorage.setItem(key, JSON.stringify(pages));
  } catch {}
}
function Icon({ name }: { name: string }) {
  return <img src={`/icons/${name}.png`} alt="" draggable={false} />;
}

export function InternetExplorer({
  onTitleChange,
  onClose,
}: {
  onTitleChange: (title: string) => void;
  onClose: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const addressInput = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<Page[]>([
    { url: HOME, title: PAGE_TITLE },
  ]);
  const [position, setPosition] = useState(0);
  const [address, setAddress] = useState(
    () => new URL(HOME, location.origin).href,
  );
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [standardBar, setStandardBar] = useState(true);
  const [addressBar, setAddressBar] = useState(true);
  const [statusBar, setStatusBar] = useState(true);
  const [dialog, setDialog] = useState<'open' | 'about' | 'options' | null>(
    null,
  );
  const [openAddress, setOpenAddress] = useState('');
  const [history, setHistory] = useState<Page[]>(() =>
    readPages('xp-ie-history'),
  );
  const [favorites, setFavorites] = useState<Page[]>(() =>
    readPages('xp-ie-favorites'),
  );
  const current = pages[position];
  const absolute = new URL(current.url, location.origin).href;
  const localPage = new URL(absolute).origin === location.origin;

  useEffect(() => {
    setAddress(absolute);
    onTitleChange(current.title);
  }, [absolute, current.title, onTitleChange]);

  function navigate(raw: string) {
    const value = raw.trim();
    if (!value) return;
    let url: URL;
    try {
      if (value.startsWith('/') || /^https?:\/\//i.test(value))
        url = new URL(value, location.origin);
      else if (/^[a-z][a-z\d+.-]*:/i.test(value)) return;
      else if (/^[^\s]+\.[^\s]+$/.test(value))
        url = new URL(`https://${value}`);
      else
        url = new URL(
          `https://www.google.com/search?q=${encodeURIComponent(value)}`,
        );
    } catch {
      return;
    }
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.href === absolute) {
      refresh();
      return;
    }
    setPages([
      ...pages.slice(0, position + 1),
      {
        url: url.href,
        title: url.pathname === HOME ? PAGE_TITLE : url.hostname,
      },
    ]);
    setPosition(position + 1);
    setLoading(true);
    setAddress(url.href);
    playSound('navigation');
  }
  function travel(next: number) {
    if (next < 0 || next >= pages.length) return;
    setLoading(true);
    setPosition(next);
    playSound('navigation');
  }
  function refresh() {
    setLoading(true);
    setReload((n) => n + 1);
    playSound('navigation');
  }
  function stop() {
    try {
      frame.current?.contentWindow?.stop();
    } catch {}
    setLoading(false);
  }
  function print() {
    try {
      if (localPage) frame.current?.contentWindow?.print();
    } catch {}
  }
  function addFavorite() {
    const next = [
      { url: absolute, title: current.title },
      ...favorites.filter((p) => p.url !== absolute),
    ].slice(0, 100);
    setFavorites(next);
    writePages('xp-ie-favorites', next);
    setPanel('favorites');
  }
  function loaded() {
    const child = frame.current;
    // Ignore a completed load belonging to a page that has already been left.
    if (!child || child.getAttribute('src') !== current.url) return;
    setLoading(false);
    let title = current.title,
      url = absolute;
    try {
      const doc = child.contentDocument;
      if (doc?.title) title = doc.title;
      if (doc?.location.href && doc.location.href !== 'about:blank')
        url = doc.location.href;
    } catch {}
    onTitleChange(title);
    setAddress(url);
    setPages((previous) =>
      previous.map((page, i) =>
        i === position
          ? {
              url:
                new URL(page.url, location.origin).href === url
                  ? page.url
                  : url,
              title,
            }
          : page,
      ),
    );
    const next = [
      { url, title },
      ...readPages('xp-ie-history').filter((p) => p.url !== url),
    ].slice(0, 100);
    setHistory(next);
    writePages('xp-ie-history', next);
  }
  function selectPage() {
    try {
      const doc = frame.current?.contentDocument;
      if (!doc?.body) return;
      const selection = doc.getSelection(),
        range = doc.createRange();
      range.selectNodeContents(doc.body);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch {}
  }
  function toolbarButton(
    name: string,
    label: string,
    action: () => void,
    disabled = false,
    text = '',
  ) {
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        disabled={disabled}
        onClick={action}
      >
        <Icon name={name} />
        {text && <span>{text}</span>}
      </button>
    );
  }
  const togglePanel = (name: Exclude<Panel, null>) =>
    setPanel(panel === name ? null : name);
  return (
    <section
      className="ie6"
      aria-label="Internet Explorer"
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'l'
        ) {
          event.preventDefault();
          setAddressBar(true);
          requestAnimationFrame(() => addressInput.current?.select());
        } else if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'o'
        ) {
          event.preventDefault();
          setOpenAddress(address);
          setDialog('open');
        } else if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'p'
        ) {
          event.preventDefault();
          print();
        } else if (event.key === 'F5') {
          event.preventDefault();
          refresh();
        } else if (event.altKey && event.key === 'ArrowLeft') {
          event.preventDefault();
          travel(position - 1);
        } else if (event.altKey && event.key === 'ArrowRight') {
          event.preventDefault();
          travel(position + 1);
        } else if (event.key === 'Escape') stop();
      }}
    >
      <div className="ie6-menubar">
        <div className="ie6-grip" />
        {(['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'] as const).map(
          (name) => (
            <DropdownMenu key={name}>
              <DropdownMenuTrigger className="ie6-menu-button">
                {name}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="xp-context ie6-menu"
                sideOffset={0}
              >
                {name === 'File' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setOpenAddress(address);
                        setDialog('open');
                      }}
                    >
                      Open… <kbd>Ctrl+O</kbd>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={print} disabled={!localPage}>
                      Print… <kbd>Ctrl+P</kbd>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onClose}>Close</DropdownMenuItem>
                  </>
                )}
                {name === 'Edit' && (
                  <>
                    <DropdownMenuItem disabled>Undo</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>Cut</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        try {
                          const selection = frame.current?.contentDocument
                            ?.getSelection()
                            ?.toString();
                          if (selection)
                            void navigator.clipboard
                              ?.writeText(selection)
                              .catch(() => {});
                        } catch {}
                      }}
                    >
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>Paste</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={selectPage}>
                      Select All <kbd>Ctrl+A</kbd>
                    </DropdownMenuItem>
                  </>
                )}
                {name === 'View' && (
                  <>
                    <DropdownMenuCheckboxItem
                      checked={standardBar}
                      onCheckedChange={setStandardBar}
                    >
                      Standard Buttons
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={addressBar}
                      onCheckedChange={setAddressBar}
                    >
                      Address Bar
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusBar}
                      onCheckedChange={setStatusBar}
                    >
                      Status Bar
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => togglePanel('favorites')}>
                      Explorer Bar: Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePanel('history')}>
                      Explorer Bar: History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={stop} disabled={!loading}>
                      Stop <kbd>Esc</kbd>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={refresh}>
                      Refresh <kbd>F5</kbd>
                    </DropdownMenuItem>
                  </>
                )}
                {name === 'Favorites' && (
                  <>
                    <DropdownMenuItem onClick={addFavorite}>
                      Add to Favorites…
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePanel('favorites')}>
                      Organize Favorites…
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(HOME)}>
                      {PAGE_TITLE} — Portfolio
                    </DropdownMenuItem>
                    {favorites.map((p) => (
                      <DropdownMenuItem
                        key={p.url}
                        onClick={() => navigate(p.url)}
                      >
                        {p.title}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                {name === 'Tools' && (
                  <DropdownMenuItem onClick={() => setDialog('options')}>
                    Internet Options…
                  </DropdownMenuItem>
                )}
                {name === 'Help' && (
                  <DropdownMenuItem onClick={() => setDialog('about')}>
                    About Internet Explorer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        )}
        <div className={`ie6-throbber ${loading ? 'is-loading' : ''}`}>
          <Icon name="windows" />
        </div>
      </div>
      {standardBar && (
        <div className="ie6-toolbar">
          <div className="ie6-grip" />
          {toolbarButton(
            'back',
            'Back',
            () => travel(position - 1),
            position === 0,
            'Back',
          )}
          <button
            className="ie6-dropdown"
            aria-label="Back history"
            disabled={position === 0}
            onClick={() => togglePanel('history')}
          >
            ▾
          </button>
          {toolbarButton(
            'forward',
            'Forward',
            () => travel(position + 1),
            position === pages.length - 1,
          )}
          {toolbarButton('stop', 'Stop', stop, !loading)}
          {toolbarButton('refresh', 'Refresh', refresh)}
          {toolbarButton('home', 'Home', () => navigate(HOME))}
          <span className="ie6-separator" />
          {toolbarButton(
            'search',
            'Search',
            () => {
              setAddressBar(true);
              requestAnimationFrame(() => addressInput.current?.select());
            },
            false,
            'Search',
          )}
          <button
            aria-label="Favorites"
            aria-pressed={panel === 'favorites'}
            onClick={() => togglePanel('favorites')}
          >
            <Star
              className="ie6-star"
              size={24}
              fill="#ffd84a"
              stroke="#b4861d"
            />
            <span>Favorites</span>
          </button>
          {toolbarButton('history', 'History', () => togglePanel('history'))}
          <span className="ie6-separator" />
          {toolbarButton('mail', 'Read Mail', () => {
            window.location.href = 'mailto:';
          })}
          <button
            aria-label="Print"
            title="Print"
            onClick={print}
            disabled={!localPage}
          >
            <Printer size={23} color="#666" />
          </button>
        </div>
      )}
      {addressBar && (
        <form
          className="ie6-addressbar"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(address);
          }}
        >
          <div className="ie6-grip" />
          <label htmlFor="ie6-address">Address</label>
          <div className="ie6-address-field">
            <Icon name="ie" />
            <input
              id="ie6-address"
              ref={addressInput}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              onFocus={(event) => event.target.select()}
              autoComplete="off"
              spellCheck={false}
              aria-label="Address"
            />
            <button
              type="button"
              title="History"
              aria-label="Address history"
              onClick={() => togglePanel('history')}
            >
              ▾
            </button>
          </div>
          <button className="ie6-go" type="submit">
            <Icon name="go" />
            <span>Go</span>
          </button>
          <span className="ie6-links">
            Links <b>»</b>
          </span>
        </form>
      )}
      <div className="ie6-page-area">
        {panel && (
          <aside
            className="ie6-sidebar"
            aria-label={panel === 'favorites' ? 'Favorites' : 'History'}
          >
            <header>
              <span>{panel === 'favorites' ? 'Favorites' : 'History'}</span>
              <button
                aria-label="Close Explorer Bar"
                onClick={() => setPanel(null)}
              >
                ×
              </button>
            </header>
            {panel === 'favorites' && (
              <button className="ie6-panel-action" onClick={addFavorite}>
                Add current page
              </button>
            )}
            <div className="ie6-sidebar-list">
              {panel === 'favorites' && (
                <button onClick={() => navigate(HOME)}>
                  <Icon name="ie" />
                  {PAGE_TITLE} — Portfolio
                </button>
              )}
              {(panel === 'favorites' ? favorites : history).map((p) => (
                <div className="ie6-saved-page" key={p.url}>
                  <button title={p.url} onClick={() => navigate(p.url)}>
                    <Icon name="ie" />
                    {p.title}
                  </button>
                  {panel === 'favorites' && (
                    <button
                      aria-label={`Remove ${p.title} from Favorites`}
                      onClick={() => {
                        const next = favorites.filter((f) => f.url !== p.url);
                        setFavorites(next);
                        writePages('xp-ie-favorites', next);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {panel === 'history' && history.length === 0 && (
                <p>No pages visited yet.</p>
              )}
            </div>
          </aside>
        )}
        <div className="ie6-document">
          {!localPage && (
            <div className="ie6-information-bar">
              Some websites do not allow display in a window.{' '}
              <button
                onClick={() =>
                  window.open(absolute, '_blank', 'noopener,noreferrer')
                }
              >
                Open this page in your browser
              </button>
            </div>
          )}
          <iframe
            key={reload}
            ref={frame}
            className="portfolio-frame"
            title="Internet Explorer — web page"
            src={current.url}
            onLoad={loaded}
            allow="autoplay; fullscreen"
          />
        </div>
      </div>
      {statusBar && (
        <footer className="ie6-statusbar">
          <span>
            <Icon name="ie" />
            {loading ? 'Opening page…' : 'Done'}
          </span>
          {loading && (
            <span className="ie6-progress">
              <i />
            </span>
          )}
          <span className="ie6-zone">
            🌐 {localPage ? 'Local intranet' : 'Internet'}
          </span>
          <span className="ie6-sizegrip" />
        </footer>
      )}
      {dialog && (
        <UtilityDialog
          title={
            dialog === 'open'
              ? 'Open'
              : dialog === 'about'
                ? 'About Internet Explorer'
                : 'Internet Options'
          }
          onClose={() => setDialog(null)}
        >
          {dialog === 'open' ? (
            <form
              className="ie6-open-dialog"
              onSubmit={(event) => {
                event.preventDefault();
                navigate(openAddress);
                setDialog(null);
              }}
            >
              <p>
                Type the Internet address of a document, and Internet Explorer
                will open it for you.
              </p>
              <label>
                Open:{' '}
                <input
                  value={openAddress}
                  onChange={(event) => setOpenAddress(event.target.value)}
                  autoFocus
                />
              </label>
              <button className="xp-button" type="submit">
                Open
              </button>
            </form>
          ) : dialog === 'about' ? (
            <div className="ie6-about">
              <Icon name="ie" />
              <h2>Microsoft Internet Explorer</h2>
              <p>Internet Explorer 6 · Windows XP interface</p>
            </div>
          ) : (
            <div className="ie6-options">
              <fieldset>
                <legend>Home page</legend>
                <p>{new URL(HOME, location.origin).href}</p>
                <button
                  className="xp-button"
                  onClick={() => {
                    navigate(HOME);
                    setDialog(null);
                  }}
                >
                  Use Default
                </button>
              </fieldset>
              <fieldset>
                <legend>History</legend>
                <p>
                  Internet Explorer keeps a list of pages you have visited here.
                </p>
                <button
                  className="xp-button"
                  onClick={() => {
                    setHistory([]);
                    writePages('xp-ie-history', []);
                  }}
                >
                  Clear History
                </button>
              </fieldset>
            </div>
          )}
        </UtilityDialog>
      )}
    </section>
  );
}
