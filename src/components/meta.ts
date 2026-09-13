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
};
