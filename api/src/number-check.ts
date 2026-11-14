export type NumberCheck = { total: number; found: number; missing: string[] };

/**
 * How many of the figures in an answer appear in the data the model retrieved.
 *
 * Citations such as [PSI-25] and single digits are ignored. A figure counts as found when
 * its digits appear in the retrieved text, so "34%" matches 34 and "1,989" matches 1989.
 * This catches invented numbers. It does not prove a number is used correctly.
 */
export function checkNumbers(answer: string, haystack: string): NumberCheck {
  const stripped = answer.replace(/\[PSI-[^\]]*\]/g, " ").replace(/PSI-\d+/g, " ");
  const numbers = [...new Set((stripped.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,(?=\d{3})/g, "").replace(/[.,]$/, "")))].filter(
    (n) => Number(n) >= 10 || n.includes("."),
  );
  const hay = haystack.replace(/,(?=\d{3})/g, "");
  // A figure written with empty decimals, such as 8.0, is the same figure as 8.
  const missing = numbers.filter((n) => !hay.includes(n) && !hay.includes(n.replace(/\.0+$/, "")));
  return { total: numbers.length, found: numbers.length - missing.length, missing };
}
