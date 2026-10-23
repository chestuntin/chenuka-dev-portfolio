# Asset provenance

These are third-party Windows and application assets, not original artwork.

- XP icons (computer, folder, navigation, Start, user tile, Windows flag and restart): https://github.com/ShizukuIchi/winXP/tree/master/src/assets/windowsIcons — Microsoft Windows artwork preserved by that project. `power.png` is its `windows-off.png` flag; `computer.png` is `676(32x32).png`.
- Chrome logo: https://www.google.com/chrome/static/images/chrome-logo.svg
- Spotify icon: https://commons.wikimedia.org/wiki/File:Spotify_icon.svg
- Space Cadet shortcut icon: the original 32×32 application image extracted by the principal SpaceCadetPinball project: https://github.com/k4zmu2a/SpaceCadetPinball/blob/cb9b7b886244a27773f66b0b19fdc2998392565e/SpaceCadetPinball/Icon_32x32.png.
- Original Windows XP Bliss wallpaper and startup sound: https://github.com/bartekl1/windows-ui-assets — Microsoft Windows assets. `bliss.jpg` is converted from `Wallpapers/Windows XP/Desktop/Bliss.bmp`; `sounds/startup.wav` is `Sounds/Windows XP/Windows XP Startup.wav`.

The boot and Welcome layouts are implemented in CSS/React, using the sourced flag and user tile. The lettering/layout is a reconstruction, not an extracted full-screen XP bitmap. The web desktop is a simulation; it does not run Windows or provide Windows account authentication.

## September 10 desktop additions

- Full Windows XP flag/wordmark SVG: https://en.wikipedia.org/wiki/File:Windows_XP_logo_and_wordmark.svg — downloaded from https://upload.wikimedia.org/wikipedia/en/e/ec/Windows_XP_logo_and_wordmark.svg. Lettering changed to white and vector groups arranged vertically for the boot/login screens; original letter and flag paths retained.
- Tahoma regular/bold: existing macOS supplemental Tahoma font files, copied to `public/fonts/` so the interface does not fall back to Verdana on other platforms. Fonts remain third-party Microsoft font artwork.
- Recycle Bin icons: 32-bit 32×32 frames from `Icons/Windows XP/ico/shell32.dll/ICON32_1.ico` and `ICON33_1.ico` in the windows-ui-assets archive above.
- Additional sounds: original XP Start, Menu Command, Minimize, Restore, Exclamation, Recycle, Logoff Sound, and Shutdown WAV files from the same archive.
- Tray Messenger and volume: `msn.png` and `690(16x16).png` from ShizukuIchi/winXP. Confirmation question-mark icon: `747(32x32).png`.

The blanket click handler was removed to match XP’s event-based default sound scheme. `navigation.wav` contains the original Windows XP Start.wav. Unassigned button/menu/minimize/maximize/close events are silent; recycling audio is used only when emptying the bin. The BIOS text represents a fictional period PC configuration and never queries the visitor's hardware.

- Tray Help uses the XP Help question-mark icon (`747(32x32).png`). The exact round Tour icon in the supplied screenshot could not be retrieved from its sprite archive; it is not reproduced here.

## Explorer drive and cursor assets

- `xp-folder.png`, `xp-hard-drive.png`, and `xp-dvd.png` are the original 48×48 Windows XP artwork used by ShizukuIchi's My Computer implementation (`318`, `334`, and `111` respectively): https://github.com/ShizukuIchi/winXP/tree/master/src/assets/windowsIcons.
- `up.png` is the original 26×26 Windows XP Explorer Up toolbar artwork from the same ShizukuIchi Windows XP asset set.
- `xp-floppy.png` is a lossless PNG conversion of the original Windows XP `shell32.dll` resource `ICON7_1.ico` from https://github.com/bartekl1/windows-ui-assets/tree/main/Icons/Windows%20XP/ico/shell32.dll.
- `xp-view.png` and `xp-view-arrow.png` reproduce the original 24×20 Views toolbar glyph and 8×4 dropdown arrow directly from the supplied Windows XP reference screenshot, without redrawing or substituting the artwork.
- The `.cur` files in `public/cursors/` are original Windows XP cursor resources from https://github.com/bartekl1/windows-ui-assets/tree/main/Cursors/Windows%20XP. They cover the default arrow, text beam, application-starting arrow/hourglass, move, unavailable, help, alternate, link, and all four resize directions. The matching files in `public/cursors/compact/` preserve that artwork and CUR encoding while rendering the artwork at 80% scale with proportionally corrected hotspots.

Sound-assignment references: the original Microsoft theme AppEvents entries reproduced at https://groups.google.com/g/microsoft.public.windowsxp.customize/c/s89DHNRiK_0 (empty defaults for Close, Maximize, Minimize, MenuCommand, MenuPopup, RestoreUp/Down; assigned Explorer Navigating and EmptyRecycleBin), and the Start Navigation explanation at https://learn.microsoft.com/en-us/answers/questions/2500633/clicking-sound-disappeared?page=0. Explicit warning dialogs retain their requested exclamation sound.

## Internet Explorer window and physical mouse audio

- `ie.png`, `stop.png`, and `mail.png` are original Internet Explorer/Windows assets from the ShizukuIchi/winXP Windows icon collection linked above. Existing Back, Forward, Refresh, Home, Search, History, and Go icons are reused. The Favorites star and printer are Lucide artwork.
- `public/sounds/mouse-down.mp3` and `mouse-up.mp3` reuse the retained 3D scene's `audio/mouse/mouse_down.mp3` and `mouse_up.mp3`. They represent the scene's physical mouse, separate from XP's default system sound scheme, and follow desktop volume/mute settings.
