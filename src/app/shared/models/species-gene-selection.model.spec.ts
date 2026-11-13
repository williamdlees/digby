import { allelesParam, countFilterExcludesAll, projectsParam, samplesParam, scopeNote, sourcesParam } from './species-gene-selection.model';

describe('dashboard selection parameters', () => {
  it('serializes selected values and omits empty filters', () => {
    expect(sourcesParam({ sources: ['genomic', 'airrseq'] })).toBe('genomic,airrseq');
    expect(projectsParam({ projects: [] })).toBeUndefined();
    expect(samplesParam({ samples: ['one', 'two'] })).toBe('one,two');
    expect(allelesParam({})).toBeUndefined();
    expect(allelesParam({ alleles: ['a', 'b'], countFilter: ['b', 'c'] })).toBe('b');
    expect(allelesParam({ countFilter: ['c'] })).toBe('c');
    expect(countFilterExcludesAll({ countFilter: [] })).toBe(true);
    expect(countFilterExcludesAll({})).toBe(false);
  });

  it('describes project and sample scope by source', () => {
    expect(scopeNote({ projects: ['p'], projectScope: { genomic: ['p'], airrseq: [] }, samples: ['s'] }, ['genomic', 'airrseq']))
      .toBe('Genomic: p · AIRR-seq: all projects · sample s');
    expect(scopeNote({ samples: ['s1', 's2'] }, ['genomic'])).toBe('2 samples');
    expect(scopeNote({}, ['genomic'])).toBeNull();
  });

  it('handles absent selections and combines allele filters without broadening them', () => {
    expect(sourcesParam(null)).toBeUndefined();
    expect(sourcesParam({ sources: [] })).toBeUndefined();
    expect(projectsParam(null)).toBeUndefined();
    expect(projectsParam({ projects: ['p1', 'p2'] })).toBe('p1,p2');
    expect(samplesParam(null)).toBeUndefined();
    expect(samplesParam({ samples: [] })).toBeUndefined();
    expect(allelesParam(null)).toBeUndefined();
    expect(allelesParam({ alleles: ['a', 'b'] })).toBe('a,b');
    expect(allelesParam({ alleles: ['a'], countFilter: ['b'] })).toBeUndefined();
    expect(countFilterExcludesAll({ countFilter: ['a'] })).toBe(false);
    expect(scopeNote(null, ['genomic'])).toBeNull();
  });
});
