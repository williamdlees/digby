import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from '../qtl.service';
import { QtlSummaryComponent } from './qtl-summary.component';

describe('QTL summary', () => {
  const api = { usageSummary: vi.fn(), geneSummary: vi.fn() };
  let component: QtlSummaryComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    component = new QtlSummaryComponent(TestBed.inject(QtlService));
    component.species = 'Human';
    component.locus = 'IGH';
  });

  it('folds UTR counts into intergenic data and exports the selected loci', () => {
    api.usageSummary.mockReturnValue(of({
      loci: ['IGH', 'IGK'], segments: ['V', 'J'], features: ['coding', 'utr', 'intergenic'],
      rows: [
        { locus: 'IGH', segment: 'V', feature: 'coding', n: 3 },
        { locus: 'IGH', segment: 'V', feature: 'utr', n: 2 },
        { locus: 'IGH', segment: 'V', feature: 'intergenic', n: 4 },
        { locus: 'IGK', segment: 'J', feature: 'coding', n: 8 },
      ],
      totals: { IGH: { n_significant: 9, n_variants: 20 }, IGK: { n_significant: 8, n_variants: 30 } },
    }));
    api.geneSummary.mockReturnValue(of({ genes: [
      { asc: 'V1', segment: 'V', n_significant: 2, by_feature: { utr: 2, intergenic: 3 } },
      { asc: 'J1', segment: 'J', n_significant: 0 },
    ] }));
    component.ngOnChanges({ species: new SimpleChange(null, 'Human', true) });
    expect(api.usageSummary).toHaveBeenCalledWith('Human');
    expect(api.geneSummary).toHaveBeenCalledWith('Human', 'IGH');
    expect(component.features).toEqual(['coding', 'intergenic']);
    expect(component.countFor(component.rankedGenes[0], 'intergenic')).toBe(5);
    expect(component.inFeatureShare).toEqual({ n: 3, total: 9 });
    expect(component.exportTable.rows).toEqual([
      ['IGH', 'V', 'intergenic', 6, 9, 20], ['IGH', 'V', 'coding', 3, 9, 20],
    ]);
    expect(component.plotData).toEqual([
      expect.objectContaining({ name: 'coding', x: ['V'], y: [3] }),
      expect.objectContaining({ name: 'intergenic', x: ['V'], y: [6] }),
    ]);
    component.toggleScope();
    expect(component.inFeatureShare).toEqual({ n: 11, total: 17 });
    expect(component.plotLayout).toMatchObject({ xaxis: { type: 'multicategory' } });
    component.toggleScale();
    expect(component.plotLayout).toMatchObject({ yaxis: { type: 'linear' } });
    expect(component.geneSegments).toEqual(['V', 'J']);
    component.withSignalOnly = true;
    component.geneFilter = 'ighv1';
    expect(component.shownGenes.map(g => g.asc)).toEqual(['V1']);
    component.toggleGeneSegment('J');
    expect(component.shownGenes).toEqual([]);
    component.clearGeneFilters();
    expect(component.geneFiltersOn).toBe(false);
    expect(component.shownGenes).toHaveLength(2);
  });

  it('reports a failed summary request', () => {
    api.usageSummary.mockReturnValue(throwError(() => ({ error: { message: 'unavailable' } })));
    api.geneSummary.mockReturnValue(of({ genes: [] }));
    component.ngOnChanges({ locus: new SimpleChange(null, 'IGH', true) });
    expect(component.error).toBe('unavailable');
    expect(component.loading).toBe(false);
  });

  it('filters gene rows by displayed name, segment and signal, then clears the filters', () => {
    component.genes = { genes: [
      { asc: 'V1', segment: 'V', n_significant: 1 },
      { asc: 'V2', segment: 'V', n_significant: 0 },
      { asc: 'J1', segment: 'J', n_significant: 1 },
      { asc: 'X1', segment: 'X', n_significant: 1 },
    ] };
    expect(component.geneSegments).toEqual(['V', 'J', 'X']);
    component.toggleGeneSegment('V');
    component.withSignalOnly = true;
    component.geneFilter = '  ighv1 ';
    expect(component.geneFiltersOn).toBe(true);
    expect(component.shownGenes.map(gene => gene.asc)).toEqual(['V1']);
    component.toggleGeneSegment('V');
    expect(component.geneSegment).toBe('');
    component.clearGeneFilters();
    expect(component.shownGenes).toHaveLength(4);
    expect(component.geneFiltersOn).toBe(false);
  });

  it('handles empty summaries, absent species and generic request errors', () => {
    component.species = undefined;
    component.ngOnChanges({ species: new SimpleChange('Human', undefined, false) });
    expect(api.usageSummary).not.toHaveBeenCalled();
    expect(component.inFeatureShare).toBeNull();
    expect(component.rankedGenes).toEqual([]);
    expect(component.features).toEqual([]);
    component.toggleScale();
    expect(component.plotData).toEqual([]);
    component.toggleInfo();
    component.toggleGeneInfo();
    expect(component.infoOpen).toBe(true);
    expect(component.geneInfoOpen).toBe(true);

    component.species = 'Human';
    api.usageSummary.mockReturnValue(throwError(() => ({ status: 400 })));
    api.geneSummary.mockReturnValue(of({ genes: [] }));
    component.ngOnChanges({ species: new SimpleChange(undefined, 'Human', false) });
    expect(component.error).toBe('Could not load the summary');
    expect(component.loading).toBe(false);
  });
});
