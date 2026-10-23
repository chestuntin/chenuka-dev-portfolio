'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  ChevronRight,
  Info,
  Minus,
  Square,
  X,
  Copy,
} from 'lucide-react';
import { connectDesktopBridge } from './desktop-bridge';
import { InternetExplorer } from './internet-explorer';
import { playSound, loadSoundSettings } from './sounds';
import { Confirm, UtilityDialog } from './xp-dialogs';
import {
  ShortcutMenu,
  WallpaperMenu,
  DisplayProperties,
  SystemTray,
  ScreenSaver,
  useIdleSaver,
} from './desktop-extras';
import {
  shortcutIds,
  emptyRecycle,
  parseRecycle,
  recycleAction,
  type ShortcutId,
  type RecycleState,
} from './recycle-state';
import { Startup, PowerDialog, type Phase } from './startup';
import { edges, fitWindow, resizeWindow, type Edge } from './window-geometry';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const BLISS_WALLPAPER_SRC = '/bliss.jpg';

type AppId =
  | 'portfolio'
  | 'welcome'
  | 'browser'
  | 'spotify'
  | 'pinball'
  | 'gta'
  | 'bin';
type Win = {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  min: boolean;
  max: boolean;
  z: number;
};
const labels: Record<AppId, string> = {
  portfolio: 'Internet Explorer',
  welcome: 'My Computer',
  browser: 'Google Chrome',
  spotify: 'Spotify',
  pinball: '3D Pinball',
  gta: 'GTA Vice City',
  bin: 'Recycle Bin',
};
const icons: Record<AppId, string> = {
  portfolio: 'ie.png',
  welcome: 'computer.png',
  browser: 'chrome.svg',
  spotify: 'spotify.svg',
  pinball: 'pinball.png',
  gta: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Grand_Theft_Auto_Vice_City_logo.svg',
  bin: 'bin-empty.png',
};
function SystemIcon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <img
      className="system-icon"
      src={`/icons/${name}.png`}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}
