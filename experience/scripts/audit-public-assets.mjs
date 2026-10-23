import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const folder = process.argv[2] || 'dist-vercel';
const legacy =
  /yoshik|yoheik|yohei[k-]|karnawat|HHBIOS|Desktop Inc\.|Retro Desktop|sourceMappingURL=/i;
const trackers =
  /googletagmanager\.com|google-analytics\.com|gtag\s*\(|posthog\.init\s*\(|sentry\.io\/api|mixpanel\.track\s*\(/i;
let checked = 0;
const issues = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walk(name);
      continue;
    }
    checked++;
    if (/\.(?:html?|js|css|json|svg|txt|xml|md)$/.test(item.name)) {
      const text = await readFile(name, 'utf8');
      if (!/LICENSE|SOURCES\.md/.test(item.name) && legacy.test(text))
        issues.push(`${name}: legacy identity or stale map`);
      if (trackers.test(text)) issues.push(`${name}: tracking signature`);
      if (item.name.endsWith('.js')) {
        try {
          if (name.includes('/scene/')) new Function(text);
        } catch (e) {
          issues.push(`${name}: invalid scene JavaScript`);
        }
      }
    }
    if (item.name.endsWith('.glb')) {
      const data = await readFile(name);
      if (
        data.subarray(0, 4).toString() !== 'glTF' ||
        data.readUInt32LE(8) !== data.length
      )
        issues.push(`${name}: invalid model header`);
      const length = data.readUInt32LE(12);
      const json = data.subarray(20, 20 + length).toString();
      JSON.parse(json);
      if (legacy.test(json)) issues.push(`${name}: legacy model metadata`);
    }
  }
}
await walk(folder);
const root = await readFile(path.join(folder, 'index.html'), 'utf8');
if (!root.includes('<title>Chenuka Jayathilake | Developer Portfolio</title>'))
  issues.push('Root title mismatch');
const jsonld = root.match(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
);
if (!jsonld || JSON.parse(jsonld[1]).name !== 'Chenuka Jayathilake')
  issues.push('Person metadata mismatch');
const xp = await readFile(path.join(folder, 'xp/index.html'), 'utf8');
if (!xp.includes('name="robots" content="noindex, follow"'))
  issues.push('XP helper should not be independently indexed');
await stat(path.join(folder, 'scene/scene-runtime.LICENSE.txt'));
if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Public asset audit passed: ${checked} files; no legacy author branding or tracker signatures; model headers, metadata, helper indexing, and vendor notices checked.`,
  );
