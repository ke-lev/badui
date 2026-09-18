"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { buildLibrary, formatRange, type CategoryId, type LibraryEntry } from "@/components/library";
import { entries } from "@/components/entries";
import { ENTRY_LINES } from "@/components/entry-lines";
import { registerEntryLines } from "@/components/sidekick/lines";
import { copyText } from "@/components/copy-text";
import { opensElsewhere, parsePlace, placeHref, samePlace, type Place } from "@/components/place";
import type { EntrySwitch, SwitchState } from "@/components/meta";

const sections = buildLibrary(entries);
// The cursor companion lives in the root layout, which every page loads. It is
// given the entry lines from here, where the registry is already in hand.
registerEntryLines(ENTRY_LINES);
const OPENING_CATEGORY: CategoryId = "buttons";
const NO_SWITCHES: SwitchState = {};
const SCROLL_KEY = "badui:collection-scroll";
// Pushing and replacing an address fires no `popstate`, so the rail says so
// itself and the store below listens for both.
const PLACE_EVENT = "badui:place";

type SavedScroll = { href: string; scrollY: number };

// The offset is restored at most once per document, so arriving here later by
// client navigation (from the splash, say) still opens at the top.
let scrollConsumed = false;

/**
 * The offset saved before this document reloaded at the address it is at now.
 *
 * The place itself is in the address bar, so a reload restores it without any
 * help; only the scroll position needs carrying, and only when the reload
 * landed back on the same place.
 */
function takeReloadedScroll(): number | null {
  if (scrollConsumed) return null;
  scrollConsumed = true;
  try {
    const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navigation?.type !== "reload") return null;
    const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "null") as SavedScroll | null;
    if (!saved || saved.href !== window.location.pathname + window.location.search) return null;
    return saved.scrollY;
  } catch {
    return null;
  }
}

/** Watches the address for a change from either the rail or Back and Forward. */
function subscribeToPlace(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(PLACE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(PLACE_EVENT, onChange);
  };
}

function readSearch() {
  return window.location.search;
}

// The route is prerendered without a query string, so the opening shelf is
// what the server and the hydrating client agree on. The address is read on
// the render straight after, which is where a shared link takes effect.
function readPrerenderedSearch() {
  return "";
}


function ResetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 7.5a6.25 6.25 0 1 1-.1 4.5M4 3.5v4.25h4.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Twisty() {
  return (
    <svg className="rail-twisty" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="m4.5 2.5 4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Burger() {
  return (
    <span className="rail-burger" aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

function CopyPromptIcon({ copied }: { copied: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {copied ? (
        <path
          d="m4.5 10.5 3.25 3.25L15.5 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <rect x="6.25" y="6.25" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
          <path d="M13.25 6.25V5.5a1.75 1.75 0 0 0-1.75-1.75h-7A1.75 1.75 0 0 0 2.75 5.5v7a1.75 1.75 0 0 0 1.75 1.75h.75" stroke="currentColor" strokeWidth="1.35" />
        </>
      )}
    </svg>
  );
}

export function Collection() {
  // The address bar holds the place, so a link opens one and Back and Forward
  // walk them. Everything below it — resets, switches, the folded rail — is
  // this session's own and stays in React state.
  const search = useSyncExternalStore(subscribeToPlace, readSearch, readPrerenderedSearch);
  const place = parsePlace(search, sections, OPENING_CATEGORY);
  const { category, entryId } = place;
  // Which shelf was folded shut by hand. The rail only ever shows the entries
  // of the shelf the pane sits on, so folding is remembered against that shelf
  // and forgotten as soon as the pane moves to another one.
  const [foldedShelf, setFoldedShelf] = useState<CategoryId | null>(null);
  const openCategory = foldedShelf === category ? null : category;
  const [versions, setVersions] = useState<Record<string, number>>({});
  // Held here rather than in the entry so the switches can sit outside its
  // card. A reset remounts the entry and leaves its switches as they are.
  const [switches, setSwitches] = useState<Record<string, SwitchState>>({});
  const [announcement, setAnnouncement] = useState({ text: "", sequence: 0 });
  // The rail folds behind a toggle on narrow viewports; on wide ones the
  // toggle is hidden and the list always shows, so this has no effect there.
  const [menuOpen, setMenuOpen] = useState(false);
  const railRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const paneRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Counts rail selections, so the pane heading is never focused on first
  // paint and a repeated selection still moves focus. StrictMode's second
  // effect pass focuses the same heading again, which changes nothing.
  const [selection, setSelection] = useState(0);

  const section = sections.find((candidate) => candidate.id === category)!;
  const entry = entryId ? section.entries.find((candidate) => candidate.id === entryId) : undefined;

  // Read before the save effect below first writes this document's own over it.
  useLayoutEffect(() => {
    const scrollY = takeReloadedScroll();
    if (scrollY === null) return;
    // Not cancelled on cleanup: the offset is taken once per document, and
    // StrictMode's remount keeps this state, so the scroll still lands. Two
    // frames on, the restored pane is laid out and tall enough to take it.
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, scrollY)));
  }, []);

  useEffect(() => {
    function save() {
      try {
        const saved: SavedScroll = {
          href: window.location.pathname + window.location.search,
          scrollY: window.scrollY,
        };
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify(saved));
      } catch {
        // Storage unavailable: a reload opens the same place at the top.
      }
    }
    save();
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, [search]);

  // Keyed on the selection rather than on the pane, because choosing the entry
  // already on show closes the menu covering it without changing either.
  useEffect(() => {
    if (!selection) return;
    titleRef.current?.focus();
  }, [selection]);

  // An address naming nothing this library holds, or naming the shelf it opens
  // on anyway, is rewritten once to the address this place is reached by, so
  // Back cannot return to a state the rail has no way to show. Only the
  // address this document was opened at: the rail writes its own in this form.
  useEffect(() => {
    const opened = window.location.pathname + window.location.search;
    const href = placeHref(parsePlace(window.location.search, sections, OPENING_CATEGORY), OPENING_CATEGORY);
    if (href !== opened) window.history.replaceState(null, "", href);
  }, []);

  // Back and Forward move the pane, so they move focus the way the rail does.
  useEffect(() => {
    function onPop() {
      setSelection((count) => count + 1);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);


  useEffect(() => {
    if (entryId) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((observed) => {
      for (const item of observed) {
        if (item.isIntersecting) {
          item.target.classList.add("is-visible");
          observer.unobserve(item.target);
        }
      }
    }, { threshold: 0.08 });
    paneRef.current?.querySelectorAll(".specimen").forEach((card) => {
      if (card.getBoundingClientRect().top > window.innerHeight) card.classList.add("reveal-ready");
      observer.observe(card);
    });
    return () => observer.disconnect();
  }, [category, entryId]);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!railRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  function announce(text: string) {
    setAnnouncement((current) => ({ text, sequence: current.sequence + 1 }));
  }

  /**
   * Moves the library to a place and writes that place to the address bar.
   *
   * Choosing the pane already on show is still a selection — it closes the
   * menu covering it and moves focus — but it is the same address, so it
   * replaces the current history entry rather than stacking another on top.
   */
  function go(next: Place) {
    setSelection((count) => count + 1);
    const href = placeHref(next, OPENING_CATEGORY);
    if (samePlace(next, place)) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
    window.dispatchEvent(new Event(PLACE_EVENT));
  }

  function openCategoryPane(id: CategoryId) {
    const onShow = category === id && !entryId;
    // Collapse only when the shelf being clicked is the one already on show;
    // arriving from one of its entries should leave the list open.
    const collapsing = openCategory === id && onShow;
    // Inside the open menu, the shelf already on show only folds or unfolds.
    // The pane is unchanged, so the menu stays open and focus stays put.
    if (onShow && menuOpen) {
      setFoldedShelf(collapsing ? id : null);
      return;
    }
    setFoldedShelf(collapsing ? id : null);
    setMenuOpen(false);
    go({ category: id, entryId: null });
  }

  function openEntry(id: CategoryId, item: string) {
    setFoldedShelf(null);
    setMenuOpen(false);
    go({ category: id, entryId: item });
  }

  function toggleSwitch(id: string, key: string) {
    setSwitches((current) => ({
      ...current,
      [id]: { ...current[id], [key]: !current[id]?.[key] },
    }));
  }

  function resetEntry(id: string, name: string) {
    setVersions((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    announce(`${name} reset.`);
  }

  function resetSection() {
    setVersions((current) => {
      const next = { ...current };
      for (const item of section.entries) next[item.id] = (next[item.id] ?? 0) + 1;
      return next;
    });
    announce(`${section.label} reset.`);
  }

  return (
    <div className="library">
      <nav
        className={`library-rail${menuOpen ? " is-open" : ""}`}
        aria-label="Library"
        ref={railRef}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !menuOpen) return;
          setMenuOpen(false);
          toggleRef.current?.focus();
        }}
        onBlur={(event) => {
          // A null relatedTarget is a pointer press on something unfocusable,
          // which the document listener already judges inside or out.
          const next = event.relatedTarget;
          if (next && !event.currentTarget.contains(next)) setMenuOpen(false);
        }}
      >
        <button
          type="button"
          className="rail-toggle"
          data-sidekick="rail-toggle"
          aria-expanded={menuOpen}
          aria-controls="library-menu"
          ref={toggleRef}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Burger />
          <span className="rail-toggle-label">Library</span>
          <span className="rail-toggle-current">{entry ? entry.meta.name : section.label}</span>
        </button>
        <ul className="rail-list" id="library-menu">
          {sections.map((shelf) => {
            const isOpen = openCategory === shelf.id && shelf.entries.length > 0;
            return (
              <li key={shelf.id}>
                <a
                  className="rail-category"
                  data-sidekick="rail-category"
                  href={placeHref({ category: shelf.id, entryId: null }, OPENING_CATEGORY)}
                  aria-expanded={shelf.entries.length > 0 ? isOpen : undefined}
                  aria-controls={shelf.entries.length > 0 ? `rail-shelf-${shelf.id}` : undefined}
                  aria-current={category === shelf.id && !entryId ? "true" : undefined}
                  onClick={(event) => {
                    if (opensElsewhere(event)) return;
                    event.preventDefault();
                    openCategoryPane(shelf.id);
                  }}
                >
                  <Twisty />
                  <span className="rail-label">{shelf.label}</span>
                  {shelf.entries.length > 0 && (
                    <span className="rail-count">{String(shelf.entries.length).padStart(2, "0")}</span>
                  )}
                </a>
                {/* Kept mounted so the shelf can fold both ways; inert while
                    closed keeps its entries out of focus order and the tree. */}
                {shelf.entries.length > 0 && (
                  <div
                    className="rail-drawer"
                    id={`rail-shelf-${shelf.id}`}
                    data-open={isOpen}
                    inert={!isOpen}
                  >
                    <div className="rail-drawer-inner">
                      <RailEntries
                        entries={shelf.entries}
                        currentId={entryId}
                        onOpen={(item) => openEntry(shelf.id, item)}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <section
        className="collection"
        id="collection"
        aria-labelledby="pane-title"
        tabIndex={-1}
        ref={paneRef}
      >
        {entry ? (
          <EntryPane
            entry={entry}
            index={section.entries.indexOf(entry) + 1}
            titleRef={titleRef}
            version={versions[entry.id] ?? 0}
            onReset={() => resetEntry(entry.id, entry.meta.name)}
            switches={switches[entry.id] ?? NO_SWITCHES}
            onToggle={(key) => toggleSwitch(entry.id, key)}
            onAnnounce={announce}
          />
        ) : (
          <>
            <div className="collection-toolbar">
              <div className="collection-heading">
                <h1 id="pane-title" tabIndex={-1} ref={titleRef}>{section.label}</h1>
                <span className="collection-count">{formatRange(section.entries.length)}</span>
              </div>
              {section.entries.length > 0 && (
                <button className="reset-all" type="button" data-sidekick="reset" onClick={resetSection}>
                  <ResetIcon /> Reset all
                </button>
              )}
            </div>
            {section.entries.length === 0 ? (
              <p className="library-empty">Nothing filed here yet.</p>
            ) : (
              <div className="specimen-grid">
                {section.entries.map((item, index) => {
                  const Specimen = item.component;
                  return (
                    <article
                      className={`specimen specimen-${index + 1}`}
                      id={item.id}
                      key={item.id}
                      aria-labelledby={`${item.id}-title`}
                      data-sidekick-off={item.meta.sidekick === false ? "" : undefined}
                    >
                      <div className="specimen-caption">
                        <span className="specimen-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <h2 id={`${item.id}-title`}>
                          <button type="button" className="specimen-open" data-sidekick="open-entry" onClick={() => openEntry(section.id, item.id)}>
                            {item.meta.name}
                          </button>
                        </h2>
                        <button
                          className="specimen-reset"
                          type="button"
                          data-sidekick="reset"
                          onClick={() => resetEntry(item.id, item.meta.name)}
                          aria-label={`Reset ${item.meta.name.toLowerCase()}`}
                          title={`Reset ${item.meta.name.toLowerCase()}`}
                        >
                          <ResetIcon />
                        </button>
                      </div>
                      <div className="specimen-stage" role="group" aria-label={`${item.meta.name} specimen`}>
                        <Specimen key={versions[item.id] ?? 0} switches={switches[item.id] ?? NO_SWITCHES} />
                      </div>
                      {item.meta.switches && (
                        <EntrySwitches
                          name={item.meta.name}
                          options={item.meta.switches}
                          state={switches[item.id] ?? NO_SWITCHES}
                          onToggle={(key) => toggleSwitch(item.id, key)}
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          <span key={announcement.sequence}>{announcement.text}</span>
        </p>
      </section>
    </div>
  );
}

/**
 * Places the current-entry bar on the list's tree line. A move from one entry
 * to another travels; anything else (first appearance, a resize, the list
 * coming back into view from a closed menu) lands in place without travelling.
 */
function placeMarker(list: HTMLUListElement, lastTop: RefObject<number | null>, travel: boolean) {
  // Hidden inside the closed mobile menu: nothing to measure. The resize
  // observer places the bar once the list is shown again.
  if (list.getClientRects().length === 0) return;
  const current = list.querySelector<HTMLElement>("[aria-current]");
  if (!current) {
    delete list.dataset.marker;
    return;
  }
  const top = current.offsetTop;
  const bottom = list.clientHeight - top - current.offsetHeight;
  const previous = lastTop.current;
  const moving = travel && list.dataset.marker === "shown" && previous !== null && top !== previous;
  list.dataset.markerTravel = moving ? (top > previous ? "down" : "up") : "none";
  list.style.setProperty("--marker-top", `${top}px`);
  list.style.setProperty("--marker-bottom", `${bottom}px`);
  // Commit a jump before the bar is shown, so it grows in where it lands.
  if (!moving) void list.offsetHeight;
  list.dataset.marker = "shown";
  lastTop.current = top;
}

function RailEntries({
  entries,
  currentId,
  onOpen,
}: {
  entries: LibraryEntry[];
  currentId: string | null;
  onOpen: (id: string) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const lastTop = useRef<number | null>(null);

  useLayoutEffect(() => {
    placeMarker(listRef.current!, lastTop, true);
  }, [currentId]);

  useEffect(() => {
    const list = listRef.current!;
    const observer = new ResizeObserver(() => placeMarker(list, lastTop, false));
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  return (
    <ul className="rail-entries" ref={listRef}>
      {entries.map((item) => (
        <li key={item.id}>
          <a
            className="rail-entry"
            data-sidekick="rail-entry"
            href={placeHref({ category: item.meta.category, entryId: item.id }, OPENING_CATEGORY)}
            aria-current={currentId === item.id ? "true" : undefined}
            onClick={(event) => {
              if (opensElsewhere(event)) return;
              event.preventDefault();
              onOpen(item.id);
            }}
          >
            {item.meta.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

function EntryPane({
  entry,
  index,
  titleRef,
  version,
  onReset,
  switches,
  onToggle,
  onAnnounce,
}: {
  entry: LibraryEntry;
  index: number;
  titleRef: RefObject<HTMLHeadingElement | null>;
  version: number;
  onReset: () => void;
  switches: SwitchState;
  onToggle: (key: string) => void;
  onAnnounce: (text: string) => void;
}) {
  const Specimen = entry.component;
  const promptTitleId = `${entry.id}-prompt-title`;
  // The pane is reused as the selection changes, so the mark is held against
  // the entry it was earned by rather than as a bare flag. `sequence` makes
  // each success a new object, which restarts the pause below.
  const [copiedPrompt, setCopiedPrompt] = useState<{ entryId: string; sequence: number } | null>(null);
  // Counts copies so a slower earlier one that lands after a newer one is
  // dropped instead of reporting over it.
  const copyCount = useRef(0);
  const copied = copiedPrompt?.entryId === entry.id;

  useEffect(() => {
    if (!copiedPrompt) return;
    const timer = window.setTimeout(() => setCopiedPrompt(null), 1_600);
    return () => window.clearTimeout(timer);
  }, [copiedPrompt]);

  async function copyPrompt() {
    const request = (copyCount.current += 1);
    const entryId = entry.id;
    const done = await copyText(entry.meta.prompt);
    if (request !== copyCount.current) return;
    setCopiedPrompt(done ? { entryId, sequence: request } : null);
    onAnnounce(
      done
        ? "Prompt copied."
        : "Prompt could not be copied. Select it and copy it manually.",
    );
  }

  return (
    <article className="entry" aria-labelledby="pane-title">
      <div className="collection-toolbar">
        <div className="collection-heading">
          <span className="specimen-number" aria-hidden="true">{String(index).padStart(2, "0")}</span>
          <h1 id="pane-title" tabIndex={-1} ref={titleRef}>{entry.meta.name}</h1>
        </div>
        <button
          className="reset-all"
          type="button"
          data-sidekick="reset"
          onClick={onReset}
        >
          <ResetIcon /> Reset
        </button>
      </div>
      <div
        className="specimen-stage entry-stage"
        role="group"
        aria-label={`${entry.meta.name} specimen`}
        data-sidekick-off={entry.meta.sidekick === false ? "" : undefined}
      >
        <Specimen key={version} switches={switches} />
      </div>
      {entry.meta.switches && (
        <EntrySwitches
          name={entry.meta.name}
          options={entry.meta.switches}
          state={switches}
          onToggle={onToggle}
        />
      )}
      <div className="entry-docs">
        <div className="entry-description">
          <p className="entry-summary">{entry.meta.summary}</p>
          <dl className="entry-facts">
            <dt>Usage</dt>
            <dd><code>{entry.meta.usage}</code></dd>
            {entry.meta.notes && (
              <>
                <dt>Notes</dt>
                <dd>{entry.meta.notes}</dd>
              </>
            )}
          </dl>
        </div>
        <section className="prompt-card" aria-labelledby={promptTitleId}>
          <div className="prompt-card-heading">
            <h2 id={promptTitleId}>Agent Prompt</h2>
            <button
              type="button"
              className="copy-prompt"
              data-sidekick="copy-prompt"
              data-copied={copied || undefined}
              aria-label="Copy agent prompt"
              title={copied ? "Copied" : "Copy agent prompt"}
              onClick={copyPrompt}
            >
              <CopyPromptIcon copied={copied} />
            </button>
          </div>
          <pre className="prompt-text" tabIndex={0} aria-labelledby={promptTitleId}>
            <code>{entry.meta.prompt}</code>
          </pre>
        </section>
      </div>
    </article>
  );
}

/** An entry's switches, drawn by the frame beneath its card. */
function EntrySwitches({
  name,
  options,
  state,
  onToggle,
}: {
  name: string;
  options: EntrySwitch[];
  state: SwitchState;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="entry-switches" role="group" aria-label={`${name} options`}>
      {options.map((option) => (
        <Switch
          key={option.key}
          option={option}
          checked={state[option.key] === true}
          onToggle={() => onToggle(option.key)}
        />
      ))}
    </div>
  );
}

/** A two-sided switch, checked on its right-hand option and named by it. */
function Switch({
  option,
  checked,
  onToggle,
}: {
  option: EntrySwitch;
  checked: boolean;
  onToggle: () => void;
}) {
  const onId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={onId}
      className="entry-switch"
      data-sidekick={option.sidekick}
      onClick={onToggle}
    >
      <span className="entry-switch-off">{option.off}</span>
      <span className="entry-switch-track" aria-hidden="true">
        <span className="entry-switch-thumb" />
      </span>
      <span className="entry-switch-on" id={onId}>{option.on}</span>
    </button>
  );
}
