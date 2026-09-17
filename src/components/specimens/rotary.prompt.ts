export const rotaryPrompt = `WHAT TO BUILD
Build a portable React + TypeScript rotary phone dial named Rotary. It takes no props and is used as <Rotary />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render, in a vertical column: a heading row, a number display, a dial, and a visually hidden live region.
- The heading row shows “Phone number” on the left and a “+1” country code on the right.
- The number display is aria-hidden. It holds ten slots in three groups covering indices 0–2, 3–5, and 6–9. Each slot shows its digit when that many digits have been dialed and is empty otherwise.
- Beside it, render a visually hidden span with a useId-generated id whose text is “Nothing dialed” when no digits are held and otherwise “Dialed so far: ” followed by the formatted number. Format the number by joining each group's held digits and joining the non-empty groups with single spaces, for example “555 12”.
- The dial is a div with role="group", aria-roledescription="rotary dial", aria-label="Rotary dial", tabIndex=0, and aria-describedby pointing at that span. Set aria-disabled="true" while ten digits are held and aria-busy="true" whenever the dial is not idle; omit each attribute otherwise.
- Inside the dial, render one aria-hidden SVG (geometry below).
- The live region is a visually hidden p with role="status", aria-live="polite", and aria-atomic="true". Each registered digit sets its text to the digit followed by a period, for example “5.”. The tenth digit instead sets “Dialed ” followed by the formatted number and a period.

BEHAVIOR
- Geometry. Work in a 224-by-224 SVG space centered on (112, 112). Angles are degrees measured clockwise from twelve o'clock; the point at angle a and radius r is (112 + sin(a) × r, 112 − cos(a) × r). The angle of an offset (dx, dy) from the center is atan2(dx, −dy) in degrees, normalized into 0–360.
- Constants: STOP_ANGLE = 120, HOLE_SPACING = 30, HOLE_RING = 84, HOLE_RADIUS = 15, STOP_TOLERANCE = 5, RETURN_SPEED = 300 degrees per second, PULL_SPEED = 600 degrees per second, NUMBER_LENGTH = 10.
- Holes are ordered 1, 2, 3, 4, 5, 6, 7, 8, 9, 0. Let n be the digit, with 0 counted as 10. A digit's travel is HOLE_SPACING × (n + 1): 60 degrees for 1 and 330 for 0. Its resting angle is STOP_ANGLE − travel, normalized into 0–360, so the resting angles are 60, 30, 0, 330, 300, 270, 240, 210, 180, 150.
- State: the held digits (initially empty); the dial rotation in degrees (initially 0); a phase of idle, dragging, pulling, or returning (initially idle); and the announcement text. Mirror digits, phase, and rotation in refs so event handlers and animation frames read current values.
- Pointer down (primary button only): focus the dial without scrolling. Continue only if the phase is idle and fewer than ten digits are held. Convert the pointer to SVG space as ((clientX − rect.left) / rect.width × 224, (clientY − rect.top) / rect.height × 224). Find the digit whose resting hole center lies within HOLE_RADIUS of that point; if none, do nothing. Otherwise capture the pointer, remember the digit, record the pointer's angle, and enter dragging.
- Pointer move while dragging: take the pointer's new angle and its difference from the recorded angle. If the difference is greater than 180, subtract 360; if it is −180 or less, add 360. Record the new angle. Set rotation to the previous rotation plus the difference, clamped between 0 and the grabbed digit's travel. Anticlockwise movement therefore cannot take the dial below rest, and clockwise movement cannot take it past the stop.
- Pointer up, pointer cancel, or lost pointer capture while dragging: forget the grabbed digit. The release counts only when rotation ≥ travel − STOP_TOLERANCE. Wind the dial home, carrying the digit if the release counted and nothing otherwise. Ignore these events in any other phase, so a second release event does nothing.
- Winding home: finishing sets rotation to 0, enters idle, and, if a digit was carried, registers it. If rotation is already 0 or prefers-reduced-motion: reduce matches (read at that moment), finish immediately. Otherwise enter returning and, on each animation frame, set rotation to max(0, start rotation − RETURN_SPEED × elapsed milliseconds / 1000); finish on the frame where it reaches 0. A 0 therefore returns in 1.1 seconds, and a 1 in 0.2 seconds.
- Registering appends the digit if fewer than ten are held and sets the announcement. The dial takes no input while dragging, pulling, or returning, or once ten digits are held.
- Keyboard: when the dial has focus and a key 0–9 is pressed, prevent default. If the dial is idle and fewer than ten digits are held, dial that digit. Under reduced motion, set rotation to the digit's travel and wind home at once. Otherwise enter pulling and, on each animation frame, set rotation to min(travel, PULL_SPEED × elapsed milliseconds / 1000); on the frame it reaches travel, wind home carrying the digit. Other keys are not handled.
- There is no way to remove or clear digits.
- Cancel any pending animation frame on unmount.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 320px, centered with auto margins, color light-dark(#282824, #e8e7e0), and a vertical flex column aligned center with a 12px gap.
- The heading row stretches to full width, is a flex row with space-between and a 12px gap, 12px type, and 20px line-height. The country code is 12px sans-serif in light-dark(#6b6b63, #9c9c91).
- The number display is a centered flex row with a 14px gap, in 22px sans-serif type with 30px line-height and tabular numerals. Each group is a flex row with a 4px gap. Each slot is 15px wide and 31px tall, center-aligned, with a 1px solid light-dark(#a9aa9f, #62635a) bottom border.
- The dial is 200px square, radius 50%, touch-action none, user-select none, and has no outline except on focus-visible: 2px solid light-dark(#667251, #8e9c78) at a 7px offset. The SVG is display block and fills the dial. The dial's cursor is the default except as below.
- SVG, drawn in this order:
  1. A base circle, center (112, 112), radius 111, fill light-dark(#ffffff, #1a1a17), 1px stroke light-dark(#c6c8ba, #4a4b43).
  2. For each digit, a text element at its resting hole center showing the digit. Use fill light-dark(#45453f, #c3c3b9), 14px sans-serif, text-anchor middle, and dominant-baseline central.
  3. A group transformed by rotate(rotation, 112, 112) holding the finger plate, its edge, and the holes. The plate is a circle of radius 108 with fill light-dark(#ffffff, #1a1a17) and no stroke, masked by a mask with a unique sanitized id. The mask holds a white circle of radius 108, a black circle of radius 60 at the center, and a black circle of radius 15 at each resting hole center. After the plate, draw an unmasked edge circle of radius 108, then a circle of radius 15 at each resting hole center with cursor grab.
  4. A fixed center card of radius 60, so each hole center (radius 84) is 24 from both the card and the plate edge (radius 108).
  5. A fixed finger stop: a line at angle 131 from radius 90 to radius 108, stroke light-dark(#899176, #717b5f), stroke-width 3, round linecap.
- The plate edge, holes, and center card are outlines only: fill transparent and a 1px light-dark(#c6c8ba, #4a4b43) stroke.
- While dragging, the dial and its holes use cursor grabbing.

DONE WHEN
- Dragging a hole clockwise stops at the finger stop; releasing within five degrees of the stop registers that digit only after the dial has returned to rest at 300 degrees per second.
- Releasing short of the stop, pressing outside a hole, or acting while the dial is moving or ten digits are held registers nothing.
- Keys 0–9 on the focused dial pull and return it the same way, and reduced motion returns it instantly.
- Each registered digit is announced, and nothing can remove a held digit.
- The number display, plate, holes, digits, center card, stop, and focus treatment match the specification.
`;
