import { BTC_CLOSES } from "./btc-closes";

export const brightnessPrompt = `What to build
Build a portable React + TypeScript component named Brightness. It takes no props and is used as <Brightness />. It is a brightness control drawn as a coordinate graph of the daily closing price of BTC/USD from 15 September 2025 to 14 September 2026, joined by a smooth curve. A tangent line is drawn at the selected point, and brightness is derived from the tangent’s slope.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

Markup and semantics
- Render one focusable horizontal div with role="slider", aria-label="Brightness", aria-valuemin=0, aria-valuemax=100, aria-valuenow equal to the brightness, and aria-valuetext in the form “slope on 14 Mar 2026, brightness 63”.
- Inside the slider, render an aria-hidden SVG with a 294 by 220 viewBox containing, in order: two faint dashed grid lines (horizontal at y=114 from 8 to 286; vertical at x=147 from 16 to 212), the x axis (8,212 to 293,212), the y axis (8,212 to 8,12), the brightness value as text at (286,42), the curve, dotted guides from the selected point straight down to the x axis and straight left to the y axis, the tangent line, a selected circular point of radius 5.5, and the axis labels “x” at (290,206) and “y” at (4,10). There are no price or date labels.

Behavior
- The data is 365 daily closes in whole US dollars, one per UTC day, day 0 being 15 September 2025 and day 364 being 14 September 2026. Use exactly this array, P:
[${BTC_CLOSES.join(", ")}]
- x is a position in days. Start with x=180. Store x rounded to two decimal places and clamped from 0 to 364.
- The tangent at whole day i is m(i) = P[1] − P[0] for i=0, P[364] − P[363] for i=364, and (P[i+1] − P[i−1]) / 2 otherwise.
- For any x, let i = min(363, floor(x)) and t = x − i. The price is (2t³ − 3t² + 1)·P[i] + (t³ − 2t² + t)·m(i) + (−2t³ + 3t²)·P[i+1] + (t³ − t²)·m(i+1). The slope, in dollars per day, is (6t² − 6t)·P[i] + (3t² − 4t + 1)·m(i) + (−6t² + 6t)·P[i+1] + (3t² − 2t)·m(i+1).
- Brightness = Math.round(min(100, max(0, 50 + 10 · (100 · slope / price)))). At x=180 this is 63.
- The date shown is the UTC date of day floor(x), formatted as day of month without padding, a three-letter English month (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec), and the four-digit year, separated by single spaces.
- Map the plot so day 0 is at SVG x 8 and day 364 at 286 (278/364 units per day), and $50,000 is at SVG y 212 and $130,000 at 16 (196/80,000 units per dollar). Build the curve path from 1,457 samples, x=0 through 364 in increments of 0.25.
- Draw the tangent as a segment centred on the selected point with a fixed total length of 60 SVG units. Its direction is the vector (278/364, −slope·196/80,000), normalised.
- On primary pointer down, capture the pointer, focus the slider without scrolling, and set x from the pointer: take the pointer’s horizontal share of the slider’s bounding width, multiply by 294, subtract 8, and divide by 278/364. While that pointer remains captured, pointer movement updates x the same way.
- Arrow Right and Arrow Up add 1; Arrow Left and Arrow Down subtract 1. Holding Shift changes each arrow increment to 30. Home selects 0 and End selects 364. Prevent default for every handled key. Nothing animates.

Styling
- Set the specimen to width 100%, max-width 310px, centered, with text color light-dark(#282824, #e8e7e0).
- The graph is the specimen’s only content. It spans the specimen width, uses a crosshair cursor and touch-action:none, and has a 2px light-dark(#667251, #8e9c78) focus-visible outline with 5px offset and 2px radius. The SVG is display block, width 100%, height auto, overflow visible.
- Draw axes 1.25px in light-dark(#c6c8ba, #4a4b43) and the curve 1.5px with no fill in the main foreground. Grid lines are 1px light-dark(#deded6, #34342f) with a 2 4 dash pattern. Point guides are 1px light-dark(#54614a, #b6c2a2) at 45% opacity with a 3 3 dash pattern. The tangent is a solid 1.5px light-dark(#54614a, #b6c2a2) line with round caps. The point is filled light-dark(#899176, #717b5f) with a 3px stroke matching the page field, light-dark(#ffffff, #1a1a17).
- Graph labels are 10px muted light-dark(#6b6b63, #9c9c91) monospace text, centred with text-anchor middle.
- The brightness value is 30px, weight 650, -1.5px letter-spacing, tabular monospace text in the main foreground, right-aligned with text-anchor end.

Done when
- The initial point sits on the curve at 14 Mar 2026, the tangent touches it there, and 63 is drawn in the top right of the plot.
- The curve passes exactly through every daily close.
- Moving the pointer horizontally moves the point along the curve, swings the tangent, and updates the brightness from the slope.
- Every brightness from 0 to 100 is produced by some x in hundredth-of-a-day steps.
- Keyboard controls, role, name, minimum, maximum, current value, and descriptive value text all work.
`;
