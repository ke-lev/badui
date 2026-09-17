<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# badui

A library of interface components: some deliberately hostile, some genuinely
good, presented together as one collection. Visitors can operate every entry —
these are working components, not screenshots.

The site is no longer a fixed set of six specimens. It is an open library that
grows, and every addition is documented as it lands.

## Every component ships with its documentation, in the same change

This is the rule that matters most here, because it is the one most often
deferred and never returned to.

A component is not finished when it renders. It is finished when it exports a
`ComponentMeta` (see `src/components/meta.ts`) beside itself:

```ts
export const meta: ComponentMeta = {
  name: "Low gear",
  kind: "hostile",
  category: "sliders",
  summary:
    "A rotary dial. Reaching 100% takes twelve and a half full turns; each " +
    "arrow-key press moves it one percent.",
  usage: "<LowGear />",
  notes: "Pointer-driven via pointer capture. Exposed as role=slider.",
  prompt: lowGearPrompt,
  lines: {
    "volume-dial": "It goes to 100. It does not go to 100 quickly.",
  },
};
```

The library index is built from these exports, so a component without `meta`
does not appear in the collection. Documentation is load-bearing, not a chore
to be caught up on later.

Do not open a "document this" follow-up task, do not leave a TODO, and do not
report a component as complete while its `meta` is missing. If you are editing
a component and its `meta` no longer describes it, updating it is part of your
change, not a separate one.

## Every component ships with its prompt, in the same change

Every new component, `hostile` or `benign`, ships with a portable reproduction
prompt. `ComponentMeta` requires `prompt`, and the prompt text lives in a
separate `*.prompt.ts` file beside the component so exact constants and full
instructions do not bury the implementation.

The prompt is a self-contained React + TypeScript brief. It must not depend on
this repository: no project imports, metadata, cursor-companion attributes, or
CSS custom properties. Resolve styles to plain CSS values. Use these sections,
in this order:

1. `What to build` — exported component name, props, defaults, and call site.
2. `Markup and semantics` — elements, labels, roles, names, states, and live
   regions.
3. `Behavior` — the full interaction model and every threshold, timing,
   physical constant, sequence, and reduced-motion rule.
4. `Styling` — layout, dimensions, states, and resolved colors and typography.
5. `Done when` — a short, observable checklist.

Every prompt includes this sentence exactly: “Reproduce the behavior exactly
as specified; do not adjust thresholds, timings, or interaction.” It prevents
the reproduction from changing the component while remaining in the same
straight register as the rest of the documentation.

This is enforced in `src/components/entries.test.ts`. The same terms as `meta`
and `lines` apply: do not open a follow-up task, do not leave a TODO, and do not
report a component complete without its prompt. If the component's behavior,
semantics, props, or appearance changes, rewriting its prompt is part of that
change.

## Explain the component. Never explain the joke.

Both halves of this bind.

**Explain the component.** Say what it is, how it behaves, and how to use it.
The library has to be legible to someone deciding whether to use an entry or
to learn from it. Writing "twelve and a half turns to reach 100%" is
documentation.

**Never explain the joke.** Do not editorialise, wink, apologise, name the
anti-pattern, or tell the visitor how to beat a hostile control. Writing
"hilariously unusable" or "a classic dark pattern" breaks the voice. The
artifact still carries its own point; the documentation describes the
mechanism, and stops there.

The same split governs the two kinds. A `hostile` entry is documented in
exactly the same register as a `benign` one — straight, factual, no nudge and
no commentary. The deadpan is the whole effect.

## Every component ships with its Talk line, in the same change

The cursor companion has two modes. In Talk mode its tab shows a bespoke line
for whatever it is enveloping, looked up by the nearest `data-sidekick` key.
An element with no line falls back to the DOM inspector readout, and that
counts as unfinished everywhere. Every interactive element the cursor
envelops gets a bespoke line, the frame included: nav, footer, the mode
control, skip links, the splash button, the library rail. Frame lines can be
as slight as "Pretty self-explanatory." or "...", but they must exist.
`src/components/sidekick/lines.test.ts` renders the frame and fails on any
target without one.

Every new component, `hostile` or `benign`, ships with both:

- `data-sidekick="<key>"` on its interactive element, and
- a line for that key in its `meta.lines`.

This is enforced. `ComponentMeta` requires `lines`, and
`src/components/entries.test.ts` renders every entry in
`src/components/entries.ts` and fails if it renders no key, renders a key its
`meta.lines` does not cover, lists a switch in `meta.switches` whose key has
no line, or claims a key another entry already owns. The
test sees only the first render, so check keys that appear after interaction —
an opened dialog's close button — by hand. The frame's own controls keep their
lines in `FRAME_LINES` in `src/components/sidekick/lines.ts`.

An element inside a component that behaves differently from its parent gets its
own key and its own line — see `dialog` and `dialog-close`. The same terms as
`meta` apply: no follow-up task, no TODO, not complete without it, and if a
change to the component makes its line wrong, rewriting the line is part of
that change.

**Voice.** One short, dry sentence, occasionally two. It observes the
component from the side and gives direction without a walkthrough. It never
names the anti-pattern, never tells the visitor how to beat the control, and
never winks — no exclamation marks, no emoji, no "lol". For example:

- "It goes to 100. It does not go to 100 quickly."
- "Meeting a requirement is how you find the next one."
- "It has somewhere else to be."

## Accessibility boundary

The frame meets WCAG 2.2 AA: navigation, index, landmarks, focus order, and
contrast on everything surrounding the components.

Individual components are exempt on **interaction design only** — a hostile
control is allowed to be hostile to operate. It is not licensed to drop
semantics: roles, names, and states stay correct, because the readouts and the
library index depend on them. Visual accessibility stays a requirement
everywhere.

## Repository conventions

- Component styles are CSS Modules, colocated with the component.
- Shared frame styles and design tokens live in `src/app/globals.css`.
- Tests run on Vitest (`npm test`), jsdom environment, `src/**/*.test.ts`.
  Pure logic gets unit tests; rAF loops and layout are verified in a browser.
- Before reporting work complete, `npm test && npm run lint && npm run build`
  must all pass, and test output must be free of warnings.
- The working tree carries uncommitted, untracked work that is not yours.
  Scope every `git add` to the files you actually changed. Never `git add -A`
  or `git add .`.
- Never use `pkill`, `killall`, or any pattern-matched kill. Other projects run
  dev servers on this machine. Kill only a process you started, by its own PID,
  and prefer a non-default port.

## Precedence

`PRODUCT.md` describes the product and remains authoritative on voice and
scope, and the two files agree today.

`PRODUCT.md` carries an `impeccable:product-schema` marker, so a skill re-run
can regenerate it from a fresh interview. **This file is the durable copy of
the rules below, and wins wherever a regenerated `PRODUCT.md` disagrees:**

- the library is open and grows; it is not a fixed set of six specimens
- component documentation is required entry content, written in the same
  change as the component
- explain the component; never explain the joke
- each entry ships finished — documented, operable, complete
- hostile and benign entries are documented in the same straight register
- every component and distinct element ships with a bespoke Talk line, in the
  same change as the component
- every component ships with a portable reproduction prompt in the same
  change, and the prompt stays synchronized with the component

A `.claude/hooks/guard-product-md.sh` hook prompts before any write to
`PRODUCT.md` so a regeneration cannot revert these silently. If you are asked
to confirm such a write, check the list above survives it.

## subagents

Please use sonnet subagents on highest reasoning for bounded tasks. subagent-heavy work with a lot of opus models is very expensive.
