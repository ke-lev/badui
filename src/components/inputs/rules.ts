/** The quantity after one step: ten percent of itself, rounded half up. */
export function stepQuantity(quantity: number, direction: 1 | -1): number {
  // Integer arithmetic, so 4.5 and 16.5 land on the half exactly.
  const next = Math.round((quantity * (10 + direction)) / 10);
  return Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, next));
}

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 999;

/** Letters in order of how often each appears in English text. */
export const LETTERS_BY_FREQUENCY = "ETAOINSHRDLCUMWFGYPBVKJXQZ".split("");

/** A name from its letters: the first capital, the rest lower case. */
export function nameFrom(letters: string[]): string {
  return letters.map((letter, index) => (index === 0 ? letter : letter.toLowerCase())).join("");
}

/** Every character, in ascending UTF-16 code unit order. */
export function sortCharacters(value: string): string {
  return [...value].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join("");
}

export const CODE_LENGTH = 6;

/** Digits only, at most six of them. */
export function codeFrom(value: string): string {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}
