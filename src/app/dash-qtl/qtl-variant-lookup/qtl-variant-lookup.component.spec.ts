import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from '../qtl.service';
import { QtlVariantLookupComponent } from './qtl-variant-lookup.component';

describe('QTL variant lookup', () => {
  const api = { variantLookup: vi.fn() };
  let component: QtlVariantLookupComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    component = new QtlVariantLookupComponent(TestBed.inject(QtlService));
    component.species = 'Human';
    component.variant = 'v1';
  });

  it('resolves a variant, filters and sorts associations, and drills into one', () => {
    api.variantLookup.mockReturnValue(of({
      locus: 'IGH', variant: { variant: 'v1' },
      associations: [
        { asc: 'V1', segment: 'V', significant: true, neglog10_p: 5, n: null },
        { asc: 'J1', segment: 'J', significant: false, neglog10_p: 1, n: 20 },
        { asc: 'V2', segment: 'V', significant: true, neglog10_p: 3, n: 10 },
      ],
      genotype_counts: { 0: 20, 1: 5, 2: 1 },
      thresholds: [{ analysis: 'usage', threshold: 0.0001 }],
      dbsnp: { mapped: true, rsids: ['rs1'], grch38: { contig: 'chr14', pos: 123 } },
    }));
    const resolved = vi.fn();
    const drill = vi.fn();
    component.resolved.subscribe(resolved);
    component.drill.subscribe(drill);
    component.ngOnChanges({ variant: new SimpleChange(null, 'v1', true) });
    expect(api.variantLookup).toHaveBeenCalledWith('Human', 'v1');
    expect(resolved).toHaveBeenCalledWith({ locus: 'IGH', variant: 'v1' });
    expect(component.threshold).toBe(0.0001);
    expect(component.genotypeSpread).toBe('0/0 20 · 0/1 5 · 1/1 1');
    expect(component.geneSegments).toEqual(['V', 'J']);
    expect(component.rows.map(row => row.asc)).toEqual(['V1', 'V2']);
    component.clearFilters();
    component.sortBy('n');
    expect(component.rows.map(row => row.asc)).toEqual(['J1', 'V2', 'V1']);
    component.sortBy('n');
    expect(component.rows.map(row => row.asc)).toEqual(['V2', 'J1', 'V1']);
    component.geneFilter = 'IGHV1';
    expect(component.rows.map(row => row.asc)).toEqual(['V1']);
    component.open(component.rows[0]);
    expect(drill).toHaveBeenCalledWith({ locus: 'IGH', variant: 'v1', asc: 'V1' });
    expect(component.outsideLinks.map(link => link.label)).toEqual(['rs1', 'GTEx', 'chr14:123']);
    component.ngOnChanges({ species: new SimpleChange('Human', 'Human', false) });
    expect(api.variantLookup).toHaveBeenCalledOnce();
  });

  it('distinguishes an untested variant from a request failure', () => {
    api.variantLookup.mockReturnValueOnce(throwError(() => ({ status: 404 })))
      .mockReturnValueOnce(throwError(() => ({ status: 500, error: { message: 'unavailable' } })));
    component.ngOnChanges({ variant: new SimpleChange(null, 'v1', true) });
    expect(component.notFound).toBe('v1');
    expect(component.error).toBeNull();
    component.variant = 'v2';
    component.ngOnChanges({ variant: new SimpleChange('v1', 'v2', false) });
    expect(component.notFound).toBeNull();
    expect(component.error).toBe('unavailable');
    expect(component.isFetching).toBe(false);
  });

  it('handles empty result fields, filtering and name sorting', () => {
    api.variantLookup.mockReturnValue(of({ locus: 'IGH', variant: { variant: 'v1' },
      associations: [
        { asc: 'V2', segment: 'V', significant: false },
        { asc: 'V1', segment: 'V', significant: true },
        { asc: 'X1', segment: 'X', significant: true },
      ] }));
    component.ngOnChanges({ variant: new SimpleChange(null, 'v1', true) });
    expect(component.threshold).toBeNull();
    expect(component.genotypeSpread).toBe('');
    expect(component.outsideLinks).toEqual([]);
    expect(component.totalRows).toBe(3);
    expect(component.geneSegments).toEqual(['V', 'X']);
    component.toggleGeneSegment('V');
    expect(component.rows.map(row => row.asc)).toEqual(['V1']);
    component.toggleGeneSegment('V');
    component.clearFilters();
    expect(component.filtersOn).toBe(false);
    component.sortBy('asc');
    expect(component.rows.map(row => row.asc)).toEqual(['V1', 'V2', 'X1']);
    component.toggleInfo();
    component.toggleGenotypeInfo();
    expect(component.infoOpen).toBe(true);
    expect(component.genotypeInfoOpen).toBe(true);
  });
});
