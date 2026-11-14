/** Words only, lower case, padded so that a whole name can be searched for. */
const plain = (text: string) => ` ${text.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim()} `;

/**
 * The experiments named in a sentence, as accessions. Longest names are looked for first, so
 * that "BASS-II" is not read as "BASS". `names` maps an accession to the experiment's short name.
 */
export function namedIn(text: string, names: Record<string, string>): string[] {
  let rest = plain(text);
  const found: string[] = [];
  for (const [acc, name] of Object.entries(names).sort((a, b) => b[1].length - a[1].length)) {
    const needle = plain(name);
    if (rest.includes(needle)) {
      found.push(acc);
      rest = rest.replace(needle, " ");
    }
  }
  return found;
}
