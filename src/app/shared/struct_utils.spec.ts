import { areListsEqual, areObjectsEqual, listsOfDictionariesEqual } from './struct_utils';

describe('structure comparisons', () => {
  it('compares object keys and values shallowly', () => {
    expect(areObjectsEqual({ a: 1 }, {})).toBe(false);
    expect(areObjectsEqual({ a: 1 }, { b: 1 })).toBe(false);
    expect(areObjectsEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(areObjectsEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(areObjectsEqual({ a: {} }, { a: {} })).toBe(false);
  });

  it('compares lists of dictionaries independently of list order', () => {
    expect(listsOfDictionariesEqual([{ a: 1 }], [])).toBe(false);
    expect(listsOfDictionariesEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    expect(listsOfDictionariesEqual([{ a: 1 }, { b: 2 }], [{ b: 2 }, { a: 1 }])).toBe(true);
  });

  it('compares list members without regard to order', () => {
    expect(areListsEqual([1], [])).toBe(false);
    expect(areListsEqual([1, 1], [1, 2])).toBe(false);
    expect(areListsEqual([1], [2])).toBe(false);
    expect(areListsEqual([1, 2], [2, 1])).toBe(true);
  });
});
