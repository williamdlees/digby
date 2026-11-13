import { collapseGroup, colour, DRILLED_FILL, fills, layout, lighten, ROOT_FILL, type SunburstPayload } from './sunburst-layout';

describe('sunburst layout', () => {
  const payload: SunburstPayload = {
    levels: ['locus', 'gene', 'allele'], levelStart: [0, 1, 3],
    label: ['IGH', 'g1', 'g2', 'a', 'b', 'c'], parent: [-1, 0, 0, 1, 1, 2],
    novel: [], nG: [], nA: [],
  };

  it('calculates leaf counts and sibling positions', () => {
    expect(layout(payload)).toEqual({
      depth: [0, 1, 1, 2, 2, 2], value: [3, 2, 1, 1, 1, 1],
      ordinal: [0, 0, 1, 0, 1, 0], topOf: [0, 1, 2, 1, 1, 2],
      childCount: [2, 2, 1, 0, 0, 0],
    });
  });

  it('colors the selected subtree and preserves root', () => {
    const result = fills(payload, layout(payload), 1);
    expect(result[0]).toBe(ROOT_FILL);
    expect(result[1]).toBe(DRILLED_FILL);
    expect(result[3]).toBe(colour(0));
    expect(result[4]).toBe(colour(1));
    expect(fills(payload, layout(payload), null)[0]).toBe(ROOT_FILL);
    expect(lighten('#000000', 1)).toBe('#ffffff');
    expect(collapseGroup('IGHV1/IGHV1-2')).toBe('IGHV1*');
    expect(collapseGroup('IGHV1*01/IGHV1*02')).toBe('IGHV1*01/IGHV1*02');
  });
});
