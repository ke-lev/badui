export const corneredButtonPrompt = `WHAT TO BUILD
Build a portable React + TypeScript pointer-repelled button named CorneredButton. It takes no props and is used as <CorneredButton />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a vertical specimen containing a position-relative arena and a readout below it.
- Center one native type="button" absolutely in the arena with label “Confirm”.
- The readout is a paragraph with role="status", aria-live="polite", and aria-atomic="true", containing “Presses” and the integer count.
- Preserve native pointer, keyboard, focus, and click semantics; every delivered click increments Presses.

BEHAVIOR
- Keep an animated body position, a pushed destination initially at the arena center, the current pointer position, and a squash spring. Drive updates with requestAnimationFrame from an effect and observe arena and button size with ResizeObserver.
- Measure button half-size. Its center is bounded by the arena minus exactly EDGE = 12px clearance. If a button is larger than an axis, pin that axis to its midpoint.
- Measure pointer distance as the Euclidean gap to the destination button rectangle, zero inside it. Repulsion begins at RADIUS = 90px from that edge.
- Track an alarm level between 0 and 1. On each pointermove or pointerdown in the arena with a previous pointer position, compute elapsed = max((event.timeStamp - previous event timeStamp) / 1000, 0.004) seconds and sample = distance moved / elapsed. Smooth pointer speed as speed += (sample - speed) * (1 - exp(-elapsed / 0.08)). Compute startle as a smoothstep: 0 at or below CALM_SPEED = 30px/s, 1 at or above STARTLE_SPEED = 180px/s, t = (speed - 30) / 150, startle = t² * (3 - 2t). Set alarm = max(current decayed alarm, startle) and record the timestamp.
- With no previous pointer position, reset speed to 0; if that event is a pointerdown, set alarm to 1.
- The alarm decays continuously: alarm at time now = stored alarm * exp(-(now - stored timestamp) / 1000 / 0.6), using real elapsed time even across idle periods with no frames.
- Each frame cap delta time at 0.05 second. Compute closeness = max(0, 1 - gap / 90) and pressure = closeness² * alarm. If pressure < MIN_PRESSURE = 0.001, do not push. Otherwise push the destination directly away from the pointer by MAX_SPEED * pressure * deltaTime, where MAX_SPEED = 1800px/s.
- The push direction is the unit vector from pointer to destination. If the pointer exactly overlaps the destination, use (1, 0) toward the roomier horizontal side ((-1, 0) when there is less room to the right). Keep all movement within bounds.
- Per axis, a component is blocked when it points into a wall the destination has already reached (positive at max, negative at min). A blocked component does not move the destination and is not redirected; only unblocked components move it, clamped to bounds. Record blocked = (the direction's x if blocked on x else 0, the direction's y if blocked on y else 0).
- If blocked is non-zero, the button is pinned against the wall with strength pressure * |blocked|: set the squash axis to blocked normalized and mark the squash as anchored. While pinned, the squash spring's target is -MAX_SQUISH * strength with MAX_SQUISH = 0.3; otherwise its target is 0. A pointer aimed squarely into a wall holds the destination still at full strength; an angled one slides it along the wall by the unblocked component while compressing it by the blocked one.
- Animate x and y toward the destination with semi-implicit Euler springs: STIFFNESS = 1000, damping ratio = 0.6, DAMPING = 37.94733192202055, timestep substeps no larger than 1/240 second, frame delta capped at 0.05 second, position epsilon 0.05 and velocity epsilon 0.5.
- Detect separately when the animated body first meets an x or y wall. Point the squash axis at that wall (the sign of the body's offset on that axis), mark it anchored, and kick the squash spring with velocity -min(axisArrivalSpeed / 220, 11). Squash stiffness is 1600, damping ratio 0.4, damping 32, value epsilon 0.0005, and velocity epsilon 0.005.
- Stretch along current velocity by min(speed / 6000, 0.22). Apply squash along its current axis. When the squash is anchored and its value q is negative, shift the button by (|axis.x| * halfWidth + |axis.y| * halfHeight) * -q along the axis, so its wall-side edge stays in place. Compose transforms so neither effect rotates the label; keep base translate(-50%, -50%) plus the center offset.
- On pointerdown directly on the button, set the squash axis to vertical, not anchored, and add a squash velocity of exactly -PRESS_SQUASH = -5 unless reduced motion is active; this does not suppress the click.
- On pointermove or pointerdown in the arena, update the pointer and wake animation. On pointerleave clear the pointer. Keep animating while the destination moves, while pinned, or until the body, its velocities, and the squash have settled.
- On resize, remeasure and clamp the destination. If it changes, put the body at that clamped point and zero both position velocities.
- Under prefers-reduced-motion, move the body directly to the pushed destination every frame with no stretch, squash, or pinned compression. Preserve the alarm, repulsion, wall routing, native clicking, and the count.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen stretches to its container, is a vertical flex layout with 12px gap, min-width 0, and color light-dark(#282824, #e8e7e0). The arena flexes to fill available height, has position relative, min-height 160px, and touch-action manipulation.
- The button is top 50%, left 50%, initially translate(-50%, -50%), inline-flex centered, min-height 39px, padding 8px 16px, 1px transparent border, 5px radius, background light-dark(#30312b, #e8e7e0), text light-dark(#fafaf6, #1a1a17), 12px medium inherited sans-serif, line-height 1.5, nowrap, pointer cursor, will-change transform, and touch-action manipulation.
- Button hover background is light-dark(#4d5142, #cdd1c2). Focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 3px offset.
- The readout is a flex row spaced apart, margin 0, 11px, color light-dark(#6b6b63, #9c9c91). The count is light-dark(#282824, #e8e7e0) in a sans-serif stack with tabular numerals.
- Use a 150ms ease background transition for the button and remove it under reduced motion.

DONE WHEN
- A pointer moving at or below 30px/s never pushes the button; faster movement raises the alarm, which decays with a 0.6 second time constant; a press with no prior pointer position alarms fully.
- Repulsion starts strictly inside the 90px edge radius, reaches 1800px/s at the edge, and follows a squared falloff; the part of a push aimed into a reached wall is never redirected along it.
- The destination cannot leave its 12px inset bounds; pushed into a wall it compresses against that wall by up to 30% in proportion to the blocked share of the push, with its wall-side edge fixed; resize keeps it valid.
- Spring trail, speed stretch, wall squash, press squash, reduced motion, native activation, and live count retain every stated constant.
`;
