# Portfolio XP 3D

A separate local composition of three existing projects:

1. The recovered Retro Desktop 3D scene and CRT renderer.
2. The Windows XP web desktop (GitHub revision `2999ac9`).
3. The current local `dev-portfolio/dist` website, including its garden footer and CV PDF.

## Start locally

Requires Node 22.13 or newer.

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:3010/`. The root page opens the 3D desk directly. Move into the CRT to use XP; the portfolio is open by default. Close its window to reveal the desktop. Reopen it from the desktop shortcut or Start menu.

Direct routes:

- `/` — 3D desk and CRT.
- `/xp/` — standalone XP desktop with the portfolio open.
- `/portfolio/index.html` — the existing portfolio on its own.

## Build

```sh
npm run build
npm start
```

Static output is `dist-vercel/`. It contains a real `/xp/index.html` entry, so the monitor route does not depend on a server-side rewrite. `vercel.json` is retained for a future separate deployment. The production composition is published in `chestuntin/chenuka-dev-portfolio` under `experience/`; the repository root retains Cloudflare Pages configuration and its existing visit-counter function.

## Integration changes

- The copied scene's monitor iframe points to `/xp/` on the same origin.
- The copied scene bypasses its BIOS/start overlay and intro camera movement; normal asset loading remains necessary. Camera hover transitions, CRT smudge/flicker layers, models, and textures are retained.
- The XP route starts in its desktop state, without BIOS, power-on, or Guest login. It opens a maximized portfolio window each fresh desktop session. Manual power/restart controls retain the inherited XP behavior.
- The portfolio starts from the latest local `dist` snapshot. This composition customizes its page metadata, removes development width rulers, and generalizes hidden CV title/subject fields; portfolio content, footer animation, and PDF page appearance are preserved. Later changes to the original portfolio do not update this copy automatically.
- `app/desktop-bridge.ts` forwards same-origin iframe input to the retained monitor/camera runtime. The scene accepts only messages from its own XP iframe at the same origin, with an allowlist of event names. Activity inside the portfolio also resets the desktop idle timer.
- Ordinary XP button clicks remain silent; the existing system-event sound behavior is retained. The scene startup chime and scripted tutorial typing are skipped on entry. Browser interaction may be required before ambience can play.
- If the browser cannot load the WebGL scene, the entry page offers the direct desktop route.

## Source locations used

- XP: `/Users/chestuntin/Documents/ChatGPT/my-web-portfolio`
- Scene: `/Users/chestuntin/Documents/Codex/2026-09-08/hi/outputs/retro-desktop/public/scene`
- Portfolio: `/Users/chestuntin/Documents/codex-projects/dev-portfolio/dist`

These existing projects were read and copied; their working files were not modified.

## Scene provenance

The retained scene is the previously recovered reference-derived study of https://yoshik-pc.vercel.app/. It includes that scene's compiled runtime, models, baked textures, and audio; it is not newly authored scene code. Existing Windows/app asset provenance remains in `public/icons/SOURCES.md`. Four omitted scene-control SVGs were retrieved from the reference's `assets/images/` paths to complete the retained runtime's dependencies.

## Validation

TypeScript, the static production build, inherited geometry/recycling tests, and source-asset integrity checks pass. Browser verification covered direct scene entry, the default portfolio window, closing to reveal XP, reopening the portfolio, and rendering its original garden footer. External apps remain subject to their own embedding policies.

## Branding and metadata audit
See `BRANDING-AUDIT.md` for the public-code, model/image metadata, PDF metadata, SEO, and license-notice review. Run `node scripts/audit-public-assets.mjs` after `npm run build` to check the production output.

### Internet Explorer and restarting

The portfolio opens in an Internet Explorer 6-style window with an address bar, Back/Forward, Stop/Refresh/Home, Favorites, local browsing history, printing, and a status bar. The desktop shortcut and Start entry reopen it. Favorites and history belong only to this simulated browser. Portfolio links to external websites, the CV, and the thesis open in real browser tabs. Section links continue to scroll within the embedded portfolio. Internet Explorer does not intercept links or popup requests. External sites typed into its address bar may refuse iframe embedding; the information bar offers a normal browser tab.

Landing still opens the running desktop immediately. Start → Restart (or Turn Off Computer → Restart) confirms the action and runs the existing shutdown, BIOS, Windows loading, and welcome sequence before reopening the portfolio. The initial physical power-on prompt has been removed. After an explicit shutdown, Restart Windows starts the BIOS again. Physical mouse sounds are captured in both the desktop and its same-origin portfolio iframe, with XP system sound assignments and saved mute/volume preserved.

## Cloudflare Pages release

The public homepage is https://chenuka-jay.pages.dev/. Production deploys the GitHub repository's tracked `dist/` directory from `main`, with editable source under `experience/`. The root `functions/api/views.js`, D1 binding, and migrations are preserved from the existing Pages project. The portfolio reuses its production visit-counter endpoint; no database migration or counter reset is needed.

From the deployment repository root, `node scripts/build-homepage.mjs` rebuilds and copies the static release into `dist/`. Commit the source and generated release together; pushing `main` triggers Cloudflare Pages. Original root-level CV and thesis PDF links remain valid.

## Loading and ambience

The entry shows a CRT-inspired loading screen with actual scene-resource counts, a smooth room reveal, retry/direct-desktop fallbacks, and reduced-motion styling. The room ambience is requested before mounting the 3D iframe and fades from silence over 2.4 seconds once playback is permitted. A persistent sound control handles browsers that require a user gesture; entering silently remains automatic when autoplay is blocked. Saved XP mute/volume preferences are shared across the entry, scene effects, and desktop. The ambience is owned by the entry page, so the retained runtime does not play a second copy; its camera still supplies distance-dependent volume and filtering. Hidden tabs pause the track and fade it back in on return.
