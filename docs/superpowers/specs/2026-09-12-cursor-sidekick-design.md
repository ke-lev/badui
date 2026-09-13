# Cursor sidekick — design

Date: 2026-09-12
Status: approved, ready for implementation plan

## Summary

A pointer-following companion that envelopes the element under the cursor and
hangs a tab off the enveloping cuff. The tab carries one line of context about
that element. Two content modes ship behind a footer control so both can be
evaluated against real use:

- **`dom` (default)** — an inspector. Reports declared attributes and computed
  accessibility properties. Never behavior.
- **`snark`** — bespoke authored lines. Gives direction without a walkthrough.

Off is a third state. `dom` is the default because it is the only mode that
satisfies the `PRODUCT.md` exclusion on commentary.

## Why the inspector is the interesting mode

Reading the specimen source turned up three places where the DOM misrepresents
itself:

| Element | Declares | Actually |
|---|---|---|
| Volume dial | `aria-valuemin=0 aria-valuemax=100` | `MAX_ROTATION = 4500` degrees |
| Dialog close | `aria-label="Close confirmation"` | increments `depth` |
| Dialog | `role="dialog"` | `aria-modal="false"` |

An inspector that faithfully reports declared attributes is therefore
*complicit* — it repeats the specimen's own lie without editorialising. The
frame's honesty indicts the specimen's dishonesty, and no commentary is
authored anywhere. This satisfies "never explain the joke" while still making
the sidekick informative.

The enforceable rule: **read declared attributes and computed accessibility
properties; never read behavior.** Knowing `min/max/step` does not reveal that
the dial needs twelve and a half rotations. The puzzles survive intact.

## Product tension, stated explicitly

`PRODUCT.md` Principle 2 makes commentary a confirmed exclusion. `snark` mode
violates it. That is deliberate and is the reason for the toggle: the author
wants to measure whether directional lines reduce immediate abandonment. The
tension is recorded here so a future reader does not mistake `snark` for an
oversight. If `snark` ships as default, `PRODUCT.md` must be amended first.

## Modules

```
src/components/sidekick/
  sidekick.tsx          client layer: rAF loop, renders cuff + tab
  sidekick-mode.tsx     context, localStorage persistence, mode type
  sidekick-control.tsx  the footer radio group (client)
  inspect.ts            pure: Element -> readout string   (dom mode)
  lines.ts              pure: Element -> bespoke line     (snark mode)
  sidekick.module.css
```

`inspect.ts` and `lines.ts` are pure and side-effect free. They are the only
units with logic worth testing, and keeping them out of the rAF component keeps
that component thin.

Mount point: `src/app/layout.tsx`, inside `<body>`, so the layer covers both
routes. `SiteFooter` stays a server component; `sidekick-control.tsx` is the
client island it imports.

## Motion

One fixed-position element, `pointer-events: none`, `will-change: transform`.
Every per-frame write goes directly to `.style` from a single rAF loop. No
React state in the hot path; mode and tab text are React state and change
rarely.

**Follow.** dt-corrected exponential smoothing:

```
k = 1 - Math.pow(1 - BASE, dt * 60)
p += (target - p) * k
```

Decelerates into the target with no overshoot — the "closer it gets, the slower
it goes" quality. A settle deadzone (~0.1px) stops subpixel jitter.

**Squash/stretch.** Scale along the velocity vector, compress perpendicular,
rotate to `atan2(vy, vx)`. Magnitude proportional to speed, clamped. This is
what makes it read as liquid rather than laggy.

**Envelope.** On lock the same interpolator retargets from `(mouseX, mouseY,
r=12)` to the element's `(x, y, w, h, borderRadius)`. One continuous code path,
so blob-to-cuff needs no transition logic. Squash decays to zero while locked.

**Re-measurement.** The rect is re-measured every frame while locked. The
specimens resize underneath the cursor — the dialog stack grows, the password
requirements list gains rows — so a cached rect goes stale. One
`getBoundingClientRect()` per frame for a single element is acceptable.

**Tab.** Hangs below the cuff, flipping above within ~80px of the viewport
bottom. Same fill as the cuff so it reads as extruded. Mono font
(`--font-geist-mono`) in `dom` mode; sans in `snark` mode.

## Targeting

Pointer delegation on `document` (`mouseover`/`mouseout`), matching via
`closest()` against a target selector list: `a[href]`, `button`, `input`,
`select`, `textarea`, `[role="slider"]`, `[role="dialog"]`, `[data-sidekick]`.
Delegation is cheaper and more correct than `elementFromPoint` per frame.

## Mode `dom` — inspector output

Derived from declared attributes and computed a11y properties:

| Target | Tab reads |
|---|---|
| Volume dial | `slider "Volume" · 0–100 · now 3` |
| Date slider | `range "Date of birth" · 0–46385 · step 1` |
| Phone digit | `button "Increase digit 4, currently 0"` |
| Checkbox | `checkbox "Email updates" · checked` |
| Password input | `password "Create a password" · aria-invalid` |
| Dialog | `dialog "Are you sure?" · aria-modal false` |
| Dialog close | `button "Close confirmation"` |
| Nav link | `a → /collection` |

Accessible name resolution order: `aria-label`, `aria-labelledby` target text,
associated `<label>`, `title`, trimmed text content. Truncate names past ~40
chars. Generic fallbacks cover any element not specially handled.

## Mode `snark` — authored lines

Keyed off `data-sidekick` attributes added to specimen internals. Deadpan,
never winking, never naming the pattern. Direction, not solution:

- Volume dial — "It goes to 100. It does not go to 100 quickly."
- Date slider — "One hundred and twenty-seven years. One groove."
- Password — "Meeting a requirement is how you find the next one."
- Checkboxes — "Each one has an opinion about its neighbour."
- Phone digit — "Every digit is on speaking terms with the next."
- Dialog — "Cancel goes back one. Everything else goes forward."
- Dialog close — "This is not an exit."
- Reset — "The only control here that does what it says."

Unkeyed elements fall back to the `dom` readout rather than inventing a line.

## Accessibility

- Cuff and tab are `aria-hidden="true"` and `pointer-events: none`. Every fact
  in `dom` mode already exists in the DOM being read, so nothing is
  pointer-gated.
- The whole layer is behind `(pointer: fine) and (hover: hover)`. On touch it
  never mounts a listener.
- Under `prefers-reduced-motion: reduce` the cuff snaps to targets instead of
  trailing and the tab cross-fades. The feature survives; the motion does not.
- The footer control is a `<fieldset>` with a visible `<legend>` and three
  radios. Touch-sized targets, AA contrast against `#fbfaf8`, visible
  `:focus-visible` matching the existing `2px solid #4e6145` treatment.
- Mode is read from `localStorage` after mount, never during render, so there
  is no hydration mismatch. SSR renders the default.

## Verification

The repo has no test infrastructure. Add `vitest`, `jsdom`, and
`vite-tsconfig-paths` only — no React Testing Library, since the units under
test are pure functions over synthetic elements built with
`document.createElement`. This keeps the new dependency footprint minimal.

Covered by unit tests:

- `inspect.ts` — each specimen element shape, accessible name resolution order,
  truncation, generic fallbacks.
- `lines.ts` — keyed lookup, fallthrough to `inspect` for unkeyed elements.

Not unit tested: the rAF loop, tab placement, and squash — verified in the
browser. `npm run lint` and `npm run build` must stay green.

## Out of scope

- Touch support.
- Any mode beyond the three states.
- Sidekick reaction to specimen state changes beyond re-measuring the rect.
- Amending `PRODUCT.md`. Deferred until the A/B result is known.
