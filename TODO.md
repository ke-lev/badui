# Project review TODO

Reviewed 2026-09-16 against the current working tree, including the in-progress
sidekick and theme changes. This review changes only this file.

## Baseline and scope

- `npm test && npm run lint && npm run build` passed: 16 test files, 360 tests,
  no test warnings. Vitest printed an informational environment-performance tip.
- Reviewed the registry, metadata contracts, frame, component implementations,
  sampled reproduction prompts, styles, tests, and project documentation.
- Exercised the production build in headless Chrome. Sampled Inputs, Sliders,
  Navigation, Feedback, and Experiments at 320, 390, 768, 1024, and 1280px.
  Those category views had no page-level horizontal overflow or runtime errors.
  The narrow tab strip scrolls internally; the map intentionally crops its image.
- The Impeccable source detector returned no findings. Browser checks still
  exposed the issues below. This was not a full screen-reader, cross-browser,
  touch-device, or WCAG conformance audit.
- Preserve the existing strengths: colocated metadata and prompts for all 30
  registered entries, native semantics, explicit reset controls, shared theme
  tokens, and substantial pure-logic coverage. Intentional hostile interaction
  is not a defect to remove.

Priorities: **P1** before release; **P2** next engineering pass; **P3** maintenance.
No P0 blocker was found. The review findings comprise **2 P1, 6 P2, and 1 P3**
items; the opportunities below are separate from that count.

For every component fix, update its metadata, reproduction prompt, and affected
Talk lines in the same change. Preserve the specified interaction constants and
the straight descriptive voice.

## P1 — accessibility fixes

- [x] **1. Return focus to visible content when the current entry is selected again.**
  **Location:** `src/components/collection.tsx:143` and `:197`.
  At a mobile breakpoint, open an entry, reopen Library, and activate that same
  entry. `openEntry` closes the menu, but the focus effect only depends on
  `category` and `entryId`, which have not changed. In Chrome, the active element
  remained `.rail-entry` with no client rectangles because its menu was hidden.
  **Action:** make focus transfer depend on the selection action, including a
  repeated selection, rather than only on changed pane identifiers. Keep the
  existing same-category expand/collapse behavior.
  **Done when:** mouse and keyboard activation of the current entry both close
  the mobile menu and focus the visible pane heading; Tab continues into that
  pane, and initial page load does not steal focus. Add a browser regression.
  This is a frame focus-order/visibility issue, outside the hostile exemption.
  **Done:** the pane focus effect now keys on a selection count rather than on
  `category`/`entryId`, so a repeated selection moves focus. Covered by
  `src/components/collection.test.ts`, which mounts the frame in jsdom and
  fails without the fix. jsdom has no layout, so it establishes focus order
  only; the visibility half still wants the browser suite in item 8.

- [x] **2. Raise placeholder text contrast in both themes.**
  **Location:** `src/components/inputs/inputs.module.css:46` and
  `src/app/globals.css:14`.
  Leading caret and Sorted email use `--faint` for their 15px placeholders.
  Computed colors measure **3.40:1** for `#8c8c80` on `#ffffff` and **3.75:1**
  for `#75756b` on `#1a1a17`, below the 4.5:1 normal-text requirement
  (WCAG 1.4.3). Visual accessibility remains required inside specimens.
  **Action:** use a text token that passes on `--field`; avoid changing decorative
  uses of `--faint` unnecessarily. Update both portable prompts' resolved colors.
  **Done when:** empty fields meet at least 4.5:1 in light and dark themes and
  browser-computed colors agree with their prompts.
  **Done:** `.textInput::placeholder` now uses `--muted`, matching the password
  field's placeholder, which already passed. Headless Chrome reports
  **#6b6b63 on #ffffff at 5.37:1** and **#9c9c91 on #1a1a17 at 6.29:1** for both
  fields, agreeing with the updated prompts. The decorative `--faint` uses in
  `sliders.module.css` and `form-specimens.module.css` are unchanged.

## P2 — behavior, performance, and regression coverage

