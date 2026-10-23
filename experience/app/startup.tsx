'use client';
import { useEffect, useState } from 'react';
import { playSound } from './sounds';
import { Confirm } from './xp-dialogs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const XP_LOGO_SRC = '/icons/xp-logo.svg';

export type Phase =
  | 'bios'
  | 'bios-devices'
  | 'restart'
  | 'boot'
  | 'prelogin'
  | 'login'
  | 'welcome'
  | 'desktop'
  | 'logoff'
  | 'shutdown'
  | 'off';
export function WindowsLogo({ boot = false }: { boot?: boolean }) {
  return (
    <div className={`windows-logo ${boot ? 'boot-logo' : ''}`}>
      <img
        className="original-xp-logo"
        src={XP_LOGO_SRC}
        alt="Microsoft Windows XP"
        draggable={false}
      />
    </div>
  );
}
export function PowerDialog({
  open,
  onOpenChange,
  onPower,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onPower: (restart: boolean) => void;
}) {
  const [pending, setPending] = useState<boolean | null>(null);
  return (
    <>
      <Dialog open={open && pending === null} onOpenChange={onOpenChange}>
        <DialogContent className="xp-power-dialog" showCloseButton={false}>
          <div className="power-title">
            <DialogTitle>Turn off computer</DialogTitle>
            <img src="/icons/power.png" alt="" />
          </div>
          <div className="power-choices">
            <button
              onClick={() => {
                setPending(false);
                playSound('warning');
              }}
            >
              <img className="session-icon" src="/icons/shutdown.png" alt="" />
              Turn Off
            </button>
            <button
              onClick={() => {
                setPending(true);
                playSound('warning');
              }}
            >
              <img src="/icons/restart.ico" alt="" />
              Restart
            </button>
          </div>
          <div className="power-bottom">
            <button className="xp-button" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {pending !== null && (
        <Confirm
          title={pending ? 'Restart Windows' : 'Turn off computer'}
          message={`Are you sure you want to ${pending ? 'restart' : 'turn off'} the computer? Any unsaved work will be lost.`}
          confirm={pending ? 'Restart' : 'Turn Off'}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const restart = pending;
            setPending(null);
            playSound('shutdown');
            onPower(restart);
          }}
        />
      )}
    </>
  );
}
export function Startup({
  phase,
  onPhase,
}: {
  phase: Phase;
  onPhase: (phase: Phase) => void;
}) {
  const [powerOpen, setPowerOpen] = useState(false);
  const [bootLogoReady, setBootLogoReady] = useState(false);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.src = XP_LOGO_SRC;
    const loaded =
      typeof image.decode === 'function'
        ? image.decode().catch(() => undefined)
        : Promise.resolve();

    loaded.then(() => {
      if (active) setBootLogoReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let next: Phase | null = null;
    switch (phase) {
      case 'bios':
        next = 'bios-devices';
        break;
      case 'bios-devices':
        next = 'boot';
        break;
      case 'restart':
        next = 'bios';
        break;
      case 'boot':
        next = 'prelogin';
        break;
      case 'prelogin':
        next = 'welcome';
        break;
      case 'welcome':
        next = 'desktop';
        break;
      case 'logoff':
        next = 'welcome';
        break;
      case 'shutdown':
        next = 'off';
        break;
    }
    if (phase === 'boot' && !bootLogoReady) return;
    if (!next) return;
    const timer = setTimeout(
      () => {
        if (phase === 'restart') playSound('boot');
        onPhase(next);
        if (phase === 'prelogin' || phase === 'logoff') playSound('startup');
      },
      phase === 'bios'
        ? 7800
        : phase === 'bios-devices'
          ? 2000
          : phase === 'boot'
            ? 4200
            : phase === 'prelogin'
              ? 2400
              : phase === 'shutdown' || phase === 'restart'
                ? 3200
                : 1600,
    );
    return () => clearTimeout(timer);
  }, [bootLogoReady, phase, onPhase]);
  if (phase === 'bios')
    return <Bios onComplete={() => onPhase('bios-devices')} />;
  if (phase === 'bios-devices')
    return <DeviceBios onComplete={() => onPhase('boot')} />;
  if (phase === 'boot')
    return (
      <main className="boot-screen" aria-label="Windows XP startup">
        <div className="boot-canvas">
          {bootLogoReady && (
            <>
              <WindowsLogo boot />
              <div
                className="boot-progress"
                role="status"
                aria-label="Windows is starting"
              >
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </>
          )}
          <div className="boot-copyright">
            Copyright © Microsoft Corporation
          </div>
          <div className="boot-microsoft">Microsoft</div>
        </div>
      </main>
    );
  if (phase === 'prelogin')
    return (
      <main
        className="prelogin-screen"
        aria-label="Windows XP is loading the Welcome screen"
      >
        <img
          className="prelogin-cursor"
          src="/cursors/xp-arrow.png"
          alt=""
          draggable={false}
        />
      </main>
    );
  if (phase === 'off')
    return (
      <main className="off-screen">
        <WindowsLogo boot />
        <p>It is now safe to turn off your computer.</p>
        <button
          className="xp-button"
          onClick={() => {
            playSound('boot');
            onPhase('bios');
          }}
        >
          Restart Windows
        </button>
      </main>
    );
  return (
    <main
      className={`login-screen ${phase !== 'login' ? 'logging-in' : ''}`}
      aria-label="Windows XP Welcome screen"
    >
      <div className="login-top" />
      <div className="login-center">
        <div className="login-message" role="status">
          {phase === 'welcome'
            ? 'welcome'
            : phase === 'logoff'
              ? 'Logging off…'
              : 'Windows is shutting down…'}
        </div>
      </div>
      <footer className="login-bottom"></footer>
      <PowerDialog
        open={powerOpen}
        onOpenChange={setPowerOpen}
        onPower={(restart) => {
          setPowerOpen(false);
          onPhase(restart ? 'restart' : 'shutdown');
        }}
      />
    </main>
  );
}

