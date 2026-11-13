/** The first letter of the first two words: "Ada Lovelace" gives "AL". */
export function initials(name: string, count = 2): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, count)
      // Spread, not charAt: a letter outside the basic plane is two code units.
      .map((word) => [...word][0]?.toUpperCase() ?? "")
      .join("")
  );
}
