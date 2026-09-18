import { describe, expect, it } from "vitest";
import { editLease, expireLease, LEASE_MS, passwordRequirements } from "./password-lease";

describe("password leases", () => {
  it("expires independently at the exact boundary without renewing existing text", () => {
    const first = editLease([], "Ab", 100);
    const second = editLease(first, "Ab1!", 1100);
    expect(second.map((letter) => letter.expiresAt)).toEqual([LEASE_MS + 100, LEASE_MS + 100, LEASE_MS + 1100, LEASE_MS + 1100]);
    expect(expireLease(second, LEASE_MS + 99).characters).toHaveLength(4);
    expect(expireLease(second, LEASE_MS + 100).characters.map((letter) => letter.value).join("")).toBe("1!");
    expect(expireLease(second, LEASE_MS + 1100).characters).toEqual([]);
  });

  it("preserves prefix and suffix deadlines through a middle replacement", () => {
    const original = editLease([], "Abcd1!xy", 0);
    const changed = editLease(original, "AbZZ1!xy", 4000);
    expect(changed.map((letter) => letter.expiresAt)).toEqual([LEASE_MS, LEASE_MS, LEASE_MS + 4000, LEASE_MS + 4000, LEASE_MS, LEASE_MS, LEASE_MS, LEASE_MS]);
    expect(expireLease(changed, LEASE_MS).characters.map((letter) => letter.value).join("")).toBe("ZZ");
  });

  it("does not renew identical replacements or surviving text after deletion", () => {
    const original = editLease([], "aaaB1!", 0);
    expect(editLease(original, "aaaB1!", LEASE_MS - 1000)).toEqual(original);
    expect(editLease(original, "aaB1!", LEASE_MS - 1000).every((letter) => letter.expiresAt === LEASE_MS)).toBe(true);
  });

  it("maps caret and selection endpoints across removed characters", () => {
    const old = editLease([], "AB", 0);
    const withMiddle = editLease(old, "AxyB", LEASE_MS / 2);
    expect(expireLease(withMiddle, LEASE_MS, 1).position).toBe(0);
    expect(expireLease(withMiddle, LEASE_MS, 3).position).toBe(2);
    expect(expireLease(withMiddle, LEASE_MS, 4).position).toBe(2);
  });

  it("bounds pasted input and removes whitespace and unsupported characters", () => {
    const pasted = editLease([], " a\nBé🙂1!" + "x".repeat(30), 0);
    expect(pasted).toHaveLength(24);
    expect(pasted.map((letter) => letter.value).join("")).toBe("aB1!" + "x".repeat(20));
  });

  it("revalidates remaining characters after a background gap or submission deadline", () => {
    const start = editLease([], "A", 0);
    const valid = editLease(start, "Abcdef1!", 1000);
    const meets = (value: string) => passwordRequirements(value).every((requirement) => requirement.met);
    expect(meets("Abcdef1!")).toBe(true);
    expect(meets(expireLease(valid, LEASE_MS).characters.map((letter) => letter.value).join(""))).toBe(false);
    expect(expireLease(valid, LEASE_MS * 5).characters).toEqual([]);
    for (const value of ["abcdef1!", "ABCDEF1!", "Abcdefgh", "Abc1!", "Abcdef12", "Abcdefg!", "Abcdef1!" + "x".repeat(17)]) {
      expect(meets(value), value).toBe(false);
    }
  });
});