function Bios({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, 4)), 800);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F1') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onComplete]);
  return (
    <main
      className="bios-screen"
      aria-label="Simulated Award BIOS power-on self-test"
    >
      <div className="bios-content">
        <div className="bios-head">
          <div>
            <p>Award Modular BIOS v4.51PG, An Energy Star Ally</p>
            <p>Copyright (C) 1984-98, Award Software, Inc.</p>
          </div>
          <img
            src="/energy-star-reference.png"
            alt="Energy Star EPA Pollution Preventer"
          />
        </div>
        <br />
        <p>W6168MS V1.3 111700</p>
        <br />
        <p>PENTIUM III-MMX CPU at 500 MHz, Host Bus 100MHz</p>
        <p>
          Memory Test :{' '}
          {step === 0 ? '393216' : step === 1 ? '786432' : '1048576'}K{' '}
          {step >= 2 ? 'OK' : ''}
        </p>
        <br />
        <div className={step < 2 ? 'bios-pending' : ''}>
          <p>Award Plug and Play BIOS Extension v1.0A</p>
          <p>Copyright (C) 1998, Award Software, Inc.</p>
          <p>Detecting IDE Primary Master... 86B_CD00</p>
          <p>Detecting IDE Primary Slave ... None</p>
          <p>Detecting IDE Secondary Master... None</p>
          <p>Detecting IDE Secondary Slave ... None</p>
        </div>
        {step >= 3 && (
          <>
            <br />
            <p>Floppy disk(s) fail (40)</p>
            <p>CMOS checksum error - Defaults loaded</p>
          </>
        )}
        {step >= 4 && (
          <p>
            Press F1 to continue, DEL to enter SETUP
            <span className="bios-cursor">_</span>
          </p>
        )}
        <footer>
          <button onClick={onComplete}>Press F1 to continue</button>
          <p>11/17/2000-i440ZX-W977-2A69KM4NC-00</p>
        </footer>
      </div>
    </main>
  );
}

const deviceBiosLines = [
  'CPU Type       : AMD Athlon(tm) XP    Base Memory       : 640K',
  'CPU ID         : 0681                 Extended Memory   : 1047552K',
  'CPU Clock      : 2000MHz              L1 Cache Size     : 128K',
  '                                      L2 Cache Size     : 256K',
  '',
  'Diskette Drive A : 1.44M, 3.5 in.    Display Type      : EGA/VGA',
  'Pri. Master Disk : LBA, ATA 100,40082MB Serial Port(s)   : 3F8 2F8',
  'Pri. Slave Disk  : LBA, ATA 100,4006MB Parallel Port(s)  : 378',
  'Sec. Master Disk : LBA, ATA 33,512MB  DDR DIMM at Rows  : 2 3 4 5',
  'Sec. Slave Disk  : CHS,P10 4,512MB',
  '',
  'PCI device listing ...',
  'Bus No. Device No. Func. No. Vendor/Device Class Device Class       IRQ',
  '  0      2          0          10DE 0067  0C03  0C03 USB 1.1 OHCI Controller 10',
  '  0      2          1          10DE 0067  0C03  0C03 USB 1.1 OHCI Controller 11',
  '  0      2          2          10DE 0068  0C03  0C03 USB 2.0 EHCI Controller 5',
  '  0      9          0          10DE 0065  0C01  0C01 IDE Controller          14',
  '  0     13          0          10DE 006E  0C00  0C00 Serial Controller         10',
  '  1      8          0          1106 3034  0200  0200 Network Controller          11',
  '  1      9          0          1102 0001  0401  0401 Multimedia Device          11',
];

function DeviceBios({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setVisibleLines((count) => Math.min(count + 1, deviceBiosLines.length)),
      80,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F1') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onComplete]);
  return (
    <main
      className="bios-screen device-bios-screen"
      aria-label="Simulated BIOS hardware detection"
    >
      <div className="bios-content device-bios-content">
        {deviceBiosLines.slice(0, visibleLines).map((line, index) => (
          <p key={index}>{line || '\u00a0'}</p>
        ))}
        <footer>
          <button onClick={onComplete}>Press F1 to continue</button>
        </footer>
      </div>
    </main>
  );
}
