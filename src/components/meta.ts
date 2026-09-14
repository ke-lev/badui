import type { CategoryId } from "./library";

/** Settings an entry's switches hold, by switch key. A missing key is off. */
export type SwitchState = Record<string, boolean>;

/**
 * A two-sided switch the library draws beneath an entry's card. Checked means
 * the right-hand option, which also names it. The state reaches the component
 * as its `switches` prop.
 */
export type EntrySwitch = {
  key: string;
  off: string;
  on: string;
  /** The `data-sidekick` key the switch carries; its line lives in `lines`. */
  sidekick: string;
};

/**
 * Every component in the library exports one of these alongside itself.
 *
 * The library index is built from these exports, which makes documentation
 * load-bearing rather than optional: a component with no `meta` does not
 * appear in the collection at all. Write it in the same change that writes
 * the component.
 */
export type ComponentMeta = {
  /** Display name, sentence case. "Volume control", not "VolumeControl". */
  name: string;
  /**
   * `hostile` for the deliberately awful, `benign` for the genuinely good.
   * The library shows both; the distinction is never explained in copy.
   */
  kind: "hostile" | "benign";
  /** Which shelf of the library the entry is filed under. */
  category: CategoryId;
  /**
   * What the component is and what it does, in one or two sentences.
   * Describe the mechanism, never the joke. "Reaching 100% takes twelve and a
   * half full turns" documents it; "hilariously unusable" explains it.
   */
  summary: string;
  /** The minimal call site, as a reader would paste it. */
  usage: string;
  /** Interaction, state, or accessibility specifics worth knowing. */
  notes?: string;
  /**
   * A portable React + TypeScript brief that reproduces the component without
   * relying on this repository. Keep it in a colocated `*.prompt.ts` file and
   * update it whenever the component's behavior or appearance changes.
   */
  prompt: string;
  /**
   * The cursor companion's Talk-mode lines, keyed by every `data-sidekick`
   * value this component renders — at least one. Required for the same reason
   * as the rest of this type: `entries.test.ts` renders each entry and fails
   * when it renders no key, or a key with no line here.
   */
  lines: Record<string, string>;
  /**
   * Set false to hide the cursor companion while the pointer is inside this
   * entry's card, for components whose pointer effect it would cover.
   */
  sidekick?: false;
  /** Switches drawn beneath the card, outside the component, in this order. */
  switches?: EntrySwitch[];
};
