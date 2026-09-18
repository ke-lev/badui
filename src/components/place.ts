import type { CategoryId, LibrarySection } from "./library";

/** Where the library is open: one shelf, and at most one entry on it. */
export type Place = {
  category: CategoryId;
  entryId: string | null;
};

/** The route the collection is served at, and the base of every place href. */
export const COLLECTION_PATH = "/collection";

const CATEGORY_PARAM = "category";
const ENTRY_PARAM = "entry";

/**
 * Reads a place out of a query string, falling back rather than failing.
 *
 * Entry ids are unique across the library, so `?entry=` names its shelf on its
 * own and is preferred over any `?category=` sitting beside it. An id that
 * matches nothing is dropped, which leaves the named category, then the
 * opening one.
 */
export function parsePlace(search: string, sections: LibrarySection[], opening: CategoryId): Place {
  const params = new URLSearchParams(search);
  const wanted = params.get(ENTRY_PARAM);
  if (wanted) {
    const shelf = sections.find((candidate) => candidate.entries.some((entry) => entry.id === wanted));
    if (shelf) return { category: shelf.id, entryId: wanted };
  }
  const named = params.get(CATEGORY_PARAM);
  const shelf = sections.find((candidate) => candidate.id === named);
  return { category: shelf ? shelf.id : opening, entryId: null };
}

/** The query string a place is addressed by. The opening shelf carries none. */
export function placeSearch(place: Place, opening: CategoryId): string {
  if (place.entryId) return `?${new URLSearchParams({ [ENTRY_PARAM]: place.entryId })}`;
  if (place.category === opening) return "";
  return `?${new URLSearchParams({ [CATEGORY_PARAM]: place.category })}`;
}

/** The href a rail link carries, for the address bar and for copying. */
export function placeHref(place: Place, opening: CategoryId): string {
  return `${COLLECTION_PATH}${placeSearch(place, opening)}`;
}

/** The parts of a click that say the browser was asked to open a link itself. */
export type ClickModifiers = {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  button: number;
};

/**
 * Whether a click on a rail link should be left to the browser.
 *
 * A held modifier or any button but the primary one is a request for a new tab,
 * a new window, or a download, and the rail has no business intercepting it.
 */
export function opensElsewhere(click: ClickModifiers): boolean {
  return click.metaKey || click.ctrlKey || click.shiftKey || click.altKey || click.button !== 0;
}

/** Whether two places address the same pane. */
export function samePlace(a: Place, b: Place): boolean {
  return a.category === b.category && a.entryId === b.entryId;
}
