export const uploadProgressPrompt = `WHAT TO BUILD
Build a portable React + TypeScript file upload readout named UploadProgress. It takes no props and is used as <UploadProgress />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render one bordered card. At the top, a row with the file name “report-final.pdf” on the left and “4.2 MB” on the right.
- Below it, a large aria-hidden paragraph showing the percentage with one decimal and a percent sign, e.g. “0.0%”.
- Below that, a track div with role="progressbar", aria-label="Upload progress", aria-valuemin 0, aria-valuemax 100, aria-valuenow equal to the displayed percentage, and aria-valuetext equal to the same one-decimal text with a percent sign. Inside it, a fill div.
- At the bottom, a row with a paragraph carrying role="status" on the left and a single type="button" on the right.
- While idle the status reads “Ready to upload” and the button reads “Upload”. While uploading the status reads “About N seconds remaining” and the button reads “Cancel”. It is the same button element in both states, so focus is preserved.

BEHAVIOR
- State is remaining: the distance left to 100, or null while idle. Upload sets remaining to 100. Cancel sets it to null, returning the display to 0.0%.
- While remaining is not null and is at least 0.1, schedule a 250ms timeout that sets remaining to remaining * 0.9. Re-schedule after each change and clear the timeout on change or unmount. Once remaining drops below 0.1, stop scheduling; the upload stays in the uploading state indefinitely.
- Displayed percentage = Math.min(Math.floor((100 - remaining) * 10 + 1e-9) / 10, 99.9). While idle it is 0. It never displays 100.
- Seconds remaining is computed from the current rate: perSecond = (remaining * 0.1) / 0.25; seconds = Math.ceil(remaining / perSecond - 1e-9). This always evaluates to 3.
- The fill is drawn with transform scaleX(percent / 100) from its left edge.

STYLING
- The card is width 100%, max-width 320px, centered, color #282824, 1px solid #deded6 border, 6px radius, white background, padding 18px 18px 16px.
- The file row is a baseline-aligned flex row, space-between, 12px gap, 13px type; the name is weight 500 and wraps anywhere. The size and the status are 11px #6b6b63 with no margin.
- The percentage has margin 18px 0 8px, monospace 34px, line-height 1.1, letter-spacing -1.5px, tabular numerals.
- The track is 6px tall, overflow hidden, fully rounded, background #ecece4. The fill is full height, inherits the radius, background #54614a, transform-origin left center, with a 250ms linear transform transition.
- The bottom row is a centered flex row, space-between, 12px gap, 16px top margin.
- The button has min-height 39px, padding 8px 15px, 1px border, 5px radius, 12px weight 500 type, pointer cursor, and 150ms ease transitions on background and border color. As Upload it is #30312b with #fafaf6 text and a transparent border (hover #4d5142). As Cancel it is white with #464640 text and a #ddddd5 border (hover border #bdbeb1, background #f5f5ef). Focus-visible outline is 2px solid #667251 at 3px offset.
- Under prefers-reduced-motion: reduce, remove the fill and button transitions.

DONE WHEN
- After Upload the readout climbs 10.0, 19.0, 27.1… every 250ms, slows, and holds at 99.9% without reaching 100.
- The estimate reads “About 3 seconds remaining” throughout, Cancel returns to 0.0% and “Ready to upload”, and the progressbar attributes track the display.
`;
