'use client';
import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuCheckboxItem,
} from '@/components/ui/context-menu';
import { UtilityDialog } from './xp-dialogs';
import { getSoundSettings, configureSound, playSound } from './sounds';
import { shortcutIds, type ShortcutId } from './recycle-state';
const names = {
  portfolio: 'Internet Explorer',
  pinball: '3D Pinball',
  gta: 'GTA Vice City',
  welcome: 'My Computer',
  browser: 'Google Chrome',
  spotify: 'Spotify',
  bin: 'Recycle Bin',
};
export function ShortcutMenu({
  id,
  children,
  onOpen,
  onDelete,
  onProperties,
  onEmpty,
  empty,
}: {
  id: ShortcutId | 'bin';
  children: React.ReactElement;
  onOpen: () => void;
  onDelete: () => void;
  onProperties: () => void;
  onEmpty: () => void;
  empty: boolean;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="xp-context">
        <ContextMenuItem onClick={onOpen} className="context-default">
          Open
        </ContextMenuItem>
        {id === 'welcome' && (
          <>
            <ContextMenuItem disabled>Search…</ContextMenuItem>
            <ContextMenuItem disabled>Manage</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem disabled>Map Network Drive…</ContextMenuItem>
            <ContextMenuItem disabled>
              Disconnect Network Drive…
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        {id === 'bin' ? (
          <ContextMenuItem disabled={empty} onClick={onEmpty}>
            Empty Recycle Bin
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={onDelete}>Delete</ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onProperties}>Properties</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
export function WallpaperMenu({
  onArrange,
  onRefresh,
  onProperties,
  onCreate,
}: {
  onArrange: () => void;
  onRefresh: () => void;
  onProperties: () => void;
  onCreate: (id: ShortcutId) => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        className="wallpaper-context"
        aria-label="Desktop wallpaper"
      />
      <ContextMenuContent className="xp-context">
        <ContextMenuSub>
          <ContextMenuSubTrigger>Arrange Icons By</ContextMenuSubTrigger>
          <ContextMenuSubContent className="xp-context">
            <ContextMenuItem onClick={onArrange}>Name</ContextMenuItem>
            <ContextMenuItem disabled>Size</ContextMenuItem>
            <ContextMenuItem disabled>Type</ContextMenuItem>
            <ContextMenuItem disabled>Modified</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked disabled>
              Auto Arrange
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem checked disabled>
              Align to Grid
            </ContextMenuCheckboxItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onClick={onRefresh}>Refresh</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>Paste</ContextMenuItem>
        <ContextMenuItem disabled>Paste Shortcut</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>New</ContextMenuSubTrigger>
          <ContextMenuSubContent className="xp-context">
            {shortcutIds.map((id) => (
              <ContextMenuItem key={id} onClick={() => onCreate(id)}>
                {names[id]} Shortcut
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onProperties}>Properties</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
export function DisplayProperties({
  wallpaper,
  setWallpaper,
  onClose,
  onPreview,
}: {
  wallpaper: string;
  setWallpaper: (w: string) => void;
  onClose: () => void;
  onPreview: () => void;
}) {
  return (
    <UtilityDialog title="Display Properties" onClose={onClose}>
      <div
        className="wallpaper-preview"
        style={{
          backgroundImage: wallpaper === 'bliss' ? 'url(/bliss.jpg)' : 'none',
        }}
      />
      <label>
        Background:
        <Select
          value={wallpaper}
          onValueChange={(v) => {
            if (v) setWallpaper(v);
          }}
        >
          <SelectTrigger className="xp-select" aria-label="Desktop background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="xp-context xp-select-content">
            <SelectItem value="bliss">Bliss</SelectItem>
            <SelectItem value="none">(None)</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <div className="screensaver-settings">
        <p>Screen saver: Windows XP</p>
        <p>Wait: 2 minutes</p>
        <button className="xp-button" onClick={onPreview}>
          Preview
        </button>
      </div>
    </UtilityDialog>
  );
}
export function SystemTray({
  clock,
  date,
  onGuest,
}: {
  clock: string;
  date: string;
  onGuest: () => void;
}) {
  const [panel, setPanel] = useState<'volume' | 'help' | 'date' | null>(null),
    [settings, setSettings] = useState(getSoundSettings);
  function change(v: number, m: boolean) {
    configureSound(v, m);
    setSettings({ volume: v, muted: m });
  }
  return (
    <>
      <div className="system-tray">
        <button
          title="Guest account"
          aria-label="Guest account"
          onClick={onGuest}
        >
          <img src="/icons/messenger.png" alt="" />
        </button>
        <button
          title="Windows XP Help"
          aria-label="Desktop help"
          onClick={() => setPanel('help')}
        >
          <img src="/icons/help.png" alt="" />
        </button>
        <button
          title="Volume"
          aria-label="Volume"
          onClick={() => {
            setSettings(getSoundSettings());
            setPanel('volume');
          }}
        >
          <img src="/icons/volume.png" alt="" />
          {settings.muted && <span className="mute-mark">×</span>}
        </button>
        <button
          className="tray-clock"
          title={date}
          onClick={() => setPanel('date')}
        >
          {clock}
        </button>
      </div>
      {panel && (
        <UtilityDialog
          title={
            panel === 'volume'
              ? 'Volume Control'
              : panel === 'help'
                ? 'Help and Support'
                : 'Date and Time'
          }
          onClose={() => setPanel(null)}
        >
          {panel === 'volume' ? (
            <div className="volume-settings">
              <label>Windows sounds</label>
              <Slider
                aria-label="Windows sounds volume"
                value={[Math.round(settings.volume * 100)]}
                min={0}
                max={100}
                onValueChange={(v) =>
                  change((Array.isArray(v) ? v[0] : v) / 100, settings.muted)
                }
              />
              <label>
                <Checkbox
                  checked={settings.muted}
                  onCheckedChange={(v) => change(settings.volume, v)}
                  aria-label="Mute Windows sounds"
                />
                Mute
              </label>
              <button
                className="xp-button"
                onClick={() => playSound('warning')}
              >
                Test sound
              </button>
            </div>
          ) : panel === 'help' ? (
            <>
              <p>
                Double-click an icon to open it. Use the title bar to move a
                window and its borders to resize it.
              </p>
              <p>
                Right-click a shortcut to delete it. Restore deleted shortcuts
                from the Recycle Bin.
              </p>
              <p>
                The Windows XP screen saver starts after two minutes of desktop
                inactivity.
              </p>
            </>
          ) : (
            <>
              <p>{date}</p>
              <p>{clock}</p>
              <p>{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </>
          )}
        </UtilityDialog>
      )}
    </>
  );
}
export function ScreenSaver({
  preview = false,
  onDismiss,
}: {
  preview?: boolean;
  onDismiss: () => void;
}) {
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    surface.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <div
      ref={surface}
      className="xp-screensaver"
      role="button"
      tabIndex={0}
      aria-label="Windows XP screen saver. Move the mouse or press a key to return."
      onPointerMove={onDismiss}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }}
      autoFocus
    >
      <img src="/icons/xp-logo.svg" alt="Windows XP" />
      {preview && <span className="sr-only">Preview</span>}
    </div>
  );
}
export function useIdleSaver() {
  const [active, setActive] = useState(false);
  const last = useRef(Date.now());
  useEffect(() => {
    if (!active) last.current = Date.now();
  }, [active]);
  useEffect(() => {
    const activity = () => {
      last.current = Date.now();
      setActive(false);
    };
    const events = [
      'pointermove',
      'pointerdown',
      'keydown',
      'wheel',
      'touchstart',
      'portfolio-activity',
      'focus',
      'blur',
    ] as const;
    events.forEach((e) =>
      window.addEventListener(e, activity, { passive: true }),
    );
    const tick = setInterval(() => {
      if (document.hidden) {
        last.current = Date.now();
        return;
      }
      if (Date.now() - last.current >= 120000) setActive(true);
    }, 1000);
    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, activity));
    };
  }, []);
  return [active, setActive] as const;
}
