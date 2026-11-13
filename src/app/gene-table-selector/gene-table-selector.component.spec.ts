import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GenomicService, RepseqService } from 'projects/digby-swagger-client';
import { of, throwError } from 'rxjs';
import { GeneTableSelectorComponent } from './gene-table-selector.component';
import { GeneTableSelectorService } from './gene-table-selector.service';

describe('gene table selector', () => {
  const genomic = { getSpeciesApi: vi.fn(), getDataSetApi: vi.fn(), getAssemblyApi: vi.fn() };
  const repseq = { getDataSetApi: vi.fn() };
  let selections: GeneTableSelectorService;

  function create(params: object) {
    TestBed.configureTestingModule({ providers: [
      GeneTableSelectorService,
      { provide: GenomicService, useValue: genomic },
      { provide: RepseqService, useValue: repseq },
      { provide: ActivatedRoute, useValue: { params: of(params) } },
    ] });
    selections = TestBed.inject(GeneTableSelectorService);
    return TestBed.runInInjectionContext(() => new GeneTableSelectorComponent(
      TestBed.inject(GenomicService), TestBed.inject(RepseqService),
      selections, TestBed.inject(ActivatedRoute),
    ));
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('preserves same-species selections when a route selects a different locus', () => {
    const component = create({ species: 'Human', dataset: 'IGK' });
    expect(selections.selection.value).toMatchObject({
      species: 'Human', repSeqs: ['IGK'], commonDatasets: ['IGK'], assemblies: ['igh'],
    });
    component.ngOnDestroy();
  });

  it('clears species-specific data when a route selects another species', () => {
    create({ species: 'Mouse', dataset: 'IGL' });
    expect(selections.selection.value).toMatchObject({
      species: 'Mouse', datasets: [], assemblies: [], repSeqs: ['IGL'], commonDatasets: ['IGL'],
      genDatasetDescriptions: [], repDatasetDescriptions: [],
    });
  });

  it('loads datasets, waits for a route-requested locus, and publishes changed selections', () => {
    genomic.getSpeciesApi.mockReturnValue(of(['Human', 'Mouse']));
    genomic.getDataSetApi.mockReturnValue(of([{ dataset: 'IGH', description: 'Genomic' }]));
    genomic.getAssemblyApi.mockReturnValue(of([{ assembly: 'assembly1' }]));
    repseq.getDataSetApi.mockReturnValue(of([{ dataset: 'IGK', description: 'Repertoire' }]));
    const component = create({ species: 'Human', dataset: 'IGK' });
    component.updateSpecies(selections.selection.value);
    expect(genomic.getDataSetApi).toHaveBeenCalledWith('Human');
    expect(repseq.getDataSetApi).toHaveBeenCalledWith('Human');
    expect(genomic.getAssemblyApi).toHaveBeenCalledWith('Human', 'IGH');
    expect(component.commonDatasets.map(value => value.text)).toEqual(['IGH', 'IGK']);
    expect(selections.selection.value).toMatchObject({
      species: 'Human', datasets: ['IGH'], assemblies: ['assembly1'], repSeqs: ['IGK'], commonDatasets: ['IGK'],
    });
    component.singleSelectedCommon = component.commonDatasets[0];
    component.commonChange();
    expect(selections.selection.value.commonDatasets).toEqual(['IGH']);
  });

  it('exposes an API error without requesting datasets', () => {
    genomic.getSpeciesApi.mockReturnValue(throwError(() => ({ status: 400, message: 'invalid' })));
    const component = create({});
    component.ngOnInit();
    component.updateSpecies(selections.selection.value);
    expect(component.error).toEqual({ status: 400, message: 'invalid' });
    expect(component.isFetching).toBe(false);
    expect(genomic.getDataSetApi).not.toHaveBeenCalled();
  });
});
