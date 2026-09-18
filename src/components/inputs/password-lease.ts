export const LEASE_MS = 8_000;
export const MAX_PASSWORD_LENGTH = 24;
export type LeasedCharacter = { value: string; expiresAt: number };

/** Preserve deadlines on the unchanged prefix and suffix, including middle edits. */
export function editLease(previous: LeasedCharacter[], value: string, now: number): LeasedCharacter[] {
  const next = value.replace(/[^\x21-\x7e]/g, "").slice(0, MAX_PASSWORD_LENGTH);
  let start = 0;
  while (start < previous.length && start < next.length && previous[start].value === next[start]) start++;
  let end = 0;
  while (end < previous.length - start && end < next.length - start && previous[previous.length - 1 - end].value === next[next.length - 1 - end]) end++;
  return [
    ...previous.slice(0, start),
    ...next.slice(start, next.length - end).split("").map((character) => ({ value: character, expiresAt: now + LEASE_MS })),
    ...(end ? previous.slice(-end) : []),
  ];
}

export function expireLease(characters: LeasedCharacter[], now: number, position = characters.length) {
  return {
    characters: characters.filter((character) => character.expiresAt > now),
    position: characters.slice(0, position).filter((character) => character.expiresAt > now).length,
  };
}

export function passwordRequirements(value: string) {
  return [
    { label: "8–24 characters", met: value.length >= 8 && value.length <= 24 },
    { label: "Upper & lowercase", met: /[A-Z]/.test(value) && /[a-z]/.test(value) },
    { label: "Number & symbol", met: /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value) },
  ];
}
