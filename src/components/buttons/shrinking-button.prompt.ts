export const shrinkingButtonPrompt = `WHAT TO BUILD
Build a portable React + TypeScript proximity-shrinking button named ShrinkingButton. It takes no props and is used as <ShrinkingButton />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing a position-relative arena and a readout below it.
- Center one native type="button" absolutely in the arena. Keep “Submit” in a nested span throughout the interaction so it remains the accessible name even when visually transparent.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing “Presses” and the integer count.
- Preserve native pointer, keyboard, focus, and click semantics; every delivered click increments Presses.

BEHAVIOR
- Measure the button’s natural offsetWidth, offsetHeight, left padding, top padding, and top-left border radius after mount. Keep independent width and height spring states, both initially 0 where 0 means full size and 1 means fully shrunk.
- Measure proximity as the Euclidean gap from the pointer to the button rectangle at its full natural size, centered in the arena. Do not measure from the currently shrinking edge.
- Set FAR = 16px, NEAR = 1px, and MIN_SIZE = 3px. The shrink goal is 0 when gap is at least 16 and 1 when gap is at most 1. Between them let t = (16 - gap) / (16 - 1), then use smoothstep t² * (3 - 2t).
- If the pointer leaves the arena, set the goal to 0 and animate back to full size.
- Advance both springs with semi-implicit Euler substeps no larger than 1/240 second and cap frame delta at 0.05 second. Height uses STIFFNESS = 1100, damping ratio 0.6, and DAMPING = 39.7994974842648. Width uses STIFFNESS = 650, damping ratio 0.6, and DAMPING = 30.594117081556707. Both use value epsilon 0.0005 and velocity epsilon 0.005.
- Compute real width as max(3, naturalWidth + (3 - naturalWidth) * widthShrink) and real height equivalently from heightShrink. Do not use scale transforms, so the hit area is exactly the drawn size.
- Set min-height to 0 while altered. Scale vertical padding by 1 - heightShrink and horizontal padding by 1 - widthShrink, each clamped to at least 0. Set border radius to min(naturalRadius, currentHeight / 2).
- Set label opacity to clamp(1 - max(widthShrink, heightShrink) / LABEL_FADE, 0, 1), where LABEL_FADE = 0.35. Height’s stiffer spring must lead width, producing a pill-like intermediate shape.
- When both springs return to exact zero value and velocity, clear every inline width, height, min-height, padding, border-radius, and opacity override. On a pointer event while at that exact rest state, remeasure the natural dimensions to account for a late font swap.
- On pointermove or pointerdown in the arena, update pointer position relative to the arena center and wake animation. Do not add ResizeObserver behavior.
- Under prefers-reduced-motion, assign both spring values directly to the current goal with zero velocity on each update, then paint the same real dimensions and opacity without spring motion.

STYLING
- The specimen stretches to its container, is a vertical flex layout with 12px gap, min-width 0, and color #282824. The arena flexes to fill available height, has position relative, min-height 160px, and touch-action manipulation.
- The button is top 50%, left 50%, initially translate(-50%, -50%), inline-flex centered, min-height 39px, padding 8px 16px, 1px transparent border, 5px radius, background #30312b, text #fafaf6, 12px medium inherited sans-serif, line-height 1.5, nowrap, hidden overflow, pointer cursor, will-change transform, and touch-action manipulation.
- Keep the label span display block with hidden overflow.
- Button hover background is #4d5142. Focus-visible outline is 2px solid #667251 with 3px offset.
- The readout is a flex row spaced apart, margin 0, 11px, color #6b6b63. The count is #282824 in a monospace stack with tabular numerals.
- Use a 150ms ease background transition for the button and remove it under reduced motion.

DONE WHEN
- The button is full size at 16px or farther from its natural edge, exactly 3px by 3px at 1px or nearer, and follows the specified smoothstep between them.
- Real dimensions and padding create the true hit area, height leads width, label fades by shrink 0.35 without losing the accessible name, and leaving restores the button.
- Spring constants, exact-rest cleanup, late remeasurement, reduced motion, native activation, focus treatment, and live count match the specification.
`;
