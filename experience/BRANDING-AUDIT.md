# Branding, metadata, and public-asset audit

Reviewed 24 October 2026 in the separate `portfolio-xp-3d` composition.

## Scope and findings

- Entry-page HTML, all application sources, static HTML/CSS/JS/SVG/JSON, copied scene runtime, scripts, and production output were searched for the reference creator's name, personal domains, contact/social links, old scene branding, tracker signatures, and source-map references.
- No reference creator name or personal contact/social URL was present in the copied runtime at the start of this audit. Obsolete startup/about strings, an original scene favicon, and two missing source-map references remained.
- No Google Analytics, Tag Manager, PostHog, Sentry, or Mixpanel initialization signatures were found in the reviewed production assets. This is a source/asset audit, not a guarantee about external sites visitors choose to open.
- All three GLB models were parsed, including their JSON metadata. No reference creator identity or personal URL was found. Their generator field identifies the Khronos Blender exporter; that tool metadata is preserved.
- JPEG/PNG/WebP image metadata was inspected for Artist, Author, Copyright, Description, Comment, and Software fields. No creator-identifying image metadata was found in the reviewed assets. This does not assert authorship or a reuse license for the scene artwork.
- The thesis PDF names Chenuka Jayathilake as its author. It was left unchanged.
- The CV's Info dictionary and XMP metadata named Chenuka as author, but its hidden title/subject referred to a WSO2 job application. Those title/subject fields now describe a general CV. The author's name and document generator metadata were preserved. Its page-content streams and rendered PNG are unchanged. The PDF's visible application-specific footer is content and was not rewritten by this metadata cleanup.

## Changes made

- Root title, description, author label, Open Graph/Twitter metadata, and Person structured data describe Chenuka's portfolio. No claim of authorship of the reused scene models/code is added.
- The root and scene use the existing C monogram from Chenuka's portfolio as favicon.
- Scene and nested desktop labels identify Chenuka's portfolio; legacy startup/tutorial components were confirmed unreferenced and removed from the runtime.
- The scene runtime was renamed to `scene-runtime.js` and minified after the dead-code removal. Its missing `scene-runtime.LICENSE.txt` was recovered and preserved.
- Obsolete scene favicon, one-time migration script, stale JS/CSS source-map pointers, and portfolio development width rulers were removed.
- The root has an actual JavaScript-disabled fallback with links to the portfolio and CV. No hidden keyword block was added.
- Helper routes (`/scene/`, `/xp/`, `/portfolio/`) have noindex/follow metadata or delivery headers, to avoid competing with the main entry in search. Both Vercel configuration and static `_headers` carry the helper rules.
- A repeatable production-asset audit checks legacy branding, tracker signatures, GLB validity/metadata, the root identity, helper indexing, and vendor notices.

## Deliberately retained

- Vendor copyright/license notices, their named contributors, Microsoft/Windows branding used by the XP simulation, and legitimate application names.
- Source/asset provenance in README and `public/icons/SOURCES.md`. The recovered scene remains a reference-derived third-party runtime and artwork; public branding cleanup does not establish independent authorship or a scene reuse license.
- Official library documentation URLs and XML/SVG namespace URLs. They are not creator backlinks or tracking endpoints.
- Your own external links, portfolio content, original footer animation, and document page content.

## Deployment notes

This remains a local composition. A canonical URL and sitemap should be added after the final production domain is selected; no localhost or reference-site domain is used as canonical. No hosting audience or production deployment was changed.

## Validation

- TypeScript, production build, seven existing desktop-state/geometry tests, and the repeatable production-asset audit.
- Scene JavaScript parses; all GLBs retain valid headers and file lengths.
- CV renders before/after metadata cleanup are pixel-identical.
- Browser checks cover retained scene loading, default portfolio presentation, closing to XP, and reopening the portfolio after the runtime cleanup.
