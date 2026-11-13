import { SimpleChange } from '@angular/core';
import { GenePickerComponent } from './gene-picker.component';

describe('gene picker', () => {
  it('groups and searches genes and clears search when genes change', () => {
    const picker = new GenePickerComponent();
    picker.genes = ['IGHV2-1', 'IGHV1-3', 'IGHV1-2'];
    picker.ngOnChanges({ genes: new SimpleChange(null, picker.genes, true) });
    expect(picker.groups.map(group => group.family)).toEqual(['IGHV1', 'IGHV2']);
    picker.search = 'v1-2';
    picker.onSearchChange();
    expect(picker.shown).toBe(1);
    expect(picker.groups[0].genes).toEqual(['IGHV1-2']);
    picker.ngOnChanges({ genes: new SimpleChange(picker.genes, [], false) });
    expect(picker.search).toBe('');
  });

  it('enforces the selection cap while allowing removal and clear', () => {
    const picker = new GenePickerComponent();
    picker.max = 1;
    const emitted: string[][] = [];
    picker.selectedChange.subscribe(value => emitted.push(value));
    picker.toggle('IGHV1-2');
    expect(picker.isBlocked('IGHV2-1')).toBe(true);
    picker.toggle('IGHV2-1');
    expect(emitted).toEqual([['IGHV1-2']]);
    picker.toggle('IGHV1-2');
    picker.clear();
    expect(emitted).toEqual([['IGHV1-2'], [], []]);
  });
});
