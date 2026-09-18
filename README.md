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

The library is open to more hostile and benign entries.

- **Low gear:** a rotary dial that takes twelve and a half turns to reach 100%.
- **One groove:** every day from 1900 through 2026 on one slider.
- **Moving target:** additional requirements arrive as the earlier ones are met.
- **Solidarity:** each preference also toggles its neighbor.
- **Carry:** each digit increments the next digit as well.
- **Classic runaway:** springs to the far side of its area when the pointer comes near, with switches for what sends it, whether it shivers, and whether it talks.
- **Cornered:** pushed directly away from the pointer, sliding along walls it meets.
- **Shrinking:** stays put and shrinks to a 3-pixel square as the pointer arrives.
- **Letter-by-letter name:** one dropdown per letter, the alphabet listed by frequency in English.
- **Leading caret:** the caret returns to the start of the field after every keystroke.
- **Sorted email:** the address is sorted by character code as it is typed.

Each entry has an independent reset. **Reset all** restores the entire collection. State lives in memory; the forms do not submit data or create accounts.

## The cursor companion

A pointer layer trails the cursor, envelopes whatever is under it, and hangs a tab off the envelope with one line of context. Two modes, switched from the control in the footer:

- **Talk** (default) — authored lines giving direction without a walkthrough. Each component ships its lines in its `meta`, and a test fails any entry without them.
- **DOM** — an inspector. Reports declared attributes and computed accessibility properties, and nothing else. It reads an element's own claims back to you, which on a hostile component means it repeats that component's lie.

Motion is a velocity-carrying spring; the envelope's corner radius is derived from the morph so the shape is a true circle or pill at every intermediate frame. The layer is pointer-only, `aria-hidden`, and snaps rather than trails under `prefers-reduced-motion`.

## Implementation

Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4. The page and layout render on the server; the collection and specimens use client state. Specimen styles are scoped with CSS Modules. Fonts are self-hosted through `next/font`.

- `src/app/page.tsx` — centered home hero
- `src/app/collection/page.tsx` — collection route
- `src/components/site-chrome.tsx` — shared header and footer
- `src/components/collection.tsx` — specimen roster, resets, and scroll reveals
- `src/components/buttons/` — button entries and their shared motion
- `src/components/entries.ts` — every entry; the index and the Talk lines are both built from it
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
