export const compoundingPrompt = `WHAT TO BUILD
Build a portable React + TypeScript pointer speed slider named Compounding. It takes no props and is used as <Compounding />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a span reading “Pointer speed”, given a stable id from useId, and a decorative aria-hidden mouse icon: a 17px SVG with a 20 by 20 viewBox holding a rect at x 5.75, y 2.75, 8.5 wide, 14.5 tall, radius 4.25, and the path “M10 5.5v3”, both stroked in currentColor at 1.25 with no fill.
- Below it, an aria-hidden paragraph showing the displayed value with one decimal followed by “×”, e.g. “1.0×”.
- Below that, a track group containing a div with role="slider", tabIndex 0, aria-labelledby pointing at the heading span, aria-orientation="horizontal", aria-valuemin 0.1, aria-valuemax 10, aria-valuenow equal to the displayed value, and aria-valuetext equal to the displayed value with one decimal followed by “ times”.
- Inside the slider, an aria-hidden rail span, then an aria-hidden lane span holding the thumb span.
- Beneath the slider, aria-hidden endpoint labels “Slow” and “Fast”.

BEHAVIOR
- Hold speed in React state, unrounded, starting at 1. The displayed value is Math.round(speed × 10) / 10.
- The thumb's left style is (speed − 0.1) / 9.9 × 100%, from the unrounded speed.
- pointerdown with button 0: capture the pointer, focus the slider with preventScroll, record its clientX as the last x, and mark the slider as dragging. The thumb does not move on press.
- pointermove while a last x is recorded: dx = clientX − last x; set last x to clientX; set speed = clamp(speed × Math.exp(0.02 × dx), 0.1, 10) using a functional state update.
- pointerup, pointercancel, and lostpointercapture clear the last x and unmark dragging.
- keydown: ArrowRight and ArrowUp set speed = clamp(speed × 1.1, 0.1, 10); ArrowLeft and ArrowDown set speed = clamp(speed / 1.1, 0.1, 10). Prevent the default for those keys; ignore all others.
- Nothing animates, so there is no reduced-motion variant.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row with 20px line-height, items centered, spaced apart, 12px gap; the icon is light-dark(#8c8c80, #75756b).
- The reading paragraph is block-level with no margin, 24px top and 21px bottom padding, a 1px solid light-dark(#deded6, #34342f) bottom border, nowrap, tabular numerals, and a sans-serif stack. Its font size is clamp(25px, 2.8vw, 32px), line-height 1.3, letter-spacing -1.5px.
- Put the track group 31px below the reading. The slider is position relative, 28px tall, cursor grab (grabbing while dragging), touch-action none, 5px outline offset; its focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 2px radius.
- The rail is absolute, spanning the full width, 13px from the top, 2px high, light-dark(#c6c8ba, #4a4b43). The lane is absolute with inset 0 7px and pointer-events none.
- The thumb is absolute, top 1px, border-box 14px by 26px with margin-left -7px, 4px solid light-dark(#ffffff, #1a1a17) border, 3px radius, 1px solid light-dark(#c6c8ba, #4a4b43) outline, and light-dark(#899176, #717b5f) fill.
- Endpoint labels are a flex row spaced apart, 7px top margin, 10px sans-serif, color light-dark(#6b6b63, #9c9c91).
- At widths up to 600px, the reading uses clamp(24px, 7vw, 30px).

DONE WHEN
- Pressing the slider leaves the thumb in place; dragging moves it by a share of its own value, slowly near 0.1× and quickly near 10×.
- 50px of rightward drag from 1.0× reads 2.7×, and dragging back the same distance returns to 1.0×.
- Arrow keys scale the value by 10% per press within 0.1 to 10, and aria-valuenow matches the reading.
`;
