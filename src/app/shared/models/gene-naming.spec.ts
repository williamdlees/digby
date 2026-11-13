import { ascDisplayName, familyOf, nameDifferences, segmentLabel, segmentOf, segmentsIn, shortenAlleleName, shortenAlleleNames } from './gene-naming';

describe('gene naming', () => {
  it('groups genes into ordered segments and families', () => {
    expect(segmentOf('IGHV1-2')).toBe('V');
    expect(segmentOf('unknown')).toBe('?');
    expect(familyOf('IGHV1-2')).toBe('IGHV1');
    expect(familyOf('unknown')).toBe('unknown');
    expect(segmentsIn(['IGHJ1', 'IGHV1-2', 'IGHV1-3', 'unknown']))
      .toEqual([{ code: 'V', count: 2 }, { code: 'J', count: 1 }, { code: '?', count: 1 }]);
    expect(segmentLabel('?')).toBe('Other');
  });

  it('shortens allele names consistently and distinguishes duplicates', () => {
    expect(nameDifferences('IGHV1-69*01')).toBe(0);
    expect(nameDifferences('IGHV1-69*01_a_b_c')).toBe(3);
    const name = 'IGHV1-69*01_12345_67890_12345_67890';
    const short = shortenAlleleName(name);
    expect(short).toMatch(/^IGHV1-69\*01\+4~[a-z0-9]{3}$/);
    expect(shortenAlleleName(name)).toBe(short);
    expect([...shortenAlleleNames([name, name]).values()]).toEqual([`${short}#2`]);
    expect(shortenAlleleName('abc', 10)).toBe('abc');
    expect(shortenAlleleName('abcdefghijk', 5)).toBe('abcd~');
  });

  it('adds the locus only when the ASC does not already have it', () => {
    expect(ascDisplayName('IGH', 'V1-2')).toBe('IGHV1-2');
    expect(ascDisplayName('IGH', 'ighv1-2')).toBe('ighv1-2');
    expect(ascDisplayName(undefined, 'V1-2')).toBe('V1-2');
    expect(ascDisplayName('IGH', undefined)).toBe('');
  });
});
