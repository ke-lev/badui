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
