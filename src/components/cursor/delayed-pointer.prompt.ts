export const delayedPointerPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named DelayedPointer. It takes no props and is used as <DelayedPointer />. It renders an area that hides the system pointer and draws a pointer wherever the real pointer was 450 milliseconds earlier, with a centred Continue button inside and a press counter below. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing an area (a position-relative div) and a readout paragraph below it.
- Inside the area, render one native type="button" labelled “Continue” as its text content, then a div holding the drawn pointer with aria-hidden="true".
- The drawn pointer is an inline SVG, viewBox "0 0 16 22", width 16, height 22, with one path: d="M1.5 1.5v16.2l4.3-4.1 2.9 6.6 2.6-1.1-2.9-6.5h6z", fill light-dark(#282824, #e8e7e0) and stroke light-dark(#fafaf6, #1a1a17) set through CSS (presentation attributes do not accept light-dark()), stroke-width 1.25, stroke-linejoin round.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing a span “Presses” and a span with the integer count, starting at 0.
- The button keeps native focus and keyboard activation. Its onClick handler increments the count, so Tab then Enter or Space presses it.

BEHAVIOR
- Set DELAY = 450 milliseconds. Keep an ordered list of samples, each { t, p } where t is performance.now() and p is a position in pixels from the area's top-left corner, or null for outside.
- On pointermove and pointerdown on the area, append { t: performance.now(), p: (clientX - areaRect.left, clientY - areaRect.top) }. On pointerleave, append { t: performance.now(), p: null }. Each event schedules a requestAnimationFrame callback if none is pending.
- In each frame, with now as the frame timestamp, let cutoff = now - DELAY. Find the last sample whose t is at most cutoff. If there is none, draw nothing and schedule another frame if any samples exist. Otherwise discard every sample before it, draw its p exactly (no interpolation between samples), and schedule another frame only while newer samples remain.
- On each frame: when the drawn position is null set the pointer div's visibility to hidden; otherwise set it visible and set its transform to translate3d(x px, y px, 0). Then set a data-hover attribute on the button if the drawn point, converted back to client coordinates, lies within the button's getBoundingClientRect() edges inclusive, and remove it otherwise.
- The button has pointer-events: none, so the real pointer never hovers, presses, or clicks it.
- Listen for click on the area. If the click event's target is the button itself (keyboard activation), do nothing there. Otherwise, if the drawn position from the most recent frame lies within the button's bounds, increment the count. The click is not delayed.
- The delay is a property of the mechanism, not decorative motion, and is unchanged under prefers-reduced-motion.
- Remove all listeners and cancel any pending frame on unmount.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is a vertical flex column that grows to fill its container (flex: 1, align-self: stretch), 12px gap, min-width 0, color light-dark(#282824, #e8e7e0).
- The area is position relative, flex 1, min-height 160px, overflow hidden, cursor none, touch-action manipulation.
- The button is absolutely positioned at top 50%, left 50%, transform translate(-50%, -50%); inline-flex centred; min-height 39px; padding 8px 16px; 1px solid transparent border; 5px radius; background light-dark(#30312b, #e8e7e0); text light-dark(#fafaf6, #1a1a17); inherited sans-serif font at 12px, weight 500, line-height 1.5; nowrap; transition background 150ms ease. With data-hover its background is light-dark(#4d5142, #cdd1c2). Focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 3px offset.
- The pointer div is absolutely positioned at top -1.5px, left -1.5px, 16px by 22px, visibility hidden initially, pointer-events none, will-change transform. The SVG is display block.
- The readout is a flex row with space-between, margin 0, 11px, color light-dark(#6b6b63, #9c9c91). The count span is light-dark(#282824, #e8e7e0) in a monospace stack with tabular numerals.
- Under prefers-reduced-motion, remove the button's background transition.

DONE WHEN
- Entering the area shows no pointer for 450ms; the drawn arrow then retraces the real path exactly 450ms behind and disappears 450ms after leaving.
- The frame loop stops once the drawn pointer has caught up with the last sample.
- A click counts only when the drawn arrow is over the button at the moment of the click; keyboard activation counts exactly once.
`;