- [x] **3. Respond to reduced-motion changes without a reload.**
  **Location:** `src/components/sidekick/sidekick.tsx:104`,
  `src/components/sidekick/radio-dot.tsx:33`, and other mount-time motion reads.
  The sidekick captures the preference once. After switching to reduced motion
  while the page was open, a pointer move to x=800 still produced a trailing,
  stretched cuff near x=414; reloading with that preference placed it immediately
  at x=788, accounting for its 12px radius. CSS cannot cancel these JS springs.
  **Action:** subscribe to media-query changes and settle active frame animations
  immediately. Audit the same pattern in specimens and retain each component's
  documented reduced-motion behavior. Fog of war already handles query changes.
  **Done when:** toggling the preference in either direction updates the cuff and
  radio dot while mounted; enabling reduction during motion snaps to the current
  target. Verify affected specimens and synchronize their prompts in that fix.
  **Done:** `src/components/reduced-motion.ts` holds one lazily created query;
  `prefersReducedMotion()` reads `matches` at the point of use, so the value is
  never captured. Fifteen components moved onto it, and `envelope` and
  `heavyModel` now take a `() => boolean` instead of baking the value in at
  construction, which keeps their springs rather than rebuilding them. Radio dot
  additionally listens for the change, because its tick does not consult the
  preference and an in-flight dot has to be seated. Verified in headless Chrome
  by emulating the preference on a live page: with motion allowed the cuff still
  trails at 569px 120ms after a pointer move to x=800, and with reduction
  switched on mid-session it lands on 788px, which previously took a reload.
  The eleven affected prompts gained a line stating the preference is read where
  it is used. Not changed: `collection.tsx:151` reads the preference once per
  pane for the reveal observer, which re-runs on navigation.

- [x] **4. Keep specimen implementations and prompts out of the splash bundle.**
  **Location:** `src/components/sidekick/lines.ts:1`,
  `src/components/entries.ts`, and `src/app/layout.tsx`.
  The root sidekick imports `lines.ts`, which imports the complete entry registry
  to collect Talk lines. In the reviewed production build, `/` loaded the chunk
  containing reproduction prompts and entry code: **273,715 bytes raw (~267 KiB),
  79,194 bytes gzip (~77 KiB)**. These are one chunk's sizes, not total page weight
  or measured transfer compression. The dependency grows with every new entry.
  **Action:** assemble the line map outside the root client's implementation
  dependency graph, for example through server-side extraction and a serializable
  map. Preserve colocated component metadata as the source of truth. Then split
  collection implementations by category or entry if the measured payload warrants it.
  **Done when:** an initial `/` load does not fetch component implementations,
  reproduction prompts, or their datasets solely to supply Talk lines; entering
  the collection still loads operable entries with the correct lines. Compare
  production network requests and compressed bundle sizes before and after.
  **Done:** `lines.ts` no longer imports the registry. It keeps `FRAME_LINES`
  and accepts the rest through `registerEntryLines`, which the collection calls
  as it loads from the flattened map in `src/components/entry-lines.ts`. Lines
  stay colocated in each `meta`; only the reader moved. Measured in headless
  Chrome against the production build, comparing like with like:

  | `/` | scripts | over the wire | prompts loaded |
  | --- | --- | --- | --- |
  | before | 13 | 431.4 KiB | yes, an 80.3 KiB chunk |
  | after | 12 | 351.2 KiB | none |

  **One correction to the diagnosis above.** As shipped, `/` still loads the
  collection chunk, so the raw number barely moves (440.7 KiB to 440.1 KiB).
  That is `next/link` prefetching `/collection` for the Enter link, not the
  Talk lines: disabling prefetch on that link removes it entirely, which is how
  the table was measured. The prefetch is deliberate and was left alone. The
  registry is no longer in the root client's graph either way.
  Splitting the collection by category is not yet warranted; that entry chunk
  serves the one route that needs all of it.

