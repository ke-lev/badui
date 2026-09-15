export const mitosisButtonPrompt = `WHAT TO BUILD
Build a portable React + TypeScript button named MitosisButton. It takes no props and is used as <MitosisButton />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing a position-relative arena and one status readout below it.
- Inside the arena, render in this order: a zero-size aria-hidden SVG holding the neck filter, an aria-hidden, pointer-events: none blob layer, then the buttons.
- Start with one native type="button" button centered in the arena, whose only child is a span containing the text “Split”, which is its accessible name. Every child created later is also a native type="button" named “Split”, in normal tab order directly after its parent, with the same accessible name and behavior.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true". It contains the current “Buttons” count and “Presses” count.
- Preserve native pointer, focus, keyboard, and click semantics. Enter and Space presses split the focused button at its centre and count as delivered presses. The clicked button keeps focus.

BEHAVIOR
- Keep an ordered list of button cells. Each cell has an integer id and an arena-centre position in pixels. Start with id 0 at (0, 0), and keep the next id in a monotonic counter.
- On pointerdown on a cell, record that cell id and the pointer’s clientX and clientY. On the following click, use those coordinates as the cursor position. For a keyboard click with no recorded pointerdown, use the clicked button’s current centre as the cursor position. Clear the recorded pointer after each click.
- On every delivered click, take the clicked cell’s current centre from its bounding client rect (this includes any in-flight animation) and convert both it and the cursor to coordinates relative to the arena’s centre. Measure the cell’s untransformed offsetWidth and offsetHeight, and define its allowed centre bounds as the arena’s rectangle inset by 8px plus half those sizes. If an axis is too small for that inset, pin it to the axis midpoint.
- The cursor is the split origin, clamped to the allowed centre bounds. Let the split axis be the unit vector from the clicked cell’s centre to the origin. If they coincide, use (0, -1). With SPLIT_DISTANCE = 42px, the original cell rests at origin minus axis times 42 and the new cell rests at origin plus axis times 42; clamp both to the allowed bounds.
- Keep the original cell id and insert one new cell with the next id directly after it. The Buttons readout increases by one. Increase Presses by one for every delivered click, including keyboard activation.
- Position every button by transform only. At rest its transform is translate(-50%, -50%) translate(Xpx, Ypx) for its arena-centre position.

Division animation
- Animate with the Web Animations API (element.animate), started in a layout effect after the new cell mounts and before the browser paints. Duration is 600ms, fill none on buttons. If element.animate is unavailable, skip the animation.
- Let start be the clicked cell’s centre at the click, first and second its two resting centres, and axis the vector second minus first with angle θ = atan2(axis.y, axis.x) in radians. Every keyframe transform uses the same function list: translate(-50%, -50%) translate(Xpx, Ypx) rotate(θrad) scale(along, across) rotate(-θrad), where (X, Y) = start + (end - start) × travel.
- Keyframes, as offset: travel, along, across, neck, easing into the next keyframe:
  0.00: 0, 1, 1, 0, cubic-bezier(0.3, 0, 0.4, 1)
  0.22: 0, 1.16, 0.9, 1, cubic-bezier(0.5, 0, 0.2, 1)
  0.56: 1.08, 0.94, 1.05, 0.55, cubic-bezier(0.4, 0, 0.6, 1)
  0.66: 1.05, 0.97, 1.02, 0, cubic-bezier(0.4, 0, 0.6, 1)
  0.82: 0.98, 1.02, 0.99, 0, ease-in-out
  1.00: 1, 1, 1, 0, linear
- Before starting, cancel any running animations on the clicked button and its label span. The original animates from start to first; the new cell animates from start to second. Both overlap exactly until offset 0.22, so the pair first reads as one button stretching along the axis.
- Animate both label spans’ opacity over the same 600ms with keyframes at offset: opacity 0: 1, 0.16: 1, 0.26: 0, 0.46: 0, 0.6: 1, 1: 1, so neither label shows while the pair overlaps.
- For each split in flight, render three blobs in the blob layer: two rounded rectangles 2px narrower and 2px shorter than the clicked button’s offsetWidth and offsetHeight, animated with exactly the button keyframes to first and to second, and one 24px circle, the neck. The neck’s position is start + (midpoint of first and second - start) × travel. Let D be the length of the axis vector, u the axis divided by D (or (0, -1) if D is 0), and E = |u.x| × offsetWidth + |u.y| × offsetHeight. At each keyframe the neck’s length is L = max(D × travel - E × along + 24, 24) pixels, and its scale is (L / 24, neck) with the same rotate pair, so it always spans the gap and thins across it. Blobs use fill forwards and start with the transform of their first keyframe. When the neck animation finishes, remove that split’s blobs.
- If a cell splits again while it is the parent or child of a split in flight, remove that earlier split’s blobs immediately; other cells keep animating.
- The blob layer has filter: url(#goo). The filter uses color-interpolation-filters sRGB, feGaussianBlur stdDeviation 6, then feColorMatrix with values “1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12”. This fuses the pair and the neck while they are close and breaks the bridge as they separate. Give each filter a unique id per component instance.
- Keep every resting cell fully inside the arena. The arena clips overflow. Do not remove cells or merge overlapping cells.
- Track prefers-reduced-motion, including changes while mounted. When it matches, retain the same positions, counts, keyboard behavior, and pointer-origin split, but start no animations and render no blobs.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page’s color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen stretches to its container, is a vertical flex layout with 12px gap, min-width 0, and color light-dark(#282824, #e8e7e0). The arena flexes to fill available height, has position relative, min-height 200px, overflow hidden, and touch-action manipulation.
- Each button is absolutely positioned at top 50% and left 50% with z-index of its id plus 1, inline-flex, centred content, min-height 39px, padding 8px 16px, 1px solid transparent border, 5px radius, background light-dark(#30312b, #e8e7e0), text light-dark(#fafaf6, #1a1a17), 12px medium inherited sans-serif, line-height 1.5, nowrap, pointer cursor, and touch-action manipulation. Its only CSS transition is background 150ms ease, removed under reduced motion. Its background changes to light-dark(#4d5142, #cdd1c2) on hover. Its focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 3px offset.
- The blob layer is absolute, inset 0, z-index 0. Blobs and the neck are absolute at top 50% and left 50% with background light-dark(#30312b, #e8e7e0); blobs have a 5px radius and the neck is a circle.
- The readout is a flex row spaced apart with 18px gap, margin 0, 11px, color light-dark(#6b6b63, #9c9c91). Each label and its count sit in a flex span with 7px gap. Counts use light-dark(#282824, #e8e7e0) in a monospace stack with tabular numerals.

DONE WHEN
- The initial Split button is centered. A pointer click produces two Split buttons on opposite sides of the pointer position, and each one remains independently clickable, including mid-animation.
- Every delivered click adds exactly one button and one press, preserves native names and keyboard activation, and keeps both resting centres inside the arena.
- A split visibly stretches one button, pulls two apart past their resting points joined by a neck that thins and snaps, and settles; no blobs remain afterwards.
- Reduced motion removes all animation and blobs, and the live readout exposes both counts.
`;
