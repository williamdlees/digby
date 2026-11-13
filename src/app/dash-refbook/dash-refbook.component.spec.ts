import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RefbookService } from '../../../projects/digby-swagger-client/api/refbook.service';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { DashDrillService } from './dash-drill.service';
import { DashRefbookComponent } from './dash-refbook.component';

describe('reference dashboard state', () => {
  const api = { getAscsInLocusApi: vi.fn(), getProjects: vi.fn(), getSamples: vi.fn(), getAscsOverview: vi.fn() };
  const router = { url: '/dash_refbook', navigate: vi.fn() };
  let component: DashRefbookComponent;
  let selections: GeneTableSelectorService;
  let drill: DashDrillService;

  function initialize(params: Record<string, string> = {}) {
    const queryParamMap = convertToParamMap(params);
    TestBed.configureTestingModule({ providers: [
      GeneTableSelectorService, DashDrillService,
      { provide: RefbookService, useValue: api },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { queryParamMap: of(queryParamMap), snapshot: { queryParamMap } } },
    ] });
    selections = TestBed.inject(GeneTableSelectorService);
    selections.selection.next({ ...selections.selection.value, commonDatasets: ['IGH'] });
    drill = TestBed.inject(DashDrillService);
    component = new DashRefbookComponent(selections, TestBed.inject(RefbookService),
      TestBed.inject(ActivatedRoute), TestBed.inject(Router), drill);
    component.panels.forEach(panel => vi.spyOn(panel, 'load').mockResolvedValue(class {}));
    component.ngOnInit();
    vi.advanceTimersByTime(300);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    router.url = '/dash_refbook';
    api.getAscsInLocusApi.mockReturnValue(of({
      ascs: ['IGHV1', 'IGHV2', 'IGHJ1'], segments: { IGHV1: 'V', IGHV2: 'V', IGHJ1: 'J' },
      genomic: true, airr_seq: true,
    }));
    api.getProjects.mockReturnValue(of({ projects: [
      { name: 'study', accession: 'acc', samples: 2, sources: ['genomic', 'airrseq'] },
    ] }));
    api.getSamples.mockReturnValue(of({ samples: [{ name: 'sample1', project: 'study', sources: ['airrseq'] }] }));
    api.getAscsOverview.mockReturnValue(of({
      alleles: ['IGHV1*01', 'IGHV1*02'], genomic_counts: [5, 1], vdjbase_counts: [2, 4],
    }));
  });

  afterEach(() => {
    component?.ngOnDestroy();
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('loads genes and source availability, then filters samples and allele counts', () => {
    initialize();
    expect(api.getAscsInLocusApi).toHaveBeenCalledWith('Human', 'IGH');
    expect(component.available).toEqual({ genomic: true, airrseq: true });
    expect(component.selection.ascs).toEqual(['IGHV1']);
    expect(component.availableAscs).toEqual(['IGHV1', 'IGHV2']);
    expect(component.showGenomicRange).toBe(true);
    component.minGenomic = 2;
    component.minAirrseq = 2;
    component.onSeenInChange();
    expect(component.selection.countFilter).toEqual(['IGHV1*01']);
    expect(component.passingCount).toBe(1);
    component.onProjectsChange(['study']);
    component.onSamplesChange(['sample1']);
    expect(component.selection).toMatchObject({
      projects: ['study'], samples: ['sample1'], projectScope: { genomic: ['study'], airrseq: ['study'] },
    });
    expect(component.projectOptions[0]).toMatchObject({ value: 'study', group: 'Genomic + AIRR-seq' });
    expect(component.sampleOptions[0]).toMatchObject({ value: 'sample1', group: 'AIRR-seq' });
    component.resetSeenIn();
    expect(component.selection.countFilter).toBeUndefined();
  });

  it('switches segments, caps gene selection and manages facets', () => {
    initialize();
    component.segment = 'J';
    component.onSegmentChange();
    expect(component.selection.ascs).toEqual(['IGHJ1']);
    component.onGenesChange(['IGHV1', 'IGHV2', 'IGHJ1', 'extra']);
    expect(component.selection.ascs).toEqual(['IGHV1', 'IGHV2', 'IGHJ1']);
    expect(component.pickerOpen).toBe(false);
    const overview = component.panels.find(panel => panel.id === 'overview');
    const sunburst = component.panels.find(panel => panel.id === 'sunburst');
    expect(component.facetsFor(overview)).toEqual(['IGHV1', 'IGHV2', 'IGHJ1']);
    expect(component.facetsFor(sunburst)).toEqual([]);
    expect(component.selectionFor('IGHV2')).toBe(component.selectionFor('IGHV2'));
    expect(component.selectionFor('IGHV2')).toMatchObject({ asc: 'IGHV2', ascs: ['IGHV2'], alleles: [] });
  });

  it('handles allele and sample drills and refuses to disable every source', () => {
    initialize();
    drill.drill('allele', 'IGHV1*01');
    expect(component.activePanelId).toBe('allele');
    expect(component.selectedAlleles).toEqual(['IGHV1*01']);
    drill.drill('allele', 'IGHV1*01');
    expect(component.activePanelId).toBe('overview');
    drill.drill('sample', 'sample1');
    expect(component.selection.samples).toEqual(['sample1']);
    component.toggleSource('genomic');
    expect(component.selection.sources).toEqual(['airrseq']);
    component.toggleSource('airrseq');
    expect(component.selection.sources).toEqual(['airrseq']);
  });

  it('restores a linked allele panel and reports unavailable loci', () => {
    initialize({ panel: 'allele', genes: 'IGHV2', alleles: 'IGHV2*01', species: 'Human' });
    expect(component.activePanelId).toBe('allele');
    expect(component.selection.ascs).toEqual(['IGHV2']);
    expect(component.selectedAlleles).toEqual(['IGHV2*01']);
    api.getAscsInLocusApi.mockReturnValue(throwError(() => ({ status: 404 })));
    selections.selection.next({ ...selections.selection.value, commonDatasets: ['IGK'] });
    vi.advanceTimersByTime(300);
    expect(component.locusUnavailable).toBe('The Explorer has no data for IGK.');
    expect(component.availableAscs).toEqual([]);
    expect(component.ascLoading).toBe(false);
  });

  it('opens gallery panels and removes filters through their chips', () => {
    initialize();
    const sunburst = component.panels.find(panel => panel.id === 'sunburst');
    const allele = component.panels.find(panel => panel.id === 'allele');
    expect(component.sampleFiltersEnabled).toBe(true);
    expect(component.isAscSelected('IGHV1')).toBe(true);
    expect(component.canOpen(allele)).toBe(true);
    expect(component.alleleChoices).toEqual([
      { name: 'IGHV1*01', carriers: 7 }, { name: 'IGHV1*02', carriers: 5 },
    ]);
    component.openFromGallery(sunburst);
    expect(component.railScoped).toBe(true);
    expect(component.selectionForPanel(sunburst).chain).toBe('IGH');
    component.toggleCaption('sunburst');
    expect(component.captionOpen.sunburst).toBe(true);
    component.onProjectsChange(['study']);
    component.onSamplesChange(['sample1']);
    component.openAllele('IGHV1*01');
    expect(component.activeChips.map(chip => chip.key)).toContain('allele:IGHV1*01');
    component.removeChip('allele:IGHV1*01');
    component.removeChip('sample:sample1');
    component.removeChip('project:study');
    expect(component.selectedAlleles).toEqual([]);
    expect(component.selectedSamples).toEqual([]);
    expect(component.selectedProjects).toEqual([]);
    component.focusGene('IGHV2');
    expect(component.selection.ascs).toEqual(['IGHV2']);
    component.openGallery();
    expect(component.showGallery).toBe(true);
  });

  it('applies range sliders and restores source and gene filters from chips', () => {
    initialize();
    component.genomicIndex = component.genomicStops.length - 1;
    component.airrseqIndex = component.airrseqStops.length - 1;
    component.onStopInput('genomic');
    component.onStopInput('airrseq');
    component.onSeenInChange();
    expect(component.nothingPassesFilter).toBe(true);
    expect(component.alleleChoices).toEqual([]);
    component.resetSeenIn();
    component.toggleSource('genomic');
    expect(component.activeChips.map(chip => chip.key)).toContain('source');
    component.removeChip('source');
    expect(component.selection.sources).toEqual(['genomic', 'airrseq']);
    component.removeChip('gene:IGHV1');
    expect(component.selection.ascs).toEqual([]);
    const overview = component.panels.find(panel => panel.id === 'overview');
    expect(component.galleryBlocked(overview)).toContain('Select a gene');
    component.openFromGallery({ id: 'sunburst' });
    component.selectPanel(overview);
    expect(component.activePanelId).toBe('sunburst');
    component.removeChip('segment');
    expect(component.availableAscs).toEqual(['IGHV1', 'IGHV2', 'IGHJ1']);
  });

  it('drops stale project and sample filters when the available cohort changes', () => {
    initialize();
    component.onProjectsChange(['study']);
    component.onSamplesChange(['sample1']);
    api.getProjects.mockReturnValue(of({ projects: [] }));
    api.getSamples.mockReturnValue(of({ samples: [] }));
    component.toggleSource('genomic');
    expect(component.selectedProjects).toEqual([]);
    expect(component.selectedSamples).toEqual([]);
    expect(component.selection.projectScope).toEqual({ genomic: [], airrseq: [] });
    selections.selection.next({ ...selections.selection.value, commonDatasets: [] });
    expect(component.availableAscs).toEqual([]);
    expect(component.selection.ascs).toEqual([]);
  });

  it('reports non-404 locus failures and handles unavailable source data', () => {
    initialize();
    api.getAscsInLocusApi.mockReturnValue(throwError(() => ({ status: 500 })));
    selections.selection.next({ ...selections.selection.value, commonDatasets: ['IGK'] });
    vi.advanceTimersByTime(300);
    expect(component.locusUnavailable).toBe('Could not load the genes for this locus.');
    api.getAscsInLocusApi.mockReturnValue(of({ ascs: [], genomic: false, airr_seq: true }));
    selections.selection.next({ ...selections.selection.value, commonDatasets: ['IGL'] });
    vi.advanceTimersByTime(300);
    expect(component.selection.sources).toEqual(['airrseq']);
    expect(component.availableAscs).toEqual([]);
  });
});