- [x] **5. Let the sidekick stop scheduling work at rest.**
  **Location:** `src/components/sidekick/sidekick.tsx:160` and `:245–274`.
  The animation schedules its next frame unconditionally. A settled splash page
  with no pointer interaction recorded **61 rAF callbacks in one second**.
  While locked, the loop also repeatedly measures the target, describes it, writes
  cuff geometry, then reads `tab.offsetWidth`, creating a layout-flush risk.
  The callback count is observed; a CPU or frame-time improvement is not yet measured.
  **Action:** stop when springs, fades, and target geometry have settled; wake on
  pointer movement, relevant DOM/state changes, scroll, resize, and mode changes.
  Batch layout reads before writes. Continue tracking animated specimen targets
  and live DOM readouts correctly.
  **Done when:** a static page has no continuous sidekick rAF loop at rest, and a
  browser performance trace confirms reduced idle work without losing tracking,
  readout updates, or the existing spring motion.
  **Done:** the tick now schedules the next frame at its foot instead of its
  head, and only when something is still moving: every spring at its target,
  `lock`, `cuffAlpha` and `tabAlpha` on their values, and the shown target
  caught up with the hovered one. `blend` snaps the last half-thousandth so an
  asymptote can actually arrive. The loop is restarted by `wake()` on pointer
  move, over and leave, on capturing scroll and resize, and on a mode or tab
  text change. `tab.offsetWidth` moved up into the read phase beside
  `getBoundingClientRect`, so the frame no longer writes the cuff and then
  reads layout back.

  Measured on the splash in headless Chrome, counting rAF callbacks through a
  patched `requestAnimationFrame`:

  | idle for one second | before | after |
  | --- | --- | --- |
  | untouched | 60 callbacks | 0 |
  | after the pointer settled | 60 callbacks | 0 |

  Motion is unchanged: the cuff reaches 387.6 then 587.8 before and 387.5 then
  587.8 after, sampled at the same points. A locked target still envelops
  correctly (86.7x48.0 target to a 98.7x60.0 cuff) with its line shown.

  **Deliberately not done:** a *locked* cuff keeps ticking. The element it
  envelops can move, resize or relabel itself under a still pointer, and
  re-measuring each frame is how that is followed; stopping there would need
  resize and mutation observers on the target and would still miss movement
  driven by a transform on an ancestor. The idle case the review measured is
  the one that stops.

- [x] **6. Scope copy feedback to the prompt that was actually copied.**
  **Location:** `src/components/collection.tsx:459–490`.
  Copy an entry's prompt, then select another entry within 1.6 seconds. The reused
  `EntryPane` retains `copied=true`, so the new prompt displays a successful-copy
  checkmark although the clipboard contains the previous prompt. This reproduced
  between Leading caret and Sorted email. A pending clipboard operation can also
  complete after selection changes.
  **Action:** associate copy status and completion with an entry ID or reset the
  pane's local feedback on entry changes. Ignore stale async completions and
  restart the feedback timer on each successful copy.
  **Done when:** a newly selected prompt never inherits another entry's success
  state; delayed, failed, and repeated copies display and announce the right result.
  Add an interaction regression with a controllable clipboard promise.
  **Done:** the pane holds `{ entryId, sequence }` rather than a flag, and the
  mark is shown only while that entry is the one on show. A copy takes the next
  number and drops its own result if a newer copy started meanwhile; each
  success is a new object, so the 1.6s pause restarts rather than inheriting
  the previous copy's remaining time. Five tests in
  `src/components/collection.test.ts` drive a clipboard the test settles by
  hand; three of them fail against the previous implementation, and the two
  that pass either way cover the plain and refused cases.

