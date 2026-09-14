export const personalSpacePrompt = `WHAT TO BUILD
Build a portable React + TypeScript button named PersonalSpace that keeps a disc around the pointer clear of itself by deforming its own shape. It takes no props and is used as <PersonalSpace />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing a position-relative arena and a readout below it.
- Center one native type="button" absolutely in the arena. Inside it, render a visually hidden span containing “Submit”, which is the accessible name, and an aria-hidden flex span holding one inline-block span per letter of “Submit”.
- Directly after the button, as its next sibling in the arena, render an aria-hidden, pointer-events: none span used only as the focus ring.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing “Presses” and the integer count.
- Preserve native pointer, keyboard, focus, and click semantics; every delivered click increments Presses.

BEHAVIOR
- The button element is a 272px by 132px box. The visible shape at rest is a 200px by 60px rectangle with 10px corner radius, inset 36px from every side of that box. All geometry below is in the box’s own pixel coordinates, origin at its top-left corner.
- Keep a disc with centre (cx, cy) and radius R. Every point of the shape at distance r from the centre is mapped straight away from the centre to distance sqrt(r² + R²), keeping its angle. A point exactly at the centre maps to (cx, cy - R). With R = 0 every point is unchanged. This map preserves area and never places a point inside the disc.
- Sample the rest outline clockwise, starting at the left end of the top edge: straight edges every 4px (n = max(1, ceil(length / 4)) samples per edge, excluding the endpoint), and each quarter-circle corner at n = max(1, ceil((π/2 · 10) / 4)) evenly spaced angles, excluding the endpoint.
- Each frame, map every sample. Between each consecutive pair (closing the loop), if the mapped endpoints are more than 2px apart, split the pair at its rest-space midpoint, map the midpoint, and recurse on both halves, to a maximum depth of 10. Emit points in order.
- Apply the result as the button’s inline clip-path: path(evenodd, "M x y L x y … Z"), coordinates to two decimals. If the disc’s centre lies inside the rest rounded rectangle (signed-distance test against the rounded corners) and R > 0, append a second subpath cutting the disc as a hole: M cx-R cy A R R 0 1 0 cx+R cy A R R 0 1 0 cx-R cy Z. The clip-path is also what receives the pointer, so the disc is never part of the button.
- Letters: after mount, and again on any pointer event while the disc is fully closed, record each letter span’s centre as offsetLeft + offsetWidth / 2 and offsetTop + offsetHeight / 2. Each frame with R > 0, for a letter centre at distance d from the disc centre and angle θ = atan2(dy, dx): move it to its mapped position, and apply transform: translate(mappedX - x px, mappedY - y px) rotate(θ rad) scale(s, 1/s) rotate(-θ rad), where s = max(d / sqrt(d² + R²), 0.35).
- Clamp the drawn R at 0 when its spring goes negative. When the drawn R is 0, clear the inline clip-path and every letter transform.
- Listen on the arena for pointermove (passive), pointerdown, and pointerleave. On pointermove or pointerdown, set the disc’s target centre to the pointer position relative to the button’s bounding client rect and mark the pointer present. If the radius spring is at exactly value 0 and velocity 0, first snap the centre springs to the target with zero velocity and remeasure the letters. On pointerleave, mark the pointer absent; the centre keeps its last target.
- The radius goal is 26 while present and 0 while absent.
- Advance springs with semi-implicit Euler substeps no larger than 1/240 second and cap frame delta at 0.05 second. The centre x and y springs use STIFFNESS = 520 and DAMPING = 22.80350850198276 (ratio 0.5). The radius spring uses STIFFNESS = 900 and DAMPING = 27 (ratio 0.45). All three settle to their target with zero velocity when within 0.05 of it and moving slower than 0.5 per second. Stop the animation loop when all three are settled; any pointer event restarts it.
- Under prefers-reduced-motion, set the centre directly to its target and the radius directly to its goal with zero velocity each frame, and paint the same geometry.

STYLING
- The specimen stretches to its container, is a vertical flex layout with 12px gap, min-width 0, and color #282824. The arena flexes to fill available height, has position relative, min-height 160px, and touch-action manipulation.
- The button is top 50%, left 50%, transform translate(-50%, -50%), 272px by 132px, inline-flex centered, padding 0, border 0, border-radius 0, background #30312b, text #fafaf6, 14px medium inherited sans-serif, line-height 1.5, nowrap, pointer cursor, touch-action manipulation, and a default clip-path of inset(36px round 10px). Hover background is #4d5142 with a 150ms ease background transition, removed under reduced motion.
- The button has no outline on focus-visible. The ring span is absolutely centered in the arena with translate(-50%, -50%), 200px by 60px, 10px radius; when the button is focus-visible, the ring shows a 2px solid #667251 outline with 3px offset.
- Letter spans are inline-block with white-space: pre. The hidden label is absolute, 1px by 1px, overflow hidden, clip-path inset(50%), nowrap.
- The readout is a flex row spaced apart, margin 0, 11px, color #6b6b63. The count is #282824 in a monospace stack with tabular numerals.

DONE WHEN
- At rest the button is a plain 200 by 60 rounded rectangle; with the pointer outside it nearby, its edge dents away from the pointer; with the pointer over it, a 26px-radius hole surrounds the pointer and the outline bulges, conserving area.
- Presses in the cleared disc do not reach the button, letters move and flatten with the material, and the shape closes back when the pointer leaves the arena.
- Spring constants, subdivision, fresh-open snapping, reduced motion, focus ring, accessible name, and live count match the specification.
`;
