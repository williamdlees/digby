import { variability } from './alignment-variability';

describe('alignment variability', () => {
  it('counts substitutions and amino-acid differences per codon', () => {
    const alignment = [
      '      1   2',
      'ref   AAA CCC',
      '       K',
      'a1    aAA CCC',
      'a2    AAA cCC',
    ].join('\n');
    expect(variability(alignment)).toEqual({
      alleles: 2,
      codons: [{ codon: 1, nt: 1, aa: 1 }, { codon: 2, nt: 1, aa: 0 }],
    });
  });

  it('returns an empty result for empty input', () => {
    expect(variability('')).toEqual({ alleles: 0, codons: [] });
  });
});
