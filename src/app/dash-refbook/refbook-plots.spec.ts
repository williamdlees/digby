import { ElementRef, SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RefbookService } from '../../../projects/digby-swagger-client/api/refbook.service';
import { DashDrillService } from './dash-drill.service';
import { DashRefbookOverviewComponent } from './dash-refbook-overview/dash-refbook-overview.component';
import { DashRefbookUsageComponent } from './dash-refbook-usage/dash-refbook-usage.component';
import { SpeciesGeneSelection } from '../shared/models/species-gene-selection.model';

describe('reference dashboard plots', () => {
  const api = { getAscsOverview: vi.fn(), getAscUsage: vi.fn(), getProjects: vi.fn() };
  const drill = { drill: vi.fn() };
  const host = new ElementRef(document.createElement('div'));
  const selection = { species: 'Human', chain: 'IGH', asc: 'V1', sources: ['genomic', 'airrseq'] as ('genomic' | 'airrseq')[] };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: RefbookService, useValue: api },
      { provide: DashDrillService, useValue: drill },
    ] });
  });

  it('draws allele counts by source, sorts, drills and loads project breakdowns', () => {
    vi.useFakeTimers();
    try {
      api.getAscsOverview.mockReturnValue(of({
        total: 3, novel: 1, baseline: 2, alleles: ['IGHV1*01', 'IGHV1*02', 'IGHV1*03'],
        genomic_only_counts: [1, 0, 0], vdjbase_only_counts: [2, 0, 0], both_counts: [3, 1, 0],
        genomic_counts: [4, 1, 0], vdjbase_counts: [5, 1, 0],
        cohort: { genomic: 10, airrseq: 12, shared: 5 },
      }));
      api.getProjects.mockReturnValue(of({ projects: [
        { name: 'study', by_source: { genomic: 4, airrseq: 5 } },
      ] }));
      const component = new DashRefbookOverviewComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService), host);
      component.selection = selection;
      component.ngOnInit();
      vi.runAllTimers();
      expect(api.getAscsOverview).toHaveBeenCalledWith('Human', 'IGH', 'V1', 'genomic,airrseq', undefined, undefined, undefined);
      expect(component.plotData).toEqual([
        expect.objectContaining({ name: 'Genomic only', x: [null, null, 1] }),
        expect.objectContaining({ name: 'AIRR-seq only', x: [null, null, 2] }),
        expect.objectContaining({ name: 'Both', x: [null, 1, 3] }),
      ]);
      expect(component.unobserved).toBe(1);
      expect(component.cohort).toEqual({ genomic: 10, airrseq: 12, shared: 5 });
      component.setSort('name');
      component.onPlotClick({ points: [{ customdata: 'IGHV1*02' }] });
      expect(drill.drill).toHaveBeenCalledWith('allele', 'IGHV1*02');
      component.toggleProjects();
      expect(api.getProjects).toHaveBeenCalledWith('Human', 'IGH', 'genomic,airrseq');
      expect(component.projectData).toEqual([
        expect.objectContaining({ name: 'Genomic', x: ['study'], y: [4] }),
        expect.objectContaining({ name: 'AIRR-seq', x: ['study'], y: [5] }),
      ]);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('draws nonempty usage distributions and drills to sample or allele', () => {
    api.getAscUsage.mockReturnValue(of({ alleles: [
      { name: 'IGHV1*01', usage: [0.1, 0.2], samples: ['s1', 's2'] },
      { name: 'IGHV1*02', usage: [], samples: [] },
    ] }));
    const component = new DashRefbookUsageComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService), host);
    component.selection = selection;
    component.ngOnInit();
    expect(api.getAscUsage).toHaveBeenCalledWith('Human', 'IGH', 'V1', undefined, undefined, undefined);
    expect(component.plotData).toEqual([
      expect.objectContaining({ name: 'IGHV1*01', x: [0.1, 0.2], customdata: ['s1', 's2'], boxpoints: 'all' }),
    ]);
    component.togglePoints();
    expect(component.plotData[0].boxpoints).toBe(false);
    component.onPlotClick({ points: [{ curveNumber: 0, customdata: 's1' }] });
    component.onPlotClick({ points: [{ curveNumber: 0 }] });
    expect(drill.drill.mock.calls).toEqual([['sample', 's1'], ['allele', 'IGHV1*01']]);
  });

  it('clears incomplete selections and reports usage request errors', () => {
    api.getAscUsage.mockReturnValue(throwError(() => ({ status: 400 })));
    const component = new DashRefbookUsageComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService), host);
    component.selection = selection;
    component.ngOnInit();
    expect(component.error).toBe('Failed to load usage data.');
    expect(component.isFetching).toBe(false);
    component.selection = { species: 'Human' };
    component.fetchUsageData();
    expect(component.error).toBe('');
    expect(component.plotData).toEqual([]);
    expect(api.getAscUsage).toHaveBeenCalledOnce();
  });

  it('updates overview for one selected source, empty selection and request failures', () => {
    vi.useFakeTimers();
    try {
      api.getAscsOverview.mockReturnValueOnce(of({
        alleles: Array.from({ length: 24 }, (_, i) => `IGHV1*${i}`),
        genomic_counts: Array.from({ length: 24 }, (_, i) => i),
        vdjbase_counts: [], genomic_only_counts: [], vdjbase_only_counts: [], both_counts: [],
        cohort: { genomic: 25, airrseq: 0, shared: 0 },
      })).mockReturnValueOnce(throwError(() => ({ status: 400, message: 'bad request' })));
      const component = new DashRefbookOverviewComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService), host);
      component.selection = { ...selection, sources: ['genomic'] };
      component.ngOnInit();
      vi.runAllTimers();
      expect(component.plotData).toHaveLength(2);
      expect(component.plotData[0]).toMatchObject({ name: 'Genomic' });
      expect(component.plotData[1]).toMatchObject({ type: 'scatter' });
      expect(component.chartHeight).toBeGreaterThan(320);
      component.selection = { ...selection, asc: 'V2' };
      component.ngOnChanges({ selection: new SimpleChange<SpeciesGeneSelection>(selection, component.selection, false) });
      expect(component.error).toBe('bad request');
      component.selection = { species: 'Human' };
      component.ngOnChanges({ selection: new SimpleChange<SpeciesGeneSelection>(selection, component.selection, false) });
      expect(component.error).toBeNull();
      expect(component.plotData).toEqual([]);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('renders independent counts without shared samples and handles a failed project breakdown', () => {
    vi.useFakeTimers();
    try {
      api.getAscsOverview.mockReturnValue(of({
        alleles: ['A', 'B'], genomic_counts: [0, 3], vdjbase_counts: [2, 0],
        genomic_only_counts: [], vdjbase_only_counts: [], both_counts: [],
        cohort: { genomic: 3, airrseq: 2, shared: 0 },
      }));
      api.getProjects.mockReturnValue(throwError(() => new Error('unavailable')));
      const component = new DashRefbookOverviewComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService), host);
      component.selection = { ...selection, sources: ['airrseq'] };
      component.ngOnInit();
      vi.runAllTimers();
      expect(component.plotData).toEqual([expect.objectContaining({ name: 'AIRR-seq', x: [2, null] })]);
      expect(component.scopeDescription).toContain('from AIRR-seq data');
      component.toggleProjects();
      expect(component.projectData).toEqual([]);
      expect(component.projectsLoading).toBe(false);
      component.onPlotClick({});
      expect(drill.drill).not.toHaveBeenCalled();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
