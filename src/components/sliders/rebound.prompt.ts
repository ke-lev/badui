export const reboundPrompt = `WHAT TO BUILD
Build a portable React + TypeScript temperature slider named Rebound. It takes no props and is used as <Rebound />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a span reading “Temperature”, given a stable id from useId, and on the right a span reading “°C”.
- Below it, an aria-hidden paragraph showing the value with one decimal followed by “°”, e.g. “21.0°”.
- Below that, a track group containing a div with role="slider", tabIndex 0, aria-labelledby pointing at the “Temperature” span, aria-orientation="horizontal", aria-valuemin 10, aria-valuemax 30, aria-valuenow equal to the current value, and aria-valuetext equal to the value with one decimal followed by “ degrees Celsius”.
- Inside the slider, an aria-hidden rail span, then an aria-hidden lane span holding the thumb span.
- Beneath the slider, an aria-hidden row of 21 tick spans, one per degree, with indexes 0, 5, 10, 15, and 20 marked major, then aria-hidden endpoint labels “10°” and “30°”.

BEHAVIOR
- Keep the thumb position p (0 to 1, starting at 0.55) and its velocity v (track widths per second, starting at 0) in plain variables inside one mount effect, not in React state. Write the thumb's left style directly as p × 100% whenever p changes, and set React state only to the displayed value. Attach every listener natively inside that effect and remove them, and cancel any pending animation frame, on unmount.
- The value is 10 + Math.round(p × 40) / 2: half-degree steps from 10 to 30, starting at 21.0.
- A pointer maps to p as (clientX − slider left − 7) / (slider width − 14), clamped to 0–1.
- pointerdown with button 0: capture the pointer, focus the slider with preventScroll, cancel any pending frame, set v to 0, set p from the pointer, start a sample list with one {time: performance.now(), p}, and mark the slider as dragging.
- pointermove from the captured pointer: set p from the pointer, append {time: performance.now(), p}, then discard samples more than 100ms older than now.
- pointerup from the captured pointer: compute the release velocity, then end the drag with it. pointercancel or lostpointercapture from the still-captured pointer ends the drag with velocity 0. Ending a drag clears the pointer and samples, unmarks dragging, and launches with the given velocity.
- Release velocity at time now: keep samples no more than 100ms old. If fewer than two remain, or the newest is more than 50ms old, it is 0. Otherwise it is (newest.p − oldest.p) / ((newest.time − oldest.time) / 1000), or 0 if that time span is 0, clamped to −8…8.
- Launch with a velocity: set v to it. If v is not 0 and no frame is pending, set last = performance.now() and request an animation frame.
- Each frame at time now: dt = Math.min((now − last) / 1000, 0.05); last = now. Let next = p + v·dt and v = v·Math.exp(−1.5·dt). While next is below 0 or above 1, set next to −next (below 0) or 2 − next (above 1) and set v = −v × 0.7. If |v| < 0.01, set v to 0. Set p = next. Request another frame only while v is not 0.
- keydown on the slider: ArrowRight and ArrowUp are direction +1, ArrowLeft and ArrowDown are −1; for those, prevent the default and launch with clamp(v + 0.6 × direction, −8, 8). Other keys are ignored.
- Read prefers-reduced-motion: reduce once on mount. When it matches, ending a drag always launches with 0, and an arrow key sets p to clamp(p + direction / 40, 0, 1) instead of launching.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row with 20px line-height, items centered, spaced apart, 12px gap. The “°C” span is light-dark(#6b6b63, #9c9c91), 11px sans-serif, normal letter-spacing, tabular numerals.
- The reading paragraph is block-level with no margin, 24px top and 21px bottom padding, a 1px solid light-dark(#deded6, #34342f) bottom border, nowrap, tabular numerals, and a sans-serif stack. Its font size is clamp(25px, 2.8vw, 32px), line-height 1.3, letter-spacing -1.5px.
- Put the track group 31px below the reading. The slider is position relative, 28px tall, cursor grab (grabbing while dragging), touch-action none, 5px outline offset; its focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 2px radius.
- The rail is absolute, spanning the full width, 13px from the top, 2px high, light-dark(#c6c8ba, #4a4b43). The lane is absolute with inset 0 7px and pointer-events none.
- The thumb is absolute, top 1px, border-box 14px by 26px with margin-left -7px, 4px solid light-dark(#ffffff, #1a1a17) border, 3px radius, 1px solid light-dark(#c6c8ba, #4a4b43) outline, and light-dark(#899176, #717b5f) fill.
- Ticks sit in a 12px-high flex row, spaced apart, aligned to the top, with 6px horizontal margins and pointer-events none: each is 1px by 4px in light-dark(#c6c8ba, #4a4b43) and majors are 7px high. Endpoint labels are a flex row spaced apart, 7px top margin, 10px sans-serif, color light-dark(#6b6b63, #9c9c91).
- At widths up to 600px, the reading uses clamp(24px, 7vw, 30px).

DONE WHEN
- The thumb follows the pointer while held; released mid-drag it keeps moving, slows, and rebounds off both ends until it rests.
- A pointer held still for 50ms before release leaves the thumb where it was let go.
- Arrow keys push the thumb in their direction; under reduced motion they move it half a degree and a release never coasts.
- The reading, aria-valuenow, and aria-valuetext always carry the same half-degree value.
`;