function AppIcon({ id, size = 32 }: { id: AppId; size?: number }) {
  const icon = icons[id];
  return (
    <img
      className="app-icon"
      src={icon.startsWith('http') ? icon : `/icons/${icon}`}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}
function BrowserApp() {
  const [address, setAddress] = useState('https://www.google.com'),
    [pages, setPages] = useState<string[]>([]),
    [index, setIndex] = useState(-1),
    [recent, setRecent] = useState<string[]>([]),
    [showHistory, setShowHistory] = useState(false),
    [reload, setReload] = useState(0),
    [invalid, setInvalid] = useState('');
  const current = pages[index] || '';
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('xp-browser-history') || '[]');
      if (Array.isArray(r))
        setRecent(
          r
            .filter((v) => typeof v === 'string' && /^https?:\/\//.test(v))
            .slice(0, 30),
        );
    } catch {}
  }, []);
  function navigate(raw: string) {
    let value = raw.trim();
    if (!value) return;
    let url: string;
    try {
      if (!value.includes('.') && !/^https?:/i.test(value))
        url = 'https://www.google.com/search?q=' + encodeURIComponent(value);
      else {
        if (!/^[a-z][a-z\d+.-]*:/i.test(value)) value = 'https://' + value;
        const u = new URL(value);
        if (!['http:', 'https:'].includes(u.protocol)) throw Error();
        url = u.href;
      }
    } catch {
      setInvalid('Enter a website address or a search.');
      return;
    }
    playSound('navigation');
    setInvalid('');
    setAddress(url);
    const next = [...pages.slice(0, index + 1), url];
    setPages(next);
    setIndex(next.length - 1);
    const r = [url, ...recent.filter((v) => v !== url)].slice(0, 30);
    setRecent(r);
    try {
      localStorage.setItem('xp-browser-history', JSON.stringify(r));
    } catch {}
    setShowHistory(false);
  }
  const embedded =
    current &&
    new URL(current).hostname === 'www.google.com' &&
    new URL(current).pathname === '/'
      ? 'https://www.google.com/webhp?igu=1'
      : current;
  function move(i: number) {
    playSound('navigation');
    setIndex(i);
    setAddress(pages[i]);
  }
  return (
    <div className="browser-app">
      <div className="browser-tools">
        <button
          title="Back"
          aria-label="Back"
          disabled={index <= 0}
          onClick={() => move(index - 1)}
        >
          <SystemIcon name="back" />
        </button>
        <button
          title="Forward"
          aria-label="Forward"
          disabled={index >= pages.length - 1}
          onClick={() => move(index + 1)}
        >
          <SystemIcon name="forward" />
        </button>
        <button
          title="Reload"
          aria-label="Reload"
          disabled={!current}
          onClick={() => {
            playSound('navigation');
            setReload((v) => v + 1);
          }}
        >
          <SystemIcon name="refresh" />
        </button>
        <button
          title="Home"
          aria-label="Browser home"
          onClick={() => {
            if (current) playSound('navigation');
            setIndex(-1);
            setAddress('https://www.google.com');
          }}
        >
          <SystemIcon name="home" />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(address);
          }}
        >
          <span>Address</span>
          <input
            aria-label="Website address or search"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button type="submit">
            <SystemIcon name="go" size={14} /> Go
          </button>
        </form>
        <button
          title="History within this desktop"
          aria-label="Show history"
          onClick={() => setShowHistory((v) => !v)}
        >
          <SystemIcon name="history" />
        </button>
      </div>
      {invalid && <p className="validation">{invalid}</p>}
      <div className="browser-content">
        {showHistory ? (
          <div className="history">
            <h2>Recently visited</h2>
            <p>
              Addresses opened in this desktop, saved only on this device. This
              is not your Chrome browsing history.
            </p>
            {recent.length ? (
              recent.map((u) => (
                <button key={u} onClick={() => navigate(u)}>
                  <SystemIcon name="history" size={16} />
                  {u}
                  <ChevronRight size={15} />
                </button>
              ))
            ) : (
              <p>No visits yet. Open a website to begin.</p>
            )}
            <button
              className="xp-button"
              onClick={() => {
                setRecent([]);
                try {
                  localStorage.removeItem('xp-browser-history');
                } catch {}
              }}
            >
              Clear desktop history
            </button>
          </div>
        ) : current ? (
          <iframe
            key={current + reload}
            src={embedded}
            title="Embedded website"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="browser-home">
            <AppIcon id="browser" size={55} />
            <h2>Google Chrome</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(address);
              }}
            >
              <SystemIcon name="search" size={20} />
              <input
                aria-label="Search the web"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <button type="submit">Go</button>
            </form>
            <button
              className="link-button"
              onClick={() => navigate('https://www.google.com')}
            >
              Open Google <ExternalLink size={13} />
            </button>
          </div>
        )}
      </div>
      <div className="browser-notice">
        <Info size={14} />
        <span>
          Some websites block embedded browsing. Google personalization depends
          on your browser settings.
        </span>
        {current && (
          <a href={current} target="_blank" rel="noopener noreferrer">
            Open in a real tab <ExternalLink size={12} />
          </a>
        )}
      </div>
      <div className="statusbar">
        <span>{current ? 'Embedded browsing' : 'Ready'}</span>
        <span>Internet</span>
      </div>
    </div>
  );
}
function SpotifyApp() {
  const [url, setUrl] = useState(
      'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF',
    ),
    [embed, setEmbed] = useState(
      'https://open.spotify.com/embed/playlist/37i9dQZEVXbMDoHDwVN2tF',
    ),
    [error, setError] = useState('');
  function load(e: React.FormEvent) {
    e.preventDefault();
    try {
      const u = new URL(url);
      const match = u.pathname.match(
        /^\/(?:intl-[^/]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)\/?$/,
      );
      if (u.hostname !== 'open.spotify.com' || !match) throw Error();
      setEmbed(`https://open.spotify.com/embed/${match[1]}/${match[2]}`);
      setError('');
    } catch {
      setError(
        'Paste a Spotify playlist, album, track, artist, or podcast link.',
      );
    }
  }
  return (
    <div className="spotify-app">
      <div className="spotify-heading">
        <AppIcon id="spotify" size={38} />
        <div>
          <h2>Spotify</h2>
        </div>
      </div>
      <form onSubmit={load}>
        <label htmlFor="spotify-link">Open a Spotify link</label>
        <div>
          <input
            id="spotify-link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit">Load</button>
        </div>
      </form>
      {error && <p className="spotify-error">{error}</p>}
      <iframe
        src={embed + '?utm_source=generator&theme=0'}
        title="Spotify player"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
      <p className="spotify-foot">
        Playback and previews are provided by Spotify.{' '}
        <a
          href={embed.replace('/embed/', '/')}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Spotify ↗
        </a>
      </p>
    </div>
  );
}
function PinballApp({ onReady }: { onReady: () => void }) {
  const revealTimer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (revealTimer.current !== null)
        window.clearTimeout(revealTimer.current);
    };
  }, []);
  return (
    <div className="pinball-app">
      <div className="pinball-stage">
        <iframe
          src="https://pinball.alula.me/"
          title="3D Pinball for Windows - Space Cadet"
          allow="autoplay; fullscreen; gamepad"
          referrerPolicy="no-referrer"
          onLoad={() => {
            if (revealTimer.current !== null)
              window.clearTimeout(revealTimer.current);
            revealTimer.current = window.setTimeout(onReady, 1200);
          }}
        />
      </div>
    </div>
  );
}
const GTA_URL = 'https://quenqgta.com/gta-vice-city-online';
function GtaApp() {
  const [failed, setFailed] = useState(false);
  const fallbackTimer = useRef<number | null>(null);
  useEffect(() => {
    fallbackTimer.current = window.setTimeout(() => setFailed(true), 12000);
    return () => {
      if (fallbackTimer.current !== null)
        window.clearTimeout(fallbackTimer.current);
    };
  }, []);
  return (
    <div className="gta-app">
      <iframe
        src={GTA_URL}
        title="Grand Theft Auto: Vice City"
        allow="autoplay; fullscreen; gamepad; keyboard-map"
        allowFullScreen
        onLoad={() => {
          if (fallbackTimer.current !== null)
            window.clearTimeout(fallbackTimer.current);
        }}
        onError={() => setFailed(true)}
      />
      {failed && (
        <a href={GTA_URL} target="_blank" rel="noopener noreferrer">
          Open GTA Vice City
        </a>
      )}
    </div>
  );
}
type ExplorerLocation = string;
type ExplorerView = 'thumbnails' | 'tiles' | 'icons' | 'list' | 'details';
const explorerFolders: Record<string, string[]> = {
  documents: [
    'My Music',
    'My Pictures',
    'School Work',
    'Tax Receipts',
    'Weekend Photos',
  ],
  'documents/My Music': [
    'Downloaded Music',
    'Road Trip Mixes',
    'Shared Playlists',
  ],
  'documents/My Pictures': ['Family Photos', 'Holiday 2004', 'Wallpapers'],
  'documents/My Videos': ['Camcorder Clips', 'Family Movies', 'Holiday Videos'],
  'documents/School Work': ['Assignments', 'Research Notes', 'Presentations'],
  disk: [
    'Documents and Settings',
    'Program Files',
    'WINDOWS',
    'Drivers',
    'Installers',
  ],
  'disk/Documents and Settings': ['All Users', 'Guest', 'Default User'],
  'disk/Program Files': [
    'Common Files',
    'Internet Explorer',
    'Windows Media Player',
  ],
  'disk/WINDOWS': ['Fonts', 'Help', 'System32', 'Temp'],
  floppy: ['Boot Files', 'Old Documents', 'Utilities'],
  dvd: ['Driver Recovery', 'Support Tools', 'User Manuals'],
};
const explorerRootNames: Record<string, string> = {
  computer: 'My Computer',
  documents: "Guest's Documents",
  disk: 'Local Disk (C:)',
  floppy: '3½ Floppy (A:)',
  dvd: 'DVD Drive (D:)',
};
function explorerTitle(location: ExplorerLocation) {
  return (
    explorerRootNames[location] || location.split('/').at(-1) || 'My Computer'
  );
}
function parentLocation(location: ExplorerLocation): ExplorerLocation {
  if (location === 'computer') return 'computer';
  if (!location.includes('/')) return 'computer';
  return location.slice(0, location.lastIndexOf('/'));
}
function explorerAddress(location: ExplorerLocation) {
  if (location === 'computer') return 'My Computer';
  if (location.startsWith('disk'))
    return `C:\\${location.slice(4).replaceAll('/', '\\')}`.replace(/\\$/, '');
  if (location.startsWith('floppy'))
    return `A:\\${location.slice(7).replaceAll('/', '\\')}`.replace(/\\$/, '');
  if (location.startsWith('dvd'))
    return `D:\\${location.slice(4).replaceAll('/', '\\')}`.replace(/\\$/, '');
  return `C:\\Documents and Settings\\Guest\\My Documents${location.slice(9).replaceAll('/', '\\')}`;
}
function explorerDetails(location: ExplorerLocation) {
  if (location === 'computer') return ['System Folder'];
  if (location === 'disk')
    return [
      'Local Disk',
      'File System: NTFS',
      'Free Space: 19.91 GB',
      'Total Size: 20.00 GB',
    ];
  if (location === 'floppy')
    return [
      '3½-Inch Floppy Disk',
      'File System: FAT',
      'Free Space: 1.38 MB',
      'Total Size: 1.44 MB',
    ];
  if (location === 'dvd') return ['DVD Drive', 'CD Drive'];
  return ['File Folder', 'Date Modified: Thursday, 10 September 2026, 2:49 PM'];
}
function ComputerApp({
  location,
  onLocation,
  onClose,
}: {
  location: ExplorerLocation;
  onLocation: (location: ExplorerLocation) => void;
  onClose: () => void;
}) {
  const [back, setBack] = useState<ExplorerLocation[]>([]);
  const [forward, setForward] = useState<ExplorerLocation[]>([]);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState<ExplorerView>('tiles');
  const [busy, setBusy] = useState(false);
  const navigationTimer = useRef<number | null>(null);
  const [openMenu, setOpenMenu] = useState<
    'file' | 'edit' | 'view' | 'favorites' | 'tools' | 'help' | null
  >(null);
  const title = explorerTitle(location);
  useEffect(() => {
    try {
      const savedView = localStorage.getItem('xp-explorer-view');
      if (
        savedView &&
        ['thumbnails', 'tiles', 'icons', 'list', 'details'].includes(savedView)
      )
        setView(savedView as ExplorerView);
    } catch {}
  }, []);
  useEffect(
    () => () => {
      if (navigationTimer.current !== null)
        window.clearTimeout(navigationTimer.current);
    },
    [],
  );
  function runExplorerTask(delay: number, task: () => void) {
    if (busy) return;
    setBusy(true);
    setOpenMenu(null);
    navigationTimer.current = window.setTimeout(() => {
      task();
      setBusy(false);
      navigationTimer.current = null;
    }, delay);
  }
  function navigationDelay(next: ExplorerLocation) {
    return next.startsWith('floppy') || next.startsWith('dvd') ? 820 : 240;
  }
  function changeView(next: ExplorerView) {
    if (next === view) return;
    runExplorerTask(180, () => {
      setView(next);
      try {
        localStorage.setItem('xp-explorer-view', next);
      } catch {}
    });
  }
  function navigate(next: ExplorerLocation) {
    if (next === location || busy) return;
    runExplorerTask(navigationDelay(next), () => {
      setBack((items) => [...items, location].slice(-20));
      setForward([]);
      setSelected('');
      onLocation(next);
      playSound('navigation');
    });
  }
  function goBack() {
    const next = back.at(-1);
    if (!next || busy) return;
    runExplorerTask(navigationDelay(next), () => {
      setBack((items) => items.slice(0, -1));
      setForward((items) => [location, ...items]);
      setSelected('');
      onLocation(next);
      playSound('navigation');
    });
  }
  function goForward() {
    const next = forward[0];
    if (!next || busy) return;
    runExplorerTask(navigationDelay(next), () => {
      setForward((items) => items.slice(1));
      setBack((items) => [...items, location]);
      setSelected('');
      onLocation(next);
      playSound('navigation');
    });
  }
  function menuProps(menu: NonNullable<typeof openMenu>) {
    return {
      modal: false,
      open: openMenu === menu,
      onOpenChange: (open: boolean) =>
        setOpenMenu((current) =>
          open ? menu : current === menu ? null : current,
        ),
    };
  }
  function switchOpenMenu(menu: NonNullable<typeof openMenu>) {
    if (openMenu && openMenu !== menu) setOpenMenu(menu);
  }
  const item = (
    icon: string,
    label: string,
    detail: string,
    target?: ExplorerLocation,
    size = '',
  ) => (
    <button
      className={`explorer-item ${selected === label ? 'selected' : ''}`}
      key={label}
      aria-pressed={selected === label}
      onDoubleClick={() => target && navigate(target)}
      onClick={() => {
        setSelected(label);
        if (target && matchMedia('(pointer: coarse)').matches) navigate(target);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && target) navigate(target);
      }}
    >
      <SystemIcon name={icon} size={48} />
      <span className="explorer-item-copy">
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <small className="explorer-item-size">{size}</small>
    </button>
  );
  return (
    <div
      className={`computer-app ${busy ? 'explorer-busy' : ''}`}
      aria-busy={busy}
    >
      <div className="explorer-menubar">
        <DropdownMenu {...menuProps('file')}>
          <DropdownMenuTrigger onPointerEnter={() => switchOpenMenu('file')}>
            File
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="xp-explorer-menu"
            side="bottom"
            sideOffset={0}
            align="start"
          >
            <DropdownMenuItem disabled>Create Shortcut</DropdownMenuItem>
            <DropdownMenuItem disabled>Delete</DropdownMenuItem>
            <DropdownMenuItem disabled>Rename</DropdownMenuItem>
            <DropdownMenuItem disabled>Properties</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClose}>Close</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu {...menuProps('edit')}>
          <DropdownMenuTrigger onPointerEnter={() => switchOpenMenu('edit')}>
            Edit
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="xp-explorer-menu"
            side="bottom"
            sideOffset={0}
            align="start"
          >
            <DropdownMenuItem disabled>Undo</DropdownMenuItem>
            <DropdownMenuItem disabled>Redo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Cut</DropdownMenuItem>
            <DropdownMenuItem disabled>Copy</DropdownMenuItem>
            <DropdownMenuItem disabled>Paste</DropdownMenuItem>
            <DropdownMenuItem disabled>Paste Shortcut</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Select All</DropdownMenuItem>
            <DropdownMenuItem disabled>Invert Selection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu {...menuProps('view')}>
          <DropdownMenuTrigger onPointerEnter={() => switchOpenMenu('view')}>
            View
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="xp-explorer-menu"
            side="bottom"
            sideOffset={0}
            align="start"
          >
            <DropdownMenuItem disabled>Toolbars</DropdownMenuItem>
            <DropdownMenuItem disabled>Status Bar</DropdownMenuItem>
            <DropdownMenuItem disabled>Explorer Bar</DropdownMenuItem>
            <DropdownMenuSeparator />
            {(
              [
                'thumbnails',
                'tiles',
                'icons',
                'list',
                'details',
              ] as ExplorerView[]
            ).map((mode) => (
              <DropdownMenuItem key={mode} onClick={() => changeView(mode)}>
                <span className="view-dot">{view === mode ? '•' : ''}</span>
                {mode[0].toUpperCase() + mode.slice(1)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Arrange Icons by…</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Choose Details…</DropdownMenuItem>
            <DropdownMenuItem disabled>Go To…</DropdownMenuItem>
            <DropdownMenuItem disabled>Refresh</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu {...menuProps('favorites')}>
          <DropdownMenuTrigger
            onPointerEnter={() => switchOpenMenu('favorites')}
          >
            Favorites
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="xp-explorer-menu"
            side="bottom"
            sideOffset={0}
            align="start"
          >
            <DropdownMenuItem disabled>Add to Favorites…</DropdownMenuItem>
            <DropdownMenuItem disabled>Organize Favorites…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu {...menuProps('tools')}>
          <DropdownMenuTrigger onPointerEnter={() => switchOpenMenu('tools')}>
            Tools
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="xp-explorer-menu"
            side="bottom"
            sideOffset={0}
            align="start"
          >
            <DropdownMenuItem disabled>Map Network Drive…</DropdownMenuItem>
            <DropdownMenuItem disabled>
              Disconnect Network Drive…
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Synchronize…</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Folder Options…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu {...menuProps('help')}>
          <DropdownMenuTrigger onPointerEnter={() => switchOpenMenu('help')}>
            Help
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="xp-explorer-menu"
            side="bottom"
            sideOffset={0}
            align="start"
          >
            <DropdownMenuItem disabled>
              Help and Support Center
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              Is this copy of Windows legal?
            </DropdownMenuItem>
            <DropdownMenuItem disabled>About Windows</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <img
          className="explorer-windows-mark"
          src="/icons/windows.png"
          alt=""
        />
      </div>
      <div className="explorer-toolbar">
        <button
          disabled={busy || !back.length}
          aria-label="Back"
          onClick={goBack}
        >
          <SystemIcon name="back" />
          <b>Back</b>
        </button>
        <button
          disabled={busy || !forward.length}
          aria-label="Forward"
          onClick={goForward}
        >
          <SystemIcon name="forward" />
        </button>
        <button
          disabled={busy || location === 'computer'}
          aria-label="Up"
          onClick={() => navigate(parentLocation(location))}
        >
          <SystemIcon name="up" />
        </button>
        <span className="toolbar-rule" />
        <button disabled>
          <SystemIcon name="search" />
          <b>Search</b>
        </button>
        <button disabled>
          <SystemIcon name="folder" />
          <b>Folders</b>
        </button>
        <span className="toolbar-rule" />
        <DropdownMenu>
          <DropdownMenuTrigger
            className="explorer-view-button"
            aria-label="Change view"
            disabled={busy}
          >
            <img
              className="explorer-view-glyph"
              src="/icons/xp-view.png"
              alt=""
            />
            <img
              className="explorer-view-arrow"
              src="/icons/xp-view-arrow.png"
              alt=""
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="xp-explorer-menu view-menu"
            side="bottom"
            sideOffset={0}
            align="start"
          >
            {(
              [
                'thumbnails',
                'tiles',
                'icons',
                'list',
                'details',
              ] as ExplorerView[]
            ).map((mode) => (
              <DropdownMenuItem key={mode} onClick={() => changeView(mode)}>
                <span className="view-dot">{view === mode ? '•' : ''}</span>
                {mode[0].toUpperCase() + mode.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="computer-address">
        <span>Address</span>
        <div>
          <SystemIcon name="computer" size={16} />
          {explorerAddress(location)}
        </div>
        <button className="explorer-go" onClick={() => navigate('computer')}>
          <SystemIcon name="go" size={17} /> Go
        </button>
      </div>
      <div className="computer-body">
        <aside>
          <section className="explorer-pane">
            <h2>System Tasks</h2>
            <button disabled>
              <SystemIcon name="user" size={17} /> Account Manager
            </button>
            <button disabled>
              <SystemIcon name="desktop" size={17} /> Control Panel
            </button>
          </section>
          <section className="explorer-pane">
            <h2>Other Places</h2>
            <button onClick={() => navigate('documents')}>
              <SystemIcon name="xp-folder" size={17} /> My Documents
            </button>
            <button onClick={() => navigate('documents/My Pictures')}>
              <SystemIcon name="xp-folder" size={17} /> My Pictures
            </button>
            <button onClick={() => navigate('documents/My Music')}>
              <SystemIcon name="xp-folder" size={17} /> My Music
            </button>
            <button onClick={() => navigate('documents/My Videos')}>
              <SystemIcon name="xp-folder" size={17} /> My Videos
            </button>
          </section>
          <section className="explorer-pane explorer-details">
            <h2>Details</h2>
            <strong>{title}</strong>
            {explorerDetails(location).map((line) => (
              <small
                className={
                  line.startsWith('Date Modified') ? 'details-date' : ''
                }
                key={line}
              >
                {line}
              </small>
            ))}
          </section>
        </aside>
        <div
          className={`computer-files view-${view}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected('');
          }}
        >
          {location === 'computer' ? (
            <>
              <h2>Files Stored on This Computer</h2>
              <div className="explorer-items">
                {item(
                  'xp-folder',
                  "Guest's Documents",
                  'File Folder',
                  'documents',
                )}
              </div>
              <h2>Hard Disk Drives</h2>
              <div className="explorer-items">
                {item(
                  'xp-hard-drive',
                  'Local Disk (C:)',
                  'Local Disk',
                  'disk',
                  '18.4 GB free',
                )}
              </div>
              <h2>Devices with Removable Storage</h2>
              <div className="explorer-items drive-row">
                {item(
                  'xp-floppy',
                  '3½ Floppy (A:)',
                  '3½-Inch Floppy Disk',
                  'floppy',
                  '1.44 MB',
                )}
                {item('xp-dvd', 'DVD Drive (D:)', 'DVD Drive', 'dvd')}
              </div>
            </>
          ) : (
            <>
              {view === 'details' && (
                <div className="explorer-details-header">
                  <span>Name</span>
                  <span>Type</span>
                  <span>Size</span>
                </div>
              )}
              <div className="explorer-items folder-grid">
                {(explorerFolders[location] || []).map((folder) =>
                  item(
                    'xp-folder',
                    folder,
                    'File folder',
                    `${location}/${folder}`,
                  ),
                )}
              </div>
              {!explorerFolders[location]?.length && (
                <p className="empty-folder">This folder is empty.</p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="statusbar">
        <span>
          {location === 'computer'
            ? '4 objects'
            : `${explorerFolders[location]?.length || 0} objects`}
        </span>
        <span>My Computer</span>
      </div>
    </div>
  );
}
function Desktop({ onPhase }: { onPhase: (phase: Phase) => void }) {
  const [windows, setWindows] = useState<Win[]>([]),
    [active, setActive] = useState<AppId | null>('portfolio'),
    [clock, setClock] = useState(''),
    [date, setDate] = useState(''),
    [dragging, setDragging] = useState(false),
    [powerOpen, setPowerOpen] = useState(false);
  const [recycle, setRecycle] = useState<RecycleState>(emptyRecycle);
  const [pending, setPending] = useState<
    | { kind: 'delete'; id: ShortcutId }
    | { kind: 'empty' | 'logoff' | 'restart' }
    | null
  >(null);
  const [properties, setProperties] = useState<AppId | 'display' | null>(null),
    [wallpaper, setWallpaper] = useState('bliss'),
    [sorted, setSorted] = useState(false),
    [refreshKey, setRefreshKey] = useState(0),
    [iconsRefreshing, setIconsRefreshing] = useState(false),
    [launchingApps, setLaunchingApps] = useState<AppId[]>([]),
    [pinballReady, setPinballReady] = useState(false),
    [explorerLocation, setExplorerLocation] =
      useState<ExplorerLocation>('computer');
  const [portfolioTitle, setPortfolioTitle] = useState('Chenuka Jayathilake');
  const [saver, setSaver] = useIdleSaver();
  useEffect(() => {
    try {
      setRecycle(parseRecycle(localStorage.getItem('xp-recycle-bin')));
    } catch {}
    try {
      setWallpaper(
        localStorage.getItem('xp-wallpaper') === 'none' ? 'none' : 'bliss',
      );
    } catch {}
    try {
      const savedLocation = localStorage.getItem('xp-explorer-location');
      if (
        savedLocation &&
        /^(computer|documents|disk|floppy|dvd)(\/.*)?$/.test(savedLocation)
      )
        setExplorerLocation(savedLocation);
    } catch {}
  }, []);
  function changeExplorerLocation(location: ExplorerLocation) {
    setExplorerLocation(location);
    try {
      localStorage.setItem('xp-explorer-location', location);
    } catch {}
  }
  function changeRecycle(
    action: 'delete' | 'restore' | 'empty',
    id?: ShortcutId,
  ) {
    setRecycle((prev) => {
      const next = recycleAction(prev, action, id);
      try {
        localStorage.setItem('xp-recycle-bin', JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  function requestDelete(id: ShortcutId) {
    setPending({ kind: 'delete', id });
    playSound('warning');
  }
  function emptyBin() {
    if (recycle.trashed.length) {
      setPending({ kind: 'empty' });
      playSound('warning');
    }
  }
  function logoff() {
    setPending({ kind: 'logoff' });
    playSound('warning');
  }
  function restart() {
    setPending({ kind: 'restart' });
    playSound('warning');
  }
  function confirmAction() {
    if (!pending) return;
    if (pending.kind === 'delete') {
      changeRecycle('delete', pending.id);
    } else if (pending.kind === 'empty') {
      changeRecycle('empty');
      playSound('recycle');
    } else if (pending.kind === 'restart') {
      playSound('shutdown');
      onPhase('restart');
    } else {
      playSound('logoff');
      onPhase('logoff');
    }
    setPending(null);
  }
  function changeWallpaper(value: string) {
    setWallpaper(value);
    try {
      localStorage.setItem('xp-wallpaper', value);
    } catch {}
  }
  const visibleShortcuts: AppId[] = [
    ...shortcutIds.filter(
      (id) => !recycle.trashed.includes(id) && !recycle.removed.includes(id),
    ),
    'bin',
  ];
  if (sorted)
    visibleShortcuts.sort((a, b) => labels[a].localeCompare(labels[b]));
  const layer = useRef(10),
    drag = useRef<{
      id: AppId;
      kind: 'move' | Edge;
      mx: number;
      my: number;
      win: Win;
    } | null>(null);
  const currentWindows = useRef(windows);
  const launchTimers = useRef(new Map<AppId, number>());
  const refreshTimer = useRef<number | null>(null);
  currentWindows.current = windows;
  function showWindow(id: AppId) {
    if (
      (id === 'welcome' || id === 'bin') &&
      !currentWindows.current.some((w) => w.id === id)
    )
      playSound('navigation');
    const z = ++layer.current;
    setWindows((ws) => {
      const old = ws.find((w) => w.id === id);
      if (old)
        return ws.map((w) =>
          w.id === id
            ? { ...w, min: false, max: id === 'pinball' ? false : w.max, z }
            : w,
        );
      const w =
          id === 'spotify'
            ? 620
            : id === 'pinball'
              ? 610
              : id === 'welcome'
                ? 760
                : 880,
        h =
          id === 'spotify'
            ? 620
            : id === 'pinball'
              ? 483
              : id === 'welcome'
                ? 560
                : 580;
      const bounds =
        id === 'pinball'
          ? {
              x: Math.max(0, (innerWidth - w) / 2),
              y: Math.max(0, (innerHeight - 34 - h) / 2),
              w,
              h,
            }
          : fitWindow(
              {
                x: (innerWidth - w) / 2 + ws.length * 22,
                y: (innerHeight - h) / 2 - 30 + ws.length * 15,
                w,
                h,
              },
              innerWidth,
              innerHeight - 34,
            );
      return [
        ...ws,
        {
          id,
          ...bounds,
          min: false,
          max: id === 'portfolio' || (id !== 'pinball' && innerWidth < 650),
          z,
        },
      ];
    });
    setActive(id);
  }
  function open(id: AppId) {
    if (currentWindows.current.some((window) => window.id === id)) {
      showWindow(id);
      return;
    }
    if (launchTimers.current.has(id)) return;
    setLaunchingApps((apps) => (apps.includes(id) ? apps : [...apps, id]));
    if (id === 'pinball') setPinballReady(false);
    const timer = window.setTimeout(
      () => {
        launchTimers.current.delete(id);
        if (id !== 'pinball')
          setLaunchingApps((apps) => apps.filter((app) => app !== id));
        showWindow(id);
      },
      id === 'welcome' ? 520 : id === 'pinball' ? 180 : 680,
    );
    launchTimers.current.set(id, timer);
  }
  useEffect(() => {
    showWindow('portfolio');
  }, []);
  const finishPinballLaunch = useCallback(() => {
    setPinballReady(true);
    setLaunchingApps((apps) => apps.filter((app) => app !== 'pinball'));
  }, []);
  useEffect(
    () => () => {
      launchTimers.current.forEach((timer) => window.clearTimeout(timer));
      launchTimers.current.clear();
      if (refreshTimer.current !== null)
        window.clearTimeout(refreshTimer.current);
    },
    [],
  );
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setClock(
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      );
      setDate(
        d.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      );
    };
    update();
    const timer = setInterval(update, 1000);
    const fit = () => {
      drag.current = null;
      setDragging(false);
      setWindows((ws) =>
        ws.map((w) =>
          w.id === 'pinball'
            ? {
                ...w,
                w: 610,
                h: 483,
                x: Math.max(0, Math.min(w.x, innerWidth - 610)),
                y: Math.max(0, Math.min(w.y, innerHeight - 34 - 483)),
                max: false,
              }
            : { ...w, ...fitWindow(w, innerWidth, innerHeight - 34) },
        ),
      );
    };
    window.addEventListener('resize', fit);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', fit);
    };
  }, []);
  useEffect(() => {
    const ctx = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const life = new AbortController();
    try {
      Promise.resolve(
        ctx.registerTool(
          {
            name: 'open_desktop_app',
            description:
              'Open or restore the portfolio, My Computer, Google Chrome, Spotify, 3D Pinball, or GTA Vice City in the signed-in Guest desktop.',
            inputSchema: {
              type: 'object',
              properties: {
                app: {
                  type: 'string',
                  enum: [
                    'portfolio',
                    'welcome',
                    'browser',
                    'spotify',
                    'pinball',
                    'gta',
                  ],
                },
              },
              required: ['app'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input: unknown) => {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).length !== 1
              )
                throw new Error('Expected one app');
              const id = (input as { app?: unknown }).app;
              if (
                id !== 'portfolio' &&
                id !== 'welcome' &&
                id !== 'browser' &&
                id !== 'spotify' &&
                id !== 'pinball' &&
                id !== 'gta'
              )
                throw new Error('Unknown application');
              open(id);
              await new Promise((resolve) => window.setTimeout(resolve, 750));
              return { opened: id };
            },
          },
          { signal: life.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => life.abort();
  }, []);
  function focus(id: AppId) {
    setActive(id);
    const z = ++layer.current;
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z } : w)));
  }
  function update(id: AppId, p: Partial<Win>) {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w)));
  }
  function close(id: AppId) {
    setWindows((ws) => ws.filter((w) => w.id !== id));
    if (id === 'pinball') {
      setPinballReady(false);
      setLaunchingApps((apps) => apps.filter((app) => app !== 'pinball'));
    }
    if (active === id) setActive(null);
  }
  function start(e: React.PointerEvent, w: Win, kind: 'move' | Edge) {
    if (w.max || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    focus(w.id);
    drag.current = {
      id: w.id,
      kind,
      mx: e.clientX,
      my: e.clientY,
      win: { ...w },
    };
    setDragging(true);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.mx,
      dy = e.clientY - d.my;
    if (d.kind === 'move')
      update(
        d.id,
        fitWindow(
          { ...d.win, x: d.win.x + dx, y: d.win.y + dy },
          innerWidth,
          innerHeight - 34,
        ),
      );
    else
      update(
        d.id,
        resizeWindow(d.win, d.kind, dx, dy, innerWidth, innerHeight - 34),
      );
  }
  function end() {
    drag.current = null;
    setDragging(false);
  }
  function keyboardResize(e: React.KeyboardEvent, w: Win, edge: Edge) {
    const amount = e.shiftKey ? 20 : 10;
    const dx =
        e.key === 'ArrowRight' ? amount : e.key === 'ArrowLeft' ? -amount : 0,
      dy = e.key === 'ArrowDown' ? amount : e.key === 'ArrowUp' ? -amount : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    update(w.id, resizeWindow(w, edge, dx, dy, innerWidth, innerHeight - 34));
  }
  function refreshDesktop() {
    if (refreshTimer.current !== null)
      window.clearTimeout(refreshTimer.current);
    setIconsRefreshing(true);
    refreshTimer.current = window.setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIconsRefreshing(false);
      refreshTimer.current = null;
    }, 90);
  }
  const windowLabel = (id: AppId) =>
    id === 'portfolio'
      ? `${portfolioTitle} - Microsoft Internet Explorer`
      : id === 'welcome'
        ? explorerTitle(explorerLocation)
        : id === 'pinball'
          ? '3D Pinball for Windows - Space Cadet'
          : id === 'gta'
            ? 'Grand Theft Auto: Vice City'
            : labels[id];
  return (
    <main
      className={`desktop ${launchingApps.length ? 'app-starting' : ''}`}
      style={
        wallpaper === 'none'
          ? { backgroundImage: 'none', backgroundColor: '#004e98' }
          : undefined
      }
    >
      <WallpaperMenu
        onArrange={() => setSorted(true)}
        onRefresh={refreshDesktop}
        onProperties={() => setProperties('display')}
        onCreate={(id) => changeRecycle('restore', id)}
      />
      <div
        className={`desktop-shortcuts ${iconsRefreshing ? 'refreshing' : ''}`}
        key={refreshKey}
      >
        {visibleShortcuts.map((id) => (
          <ShortcutMenu
            key={id}
            id={id}
            onOpen={() => open(id)}
            onDelete={() => {
              if (id !== 'bin') requestDelete(id);
            }}
            onProperties={() => setProperties(id)}
            onEmpty={emptyBin}
            empty={!recycle.trashed.length}
          >
            <button
              onDoubleClick={() => open(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') open(id);
                if (e.key === 'Delete' && id !== 'bin') requestDelete(id);
              }}
              onClick={() => {
                if (matchMedia('(pointer:coarse)').matches) open(id);
              }}
              title={`Double-click to open ${labels[id]}`}
            >
              {id === 'bin' ? (
                <SystemIcon
                  name={recycle.trashed.length ? 'bin-full' : 'bin-empty'}
                  size={32}
                />
              ) : (
                <AppIcon id={id} />
              )}
              <span>{labels[id]}</span>
            </button>
          </ShortcutMenu>
        ))}
      </div>
      {windows.map((w) => (
        <section
          key={w.id}
          className={`xp-window ${w.id === 'pinball' ? 'pinball-window' : ''} ${w.id === 'pinball' && !pinballReady ? 'pinball-loading' : ''} ${active === w.id ? 'active' : ''} ${w.id !== 'pinball' && w.max ? 'maximized' : ''}`}
          style={{
            left: w.id !== 'pinball' && w.max ? 0 : w.x,
            top: w.id !== 'pinball' && w.max ? 0 : w.y,
            width: w.id !== 'pinball' && w.max ? '100%' : w.w,
            height: w.id !== 'pinball' && w.max ? 'calc(100% - 34px)' : w.h,
            zIndex: w.z,
            display: w.min ? 'none' : undefined,
          }}
          onPointerDownCapture={() => {
            if (active !== w.id) focus(w.id);
          }}
          aria-label={windowLabel(w.id)}
        >
          <header
            className="titlebar"
            onDoubleClick={(e) => {
              if (
                w.id !== 'pinball' &&
                !(e.target as HTMLElement).closest('button')
              )
                update(w.id, { max: !w.max });
            }}
            onPointerDown={(e) => {
              if (!(e.target as HTMLElement).closest('button'))
                start(e, w, 'move');
            }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onLostPointerCapture={end}
          >
            <div>
              {w.id === 'welcome' && explorerLocation !== 'computer' ? (
                <SystemIcon name="xp-folder" size={16} />
              ) : (
                <AppIcon id={w.id} size={16} />
              )}
              <h1>{windowLabel(w.id)}</h1>
            </div>
            <nav
              className="window-controls"
              onPointerDown={(e) => {
                e.stopPropagation();
                end();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label={`Minimize ${windowLabel(w.id)}`}
                onClick={() => {
                  update(w.id, { min: true });
                  setActive(null);
                }}
              >
                <Minus size={17} />
              </button>
              <button
                type="button"
                aria-label={`${w.max ? 'Restore' : 'Maximize'} ${windowLabel(w.id)}`}
                disabled={w.id === 'pinball'}
                onClick={() => update(w.id, { max: !w.max })}
              >
                {w.max ? <Copy size={13} /> : <Square size={13} />}
              </button>
              <button
                className="close"
                type="button"
                aria-label={`Close ${windowLabel(w.id)}`}
                onClick={() => close(w.id)}
              >
                <X size={19} />
              </button>
            </nav>
          </header>
          <div className="window-content">
            {w.id === 'portfolio' ? (
              <InternetExplorer
                onTitleChange={setPortfolioTitle}
                onClose={() => close('portfolio')}
              />
            ) : w.id === 'browser' ? (
              <BrowserApp />
            ) : w.id === 'spotify' ? (
              <SpotifyApp />
            ) : w.id === 'pinball' ? (
              <PinballApp onReady={finishPinballLaunch} />
            ) : w.id === 'gta' ? (
              <GtaApp />
            ) : w.id === 'bin' ? (
              <div className="recycle-app">
                <div className="recycle-toolbar">
                  <button
                    className="xp-button"
                    disabled={!recycle.trashed.length}
                    onClick={() => {
                      recycle.trashed.forEach((id) =>
                        changeRecycle('restore', id),
                      );
                    }}
                  >
                    Restore all items
                  </button>
                  <button
                    className="xp-button"
                    disabled={!recycle.trashed.length}
                    onClick={emptyBin}
                  >
                    Empty Recycle Bin
                  </button>
                </div>
                <div className="recycle-items">
                  {recycle.trashed.map((id) => (
                    <div className="recycle-row" key={id}>
                      <AppIcon id={id} />
                      <span>
                        {labels[id]}
                        <small>Original location: Desktop</small>
                      </span>
                      <button
                        className="xp-button"
                        onClick={() => {
                          changeRecycle('restore', id);
                        }}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
                <div className="statusbar">
                  {recycle.trashed.length} objects
                </div>
              </div>
            ) : (
              <ComputerApp
                location={explorerLocation}
                onLocation={changeExplorerLocation}
                onClose={() => close('welcome')}
              />
            )}
          </div>
          {dragging && <div className="iframe-shield" />}
          {!w.max &&
            w.id !== 'pinball' &&
            edges.map((edge) => (
              <button
                key={edge}
                className={`window-resizer resize-${edge}`}
                aria-label={`Resize ${windowLabel(w.id)} ${edge}`}
                title="Drag to resize; use arrow keys when focused"
                onPointerDown={(e) => start(e, w, edge)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onLostPointerCapture={end}
                onKeyDown={(e) => keyboardResize(e, w, edge)}
              />
            ))}
        </section>
      ))}
      <footer className="taskbar">
        <DropdownMenu>
          <DropdownMenuTrigger className="start-button" aria-label="Start">
            <img src="/icons/start.png" alt="start" draggable={false} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="start-menu"
            side="top"
            sideOffset={0}
            align="start"
          >
            <div className="start-user">
              <img src="/icons/user.png" alt="" />
              Guest
            </div>
            <div className="start-columns">
              <div className="start-primary">
                {(
                  [
                    'portfolio',
                    'browser',
                    'spotify',
                    'pinball',
                    'gta',
                  ] as AppId[]
                ).map((id) => (
                  <DropdownMenuItem
                    key={id}
                    className="start-item"
                    onClick={() => open(id)}
                  >
                    <AppIcon id={id} size={30} />
                    <span>
                      <b>{labels[id]}</b>
                      <small>
                        {id === 'portfolio'
                          ? 'Internet'
                          : id === 'browser'
                            ? 'Internet'
                            : id === 'spotify'
                              ? 'Music'
                              : 'Game'}
                      </small>
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="start-secondary">
                <DropdownMenuItem
                  className="start-item"
                  onClick={() => open('welcome')}
                >
                  <AppIcon id="welcome" size={24} />
                  My Computer
                </DropdownMenuItem>
              </div>
            </div>
            <div className="start-footer">
              <DropdownMenuItem className="session-action" onClick={logoff}>
                <img className="session-icon" src="/icons/logoff.png" alt="" />
                Log Off
              </DropdownMenuItem>
              <DropdownMenuItem className="session-action" onClick={restart}>
                <img className="session-icon" src="/icons/restart.ico" alt="" />
                Restart
              </DropdownMenuItem>
              <DropdownMenuItem
                className="session-action"
                onClick={() => setPowerOpen(true)}
              >
                <img
                  className="session-icon"
                  src="/icons/shutdown.png"
                  alt=""
                />
                Turn Off Computer
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="quick-launch">
          <button
            title="Show desktop"
            aria-label="Show desktop"
            onClick={() => {
              setWindows((ws) => ws.map((w) => ({ ...w, min: true })));
              setActive(null);
            }}
          >
            <SystemIcon name="computer" size={20} />
          </button>
        </div>
        <div className="task-buttons">
          {windows.map((w) => (
            <button
              key={w.id}
              className={active === w.id && !w.min ? 'selected' : ''}
              onClick={() => {
                if (active === w.id && !w.min) {
                  update(w.id, { min: true });
                  setActive(null);
                } else open(w.id);
              }}
            >
              {w.id === 'welcome' && explorerLocation !== 'computer' ? (
                <SystemIcon name="xp-folder" size={16} />
              ) : (
                <AppIcon id={w.id} size={16} />
              )}
              <span>{windowLabel(w.id)}</span>
            </button>
          ))}
        </div>
        <SystemTray
          clock={clock}
          date={date}
          onGuest={() => setProperties('welcome')}
        />
      </footer>
      <PowerDialog
        open={powerOpen}
        onOpenChange={setPowerOpen}
        onPower={(restart) => {
          setPowerOpen(false);
          onPhase(restart ? 'restart' : 'shutdown');
        }}
      />
      {pending && (
        <Confirm
          title={
            pending.kind === 'delete'
              ? 'Confirm File Delete'
              : pending.kind === 'empty'
                ? 'Confirm Multiple File Delete'
                : pending.kind === 'restart'
                  ? 'Restart Windows'
                  : 'Log Off Windows'
          }
          message={
            pending.kind === 'delete'
              ? `Are you sure you want to move '${labels[pending.id]}' to the Recycle Bin?`
              : pending.kind === 'empty'
                ? 'Are you sure you want to permanently delete these shortcuts?'
                : pending.kind === 'restart'
                  ? 'Are you sure you want to restart the computer? Any unsaved work will be lost.'
                  : 'Are you sure you want to log off? Any unsaved work will be lost.'
          }
          confirm={
            pending.kind === 'logoff'
              ? 'Log Off'
              : pending.kind === 'restart'
                ? 'Restart'
                : 'Yes'
          }
          onConfirm={confirmAction}
          onCancel={() => setPending(null)}
        />
      )}
      {properties === 'display' ? (
        <DisplayProperties
          wallpaper={wallpaper}
          setWallpaper={changeWallpaper}
          onClose={() => setProperties(null)}
          onPreview={() => {
            setProperties(null);
            setSaver(true);
          }}
        />
      ) : (
        properties && (
          <UtilityDialog
            title={`${labels[properties]} Properties`}
            onClose={() => setProperties(null)}
          >
            <div className="shortcut-properties">
              <AppIcon id={properties} size={32} />
              <strong>{labels[properties]}</strong>
            </div>
            {properties === 'bin' ? (
              <p>
                {recycle.trashed.length} deleted shortcuts. Restore items to
                return them to the Desktop.
              </p>
            ) : (
              <>
                <p>
                  Type:{' '}
                  {properties === 'welcome'
                    ? 'Desktop folder'
                    : 'Application shortcut'}
                </p>
                <p>Location: Desktop</p>
                <p>User: Guest</p>
                {properties !== 'welcome' && (
                  <p>
                    Target:{' '}
                    {properties === 'portfolio'
                      ? 'Chenuka CV and Portfolio'
                      : properties === 'browser'
                        ? 'Google Chrome web window'
                        : properties === 'spotify'
                          ? 'Spotify web player'
                          : '3D Pinball for Windows - Space Cadet'}
                  </p>
                )}
              </>
            )}
          </UtilityDialog>
        )
      )}
      {saver && <ScreenSaver onDismiss={() => setSaver(false)} />}
    </main>
  );
}
export default function Computer() {
  const [phase, setPhase] = useState<Phase>('desktop');
  const [wallpaperReady, setWallpaperReady] = useState(false);
  useEffect(() => {
    loadSoundSettings();
    return connectDesktopBridge();
  }, []);
  useEffect(() => {
    try {
      if (localStorage.getItem('xp-wallpaper') === 'none') {
        setWallpaperReady(true);
        return;
      }
    } catch {}

    let active = true;
    const image = new Image();
    image.src = BLISS_WALLPAPER_SRC;
    const loaded =
      typeof image.decode === 'function'
        ? image.decode().catch(() => undefined)
        : Promise.resolve();

    loaded.then(() => {
      if (active) setWallpaperReady(true);
    });

    return () => {
      active = false;
    };
  }, []);
  return phase === 'desktop' ? (
    wallpaperReady ? (
      <Desktop onPhase={setPhase} />
    ) : (
      <main className="desktop desktop-loading" aria-label="Loading desktop" />
    )
  ) : (
    <Startup phase={phase} onPhase={setPhase} />
  );
}
