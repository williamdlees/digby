// Per-codon variability read back from the alignment text the server draws, so the summary and the alignment always agree.
// The text comes in blocks: a ruler of codon numbers, the reference translation and sequence, then for each allele
// an amino acid line (a letter where the allele's amino acid differs) and its sequence (lower case where a base differs).

export interface CodonVariability {
  codon: number;
  /** alleles with a base substitution in this codon */
  nt: number;
  /** of those, alleles whose amino acid changes */
  aa: number;
}

export interface Region { name: string; start: number; end: number; cdr: boolean; }

// IMGT unique numbering for V-REGION codons
export const V_REGIONS: Region[] = [
  { name: 'FR1', start: 1, end: 26, cdr: false },
  { name: 'CDR1', start: 27, end: 38, cdr: true },
  { name: 'FR2', start: 39, end: 55, cdr: false },
  { name: 'CDR2', start: 56, end: 65, cdr: true },
  { name: 'FR3', start: 66, end: 104, cdr: false },
  { name: 'CDR3', start: 105, end: 117, cdr: true },
];

export function variability(alignment: string): { codons: CodonVariability[]; alleles: number } {
  const byCodon = new Map<number, CodonVariability>();
  const seen = new Set<string>();
  let numbers: number[] = [];
  let reference: string = null;
  let aaLine = '';

  for (const line of alignment.split('\n')) {
    if (/^\s+\d[\d\s]*$/.test(line)) {
      numbers = line.trim().split(/\s+/).map(Number);
      aaLine = '';
      continue;
    }
    const named = /^(\S+)(\s+)(.*)$/.exec(line);
    if (!named) {
      // a blank or translation line; the one just before an allele carries that allele's changed amino acids
      if (line.trim()) {
        aaLine = line;
      }
      continue;
    }
    const name = named[1];
    reference ??= name;
    if (name !== reference) {
      seen.add(name);
      const start = name.length + named[2].length;
      numbers.forEach((codon, k) => {
        const col = start + 4 * k;
        const bases = line.slice(col, col + 3);
        if (/[acgt]/.test(bases)) {
          const v = byCodon.get(codon) ?? { codon, nt: 0, aa: 0 };
          v.nt++;
          if (/[A-Z*]/.test(aaLine.charAt(col + 1))) {
            v.aa++;
          }
          byCodon.set(codon, v);
        }
      });
    }
    aaLine = '';
  }

  const last = Math.max(0, ...numbers, ...byCodon.keys());
  const codons = Array.from({ length: last }, (_, i) => byCodon.get(i + 1) ?? { codon: i + 1, nt: 0, aa: 0 });
  return { codons, alleles: seen.size };
}