- [x] **7. Give categories and entries shareable locations and browser history.**
  **Location:** `src/components/collection.tsx:12–45`, `:179–202`, and `:444`;
  `src/app/collection/page.tsx`.
  Entry selection changes React state but leaves the URL at `/collection`.
  Reload restoration uses session storage and only applies to reload navigation.
  A copied link therefore cannot open the specimen a reviewer is viewing, and
  Back/Forward cannot traverse their selections.
  **Action:** represent category and entry in validated URL state, using routes
  or search parameters. Use navigable links where appropriate, define fallback
  behavior for unknown IDs, and make explicit URLs take precedence over saved state.
  This is a library-navigation enhancement, not a change to specimen behavior.
  **Done when:** a detail URL opens the correct entry in a fresh tab; reload,
  Back, Forward, and unknown IDs behave predictably; focus and scroll restoration
  work on desktop and mobile.
  **Done:** the address bar holds the place. `src/components/place.ts` is the
  whole contract — `parsePlace`, `placeSearch`, `placeHref`, `samePlace` — and
  is pure, so `place.test.ts` covers the fallbacks and a round trip over every
  address the library can produce. Entry ids are unique library-wide, which
  `entries.test.ts` now asserts, so an entry names its own shelf: the addresses
  are `/collection`, `/collection?category=sliders`, `/collection?entry=rebound`.
  An `?entry=` wins over a `?category=` that disagrees with it; an id matching
  nothing falls back to the named category, then to Buttons, and the address is
  rewritten once on arrival so Back cannot return to a state the rail cannot show.

  The rail's categories and entries are `<a href>` now rather than buttons, so
  a link can be copied, middle-clicked or opened in a new tab; a click carrying
  any modifier or a non-primary button is left to the browser (`opensElsewhere`).
  Selection is `history.pushState` plus a `badui:place` event, read back through
  `useSyncExternalStore` — no `useSearchParams`, so `/collection` stays
  prerendered with no Suspense boundary, and no Next navigation, so the session
  state below the place survives. Back and Forward bump the same selection
  counter item 1 added, so they move focus to the pane heading too. `openCategory`
  is derived now, from the shelf on show and one folded-by-hand id, which removed
  the effect that used to sync it.

  Session storage keeps only `{ href, scrollY }`, restored solely when a reload
  lands back on the same address; the place itself no longer needs it, so an
  explicit URL wins by construction rather than by a precedence rule.

  Verified in headless Chrome against the production build on a spare port:

  | check | result |
  | --- | --- |
  | `?entry=rebound` in a fresh tab | opens Rebound, unfolds Sliders, focus left on `body` |
  | `?entry=nowhere-at-all` | opens Buttons, address rewritten to `/collection` |
  | `?category=feedback` | opens Feedback |
  | rail click | `?entry=shrinking`, focus on `h1#pane-title` |
  | Back, then Forward | `/collection` then `?entry=shrinking`, focus moved both ways |
  | reload at `?category=inputs` | same pane, scroll restored to 598px |
  | switch set, shelf changed, Back | switch still set |
  | 390px: menu, then an entry | menu closes, focus on the heading, no overflow |

  Console was free of errors and warnings throughout. Ten new tests in
  `collection.test.ts` cover the same ground in jsdom; two mutations — always
  pushing instead of replacing, and dropping the `popstate` listener — each fail
  exactly one of them. jsdom cannot traverse its own session history, so those
  tests simulate Back as the address moving plus `popstate`; the real buttons
  are covered by the browser checks above and belong in item 8's suite.

  **Not done here:** the durable ID and shared-state contract in the
  opportunities list below. Ids are asserted unique and URL-safe, and switches
  and resets are deliberately kept out of the address, but renaming an entry
  still changes its link and nothing records that as a commitment.

- [ ] **8. Add repeatable browser checks and run the required gate in CI.**
  **Location:** `package.json`, `vitest.config.mts`, existing `src/**/*.test.ts`;
  no checked-in `.github/workflows` directory or browser-test suite was found.
  The current 360 tests pass despite the reproduced focus, copy-feedback, and
  live motion-preference bugs. Pure helpers and static renders cannot establish
  layout, pointer capture, or focus behavior.
  **Action:** retain Vitest for pure logic and add a small browser suite covering
  the regressions above plus reset/remount behavior, pointer release/cancel,
  prompt copying, theme initialization, and mobile menu Escape/outside dismissal.
  Run `npm ci`, the required test/lint/build gate, and the browser suite in CI.
  Use a dedicated server port and isolate test traffic from analytics.
  **Done when:** the gate runs on pull requests, detects the reproduced regressions,
  includes narrow and desktop layouts and both themes, produces actionable failure
  artifacts, and does not stop unrelated local servers.

## P3 — repository documentation

