export const breadcrumbsPrompt = `WHAT TO BUILD
Build a portable React + TypeScript folder browser with a breadcrumb trail, named Breadcrumbs. It takes no props and is used as <Breadcrumbs />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a nav with aria-label="Breadcrumb" containing an ordered list of crumbs. Between crumbs, inside each list item after the first, place an aria-hidden “/” separator before the crumb.
- The last crumb is the current folder: a span with aria-current="page", not a button. Every other visible crumb is a type="button" with the folder name.
- When the middle of the trail is folded, a type="button" showing “…” stands in for the hidden crumbs, with aria-label “Show N hidden folders” (N = path length - 3) and aria-expanded="false".
- Below the nav, a heading row: a paragraph with the current folder's name and tabIndex -1 (the focus target), and a caption reading “1 folder” or “N folders” for the number of subfolders.
- Below that, a list with aria-label “Folders in NAME” of type="button" elements, one per subfolder, each with an aria-hidden folder icon (16px outline SVG, stroke 1.2) and the folder name. If there are no subfolders, show a paragraph “This folder is empty.” in a container of the same minimum height instead.

BEHAVIOR
- The folder tree, below a root named Home, is: Documents (Invoices (2025, 2026), Letters (Drafts, Sent)); Photos (2025 (Spring, Autumn), 2026 (Summer (Coast, City), Winter)); Music (empty). Subfolders are listed in that order.
- State: the path as an array of names starting with Home, initially Home, Photos, 2026, Summer, Coast; and an expanded flag, initially false.
- Visible crumbs: if expanded is true or the path has 4 or fewer names, show every crumb. Otherwise show the first crumb, the “…” button, and the last two crumbs.
- Clicking a crumb button sets the path to everything up to and including that crumb. Clicking a subfolder appends it to the path. Both reset expanded to false and then move focus to the folder title paragraph.
- Clicking “…” sets expanded to true and then moves focus to the crumb button at index 1 (the first crumb it revealed).
- Perform focus moves in an effect after the state change, and only when triggered by one of these actions — never on first render.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 330px, centered, color light-dark(#282824, #e8e7e0).
- The crumb list is a wrapping flex row, centered, 2px gap, no margin, padding, or bullets, 12px type. Each item is an inline flex row with 2px gap. The separator is light-dark(#a9aa9f, #62635a) with 0 2px padding.
- Crumb buttons: min-height 30px, padding 4px 6px, no border, 4px radius, transparent background, color light-dark(#54614a, #b6c2a2), inherited font, underline in light-dark(#c6c8ba, #4a4b43) with 3px underline offset, pointer cursor. Hover uses background light-dark(#f1f1ea, #262622) and a currentColor underline. The current crumb is padding 4px 6px, weight 500.
- The heading row is a baseline-aligned flex row, space-between, 12px gap, 14px top margin, padding 0 2px 10px, 1px solid light-dark(#deded6, #34342f) bottom border. The title is 19px, weight 500, letter-spacing -0.5px, no margin, 3px radius. The caption is 11px light-dark(#6b6b63, #9c9c91) with no margin.
- The folder list is a grid with align-content start, 4px gap, min-height 132px, 10px top margin, no padding or bullets. Folder buttons are full-width flex rows, 10px gap, min-height 40px, padding 6px 12px, 1px solid light-dark(#deded6, #34342f) border, 5px radius, light-dark(#ffffff, #1a1a17) background, 13px left-aligned text, pointer cursor, 140ms ease transitions on background and border; hover uses border light-dark(#a9aa9f, #62635a) and background light-dark(#f7f7f2, #20201d). The icon is light-dark(#7a8565, #97a37f). The empty message is 12px light-dark(#6b6b63, #9c9c91) with 12px 2px padding.
- Buttons and the title use a 2px solid light-dark(#667251, #8e9c78) focus-visible outline at 2px offset. Remove transitions under prefers-reduced-motion: reduce.

DONE WHEN
- The trail folds past four crumbs, unfolds on “…”, and every crumb and subfolder navigates to the right folder.
- The current folder is aria-current="page" text, focus lands on the title after navigation and on the first revealed crumb after unfolding, and the empty state shows for folders without children.
`;
