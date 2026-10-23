import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist-vercel/xp', { recursive: true });
const root = await readFile('dist-vercel/index.html', 'utf8');
const desktop = root
  .replace(
    '<title>Chenuka Jayathilake | Developer Portfolio</title>',
    '<title>Windows XP | Chenuka Jayathilake</title>',
  )
  .replace(
    'name="robots" content="index, follow"',
    'name="robots" content="noindex, follow"',
  )
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
await writeFile('dist-vercel/xp/index.html', desktop);
await writeFile(
  'dist-vercel/_headers',
  '/xp/*\n  X-Robots-Tag: noindex, follow\n/scene/*\n  X-Robots-Tag: noindex, follow\n/portfolio/*\n  X-Robots-Tag: noindex, follow\n  X-Content-Type-Options: nosniff\n/icons/SOURCES.md\n  X-Robots-Tag: noindex\n',
);
console.log(
  'Built branded entry, non-indexed helper routes, and portfolio assets.',
);

// Legacy PDF URLs remain valid after the homepage moves to the 3D experience.
for (const filename of [
  'chenuka-jayathilake-cv.pdf',
  'chenuka-jayathilake-bachelors-thesis.pdf',
]) {
  await copyFile(
    `dist-vercel/portfolio/${filename}`,
    `dist-vercel/${filename}`,
  );
}
