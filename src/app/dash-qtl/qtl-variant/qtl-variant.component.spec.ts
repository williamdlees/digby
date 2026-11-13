import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from '../qtl.service';
import { QtlVariantComponent } from './qtl-variant.component';

describe('QTL variant', () => {
  const api = { variant: vi.fn(), variantUsage: vi.fn() };
  let component: QtlVariantComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    component = new QtlVariantComponent(TestBed.inject(QtlService));
    component.selection = { species: 'Human', locus: 'IGH', variant: 'v1' };
    component.fallbackAsc = 'V1';
  });

  it('builds genotype plots and export rows from the selected variant', () => {
    api.variant.mockReturnValue(of({
      variant: { variant: 'v1' }, associations: [{ significant: true }, { significant: false }],
      has_genotypes: true,
      dbsnp: { mapped: true, applies: true, rsids: ['rs1', 'rs2'], grch38: { contig: 'chr14', pos: 123 } },
    }));
    api.variantUsage.mockReturnValue(of({
      subjects: [
        { subject: 's1', genotype: 0, usage: 0.1 },
        { subject: 's2', genotype: 1, usage: 0.2 },
        { subject: 's3', genotype: null, usage: null },
      ],
      association: null,
    }));
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.variantUsage).toHaveBeenCalledWith('Human', 'IGH', 'v1', 'V1');
    expect(component.counts).toEqual([
      { genotype: 0, label: '0/0', n: 1 }, { genotype: 1, label: '0/1', n: 1 },
    ]);
    expect(component.usageTable.rows).toEqual([['s1', '0/0', 0.1], ['s2', '0/1', 0.2]]);
    expect(component.plotData).toEqual([
      expect.objectContaining({ name: '0/0  (n=1)', y: [0.1], text: ['s1'] }),
      expect.objectContaining({ name: '0/1  (n=1)', y: [0.2], text: ['s2'] }),
    ]);
    expect(component.outsideLinks.map(link => link.label)).toEqual(['rs1', 'rs2', 'chr14:123']);
    expect(component.significantCount).toBe(1);
    component.significantOnly = true;
    expect(component.shownAssociations).toHaveLength(1);
    expect(component.hasGenotypes).toBe(true);
    expect(component.isFetching).toBe(false);
  });

  it('retains detail when usage is unavailable and reports detail failures', () => {
    api.variant.mockReturnValueOnce(of({ variant: { variant: 'v1' } }))
      .mockReturnValueOnce(throwError(() => ({ error: { message: 'not found' } })));
    api.variantUsage.mockReturnValue(throwError(() => new Error('unavailable')));
    const change = { selection: new SimpleChange(null, component.selection, true) };
    component.ngOnChanges(change);
    expect(component.variant.variant).toBe('v1');
    expect(component.plotData).toEqual([]);
    component.ngOnChanges(change);
    expect(component.error).toBe('not found');
    expect(component.isFetching).toBe(false);
  });
});
