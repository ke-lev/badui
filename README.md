# badui

A library of interface components: some deliberately difficult, some genuinely good. Every entry is live and operable. The surrounding frame stays simple, accessible, and predictable.

## Run locally

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

```sh
npm run lint
npm run build
npm start
```

## The collection

Currently six hostile entries, with the library open to more of both kinds.

- **Volume control:** a rotary dial that takes twelve and a half turns to reach 100%.
- **Date picker:** every day from 1900 through 2026 on one slider.
- **Password field:** additional requirements arrive as the earlier ones are met.
- **Checkboxes:** each preference also toggles its neighbor.
- **Phone number:** each digit increments the next digit as well.
- **Confirmation dialog:** every confirmation requires another confirmation.

Each entry has an independent reset. **Reset all** restores the entire collection. State lives in memory; the forms do not submit data or create accounts.

## The cursor companion

A pointer layer trails the cursor, envelopes whatever is under it, and hangs a tab off the envelope with one line of context. Two modes, switched from the control in the footer:

- **DOM** (default) — an inspector. Reports declared attributes and computed accessibility properties, and nothing else. It reads an element's own claims back to you, which on a hostile component means it repeats that component's lie.
- **Snark** — authored lines giving direction without a walkthrough.

Motion is a velocity-carrying spring; the envelope's corner radius is derived from the morph so the shape is a true circle or pill at every intermediate frame. The layer is pointer-only, `aria-hidden`, and snaps rather than trails under `prefers-reduced-motion`.

## Implementation

Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4. The page and layout render on the server; the collection and specimens use client state. Specimen styles are scoped with CSS Modules. Fonts are self-hosted through `next/font`.

- `src/app/page.tsx` — centered home hero
- `src/app/collection/page.tsx` — collection route
- `src/components/site-chrome.tsx` — shared header and footer
- `src/components/collection.tsx` — specimen roster, resets, and scroll reveals
- `src/components/specimens/` — the working interfaces
- `src/components/sidekick/` — the cursor companion, its two modes, and its control
- `src/components/meta.ts` — the `ComponentMeta` every component exports
- `src/app/globals.css` — frame styles and responsive layout
- `AGENTS.md` — how to add a component, and the documentation rule
- `PRODUCT.md` — product scope and design boundaries

## Accessibility

The frame provides semantic landmarks, a skip link, visible keyboard focus, touch-sized controls, and reduced-motion support. Deliberately hostile interaction stays inside an entry, and covers interaction design only — roles, names, and states stay correct everywhere. Visual accessibility remains a requirement throughout.

## Tests

```sh
npm test
```

Vitest with jsdom, covering the pure modules (`inspect.ts`, `lines.ts`). Motion and layout are verified in a browser.