- [ ] **9. Reconcile README behavior and test descriptions with the application.**
  **Location:** `README.md`, especially “The collection”, “The cursor companion”,
  and “Tests”; compare `src/components/collection.tsx:96–101` and `:218`.
  README says Reset all restores the entire collection, while `resetSection`
  remounts only the selected category and preserves switch settings. It describes
  two modes without explaining Off, lists only 11 of the 30 entries, and names
  only `inspect.ts`/`lines.ts` as pure test coverage despite the expanded suite.
  **Action:** describe category-scoped reset and retained switches, document Off,
  identify the roster as examples or avoid duplicating it, and update test scope.
  Preserve the intentional reset implementation unless separately changing that
  product decision. Include the browser command when item 8 lands.
  **Done when:** README matches the actual controls, reset scope, registry, and
  verification commands, without introducing a fixed roster or explaining the joke.

## Suggested execution order

Address 1–2 first, then 3 and 6 with their regressions. Establish the browser/CI
coverage in 8, then tackle bundle and idle work (4–5) and navigation (7). Update
README (9) with the final behavior. Finish each implementation change with
`npm test && npm run lint && npm run build` and the relevant browser checks.

For an Impeccable-assisted pass: `impeccable harden` fits 1, 3, and 6;
`impeccable colorize` fits 2; `impeccable optimize` fits 4–5; and
`impeccable shape` fits 7. Finish with `impeccable polish` and a fresh
`impeccable audit` after the concrete fixes land.

## Opportunities and things to consider

These are potential additions, separate from the review fixes. Prioritize a small
benign collection and validating prompt portability; choose the remaining work
according to its value for the author and portfolio reviewers.

- [ ] **Add a small, deliberate benign collection.**
  Choose components that demonstrate careful interaction design, such as a
  combobox, date picker, or sortable list. Present each as an independent entry
  in the same factual voice, without framing it as a corrected hostile component.
  **Done when:** each chosen entry is operable and ships with complete metadata,
  a portable prompt, bespoke Talk lines, and appropriate accessibility checks.
  The examples are candidates, not a fixed roster.

- [ ] **Validate reproduction prompts in a standalone project.**
  Recreate a representative sample using only their prompts in an empty React +
  TypeScript project, without repository imports or styles. Compare behavior,
  appearance, keyboard semantics, constants, and reduced-motion behavior.
  **Done when:** the comparison is recorded, discovered prompt gaps are corrected
  alongside their components, and the process can be repeated for future entries.
  Keep this distinct from the existing tests that validate prompt structure.

- [ ] **Link directly from entry details to relevant source.**
  Give reviewers a direct path to the implementation, extracted pure logic, and
  relevant tests. Derive links from maintained repository paths and omit links
  that do not apply to an entry.
  **Done when:** the links resolve to the correct files, remain accessible in
  both themes, and ship with frame Talk lines for the new interactive elements.

- [ ] **Scaffold new entries with their required supporting files.**
  Add a small command that creates a component, colocated CSS Module, prompt,
  metadata structure, and registry entry together. Validate ID collisions and
  protect existing files. Make unfinished content explicit; generated placeholder
  documentation must not pass the finished-entry checks.
  **Done when:** scaffolding produces a useful starting point and the completion
  gate rejects it until the implementation, prompt, metadata, and lines are authored.

- [ ] **Define permanent IDs and shared-state behavior before shipping detail URLs.**
  Extend review item 7 with a durable contract: keep entry IDs stable through name
  changes, decide which options belong in a shared link, and define how explicit
  URL options interact with saved state. Distinguish resetting the interaction
  from restoring default options without silently changing current reset behavior.
  **Done when:** the contract is documented and navigation tests cover renamed
  entries, invalid options, reloads, shared links, and the chosen reset semantics.

- [ ] **Set a lightweight performance budget for library growth.**
  Build on review items 4–5 by recording initial JavaScript size, category-loading
  cost, and idle animation work. Establish limits from measured baselines and
  check representative canvas and pointer entries as the library expands.
  **Done when:** repeatable measurements expose the cost of an addition and
  flag meaningful regressions without treating intentional animation as a defect.

**Scope consideration:** defer accounts, favorites, ratings, and elaborate
filtering until there is a concrete need. Favor exceptional, independently
inspectable entries over additional application infrastructure.
