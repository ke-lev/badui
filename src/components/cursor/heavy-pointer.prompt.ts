export const heavyPointerPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named HeavyPointer. It takes no props and is used as <HeavyPointer />. It renders an area that hides the system pointer and draws a pointer on an underdamped spring toward the real one, with a centred Continue button inside and a press counter below. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing an area (a position-relative div) and a readout paragraph below it.
- Inside the area, render one native type="button" labelled “Continue” as its text content, then a div holding the drawn pointer with aria-hidden="true".
- The drawn pointer is an inline SVG, viewBox "0 0 16 22", width 16, height 22, with one path: d="M1.5 1.5v16.2l4.3-4.1 2.9 6.6 2.6-1.1-2.9-6.5h6z", fill light-dark(#282824, #e8e7e0) and stroke light-dark(#fafaf6, #1a1a17) set through CSS (presentation attributes do not accept light-dark()), stroke-width 1.25, stroke-linejoin round.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing a span “Presses” and a span with the integer count, starting at 0.
- The button keeps native focus and keyboard activation. Its onClick handler increments the count, so Tab then Enter or Space presses it.

BEHAVIOR
- Keep a real position (pixels from the area's top-left corner, or null) and two springs, x and y, each { value, velocity }.
- On pointermove and pointerdown on the area, compute real = (clientX - areaRect.left, clientY - areaRect.top). If the previous real position was null, set both spring values to real and both velocities to 0, so the drawn pointer starts where the pointer enters. Store real and schedule a requestAnimationFrame callback if none is pending. On pointerleave, store null and schedule a frame.
- STIFFNESS = 45 and damping ratio 0.22, giving DAMPING = 2.9516097302997224. Under prefers-reduced-motion (read once on mount) use ratio 1, giving DAMPING = 13.416407864998739.
- In each frame, dt = min((now - last) / 1000, 0.05). If real is null, draw nothing and stop. Otherwise advance each spring toward its real coordinate with semi-implicit Euler in substeps of at most 1/240 second: acceleration = STIFFNESS * (target - value) - DAMPING * velocity; velocity += acceleration * h; value += velocity * h. After stepping, if |target - value| < 0.05 and |velocity| < 0.5, set value to target and velocity to 0.
- Draw at (x.value, y.value). Schedule another frame unless both springs sit exactly on their targets with zero velocity.
- On each drawn frame: when nothing is drawn set the pointer div's visibility to hidden; otherwise set it visible and set its transform to translate3d(x px, y px, 0). Then set a data-hover attribute on the button if the drawn point, converted back to client coordinates, lies within the button's getBoundingClientRect() edges inclusive, and remove it otherwise.
- The button has pointer-events: none, so the real pointer never hovers, presses, or clicks it.
- Listen for click on the area. If the click event's target is the button itself (keyboard activation), do nothing there. Otherwise, if the drawn position from the most recent frame lies within the button's bounds, increment the count.
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
- The drawn arrow appears where the pointer enters, overshoots a sudden 100px move by roughly 49px, swings back, and comes to rest exactly on the real position; the frame loop then stops.
- Under reduced motion it reaches the real position without passing it.
- A click counts only when the drawn arrow is over the button; keyboard activation counts exactly once.
`;
