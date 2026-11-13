import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GenomicService, RepseqService } from 'projects/digby-swagger-client';
import { of, Subject, throwError } from 'rxjs';
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

  afterEach(() => {
    vi.useRealTimers();
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

  it('synchronizes later shared selections and stops listening after destruction', () => {
    vi.useFakeTimers();
    const component = create({});
    component.species = [{ id: 1, name: 'Human' }];
    component.selectedSpecies = component.species[0];
    component.datasets = [{ id: 1, text: 'IGH' }];
    component.selectedGen = [component.datasets[0]];
    component.repSeqs = [{ id: 1, text: 'IGH' }, { id: 2, text: 'IGK' }];
    component.selectedRep = [component.repSeqs[0]];
    component.assemblies = [{ id: 1, text: 'assembly1' }, { id: 2, text: 'assembly2' }];
    component.selectedAssembly = [component.assemblies[0]];
    component.commonDatasets = [{ id: 1, text: 'IGH' }, { id: 2, text: 'IGK' }];
    component.singleSelectedCommon = component.commonDatasets[0];
    component.selectedCommon = [component.commonDatasets[0]];
    selections.selection.next({
      species: 'Human', datasets: ['IGH'], genDatasetDescriptions: [], assemblies: ['assembly1'],
      repSeqs: ['IGH'], repDatasetDescriptions: [], commonDatasets: ['IGH'],
    });

    component.ngAfterViewInit();
    vi.advanceTimersByTime(0);
    vi.advanceTimersByTime(500);
    selections.selection.next({
      species: 'Human', datasets: ['IGH'], genDatasetDescriptions: [], assemblies: ['assembly2'],
      repSeqs: ['IGK'], repDatasetDescriptions: [], commonDatasets: ['IGK'],
    });
    vi.advanceTimersByTime(500);

    expect(component.selectedRep).toEqual([component.repSeqs[1]]);
    expect(component.selectedAssembly).toEqual([component.assemblies[1]]);
    expect(component.selectedCommon).toEqual([component.commonDatasets[1]]);

    component.ngOnDestroy();
    selections.selection.next({
      species: 'Human', datasets: ['IGH'], genDatasetDescriptions: [], assemblies: ['assembly1'],
      repSeqs: ['IGH'], repDatasetDescriptions: [], commonDatasets: ['IGH'],
    });
    vi.advanceTimersByTime(500);

    expect(component.selectedRep).toEqual([component.repSeqs[1]]);
    expect(component.selectedAssembly).toEqual([component.assemblies[1]]);
    expect(component.selectedCommon).toEqual([component.commonDatasets[1]]);
  });

  it('holds a species change until both genomic and repertoire choices have loaded', () => {
    const repertoireResponse = new Subject<{ dataset: string, description: string }[]>();
    genomic.getDataSetApi.mockReturnValue(of([{ dataset: 'MouseGene', description: 'mouse genomic' }]));
    genomic.getAssemblyApi.mockReturnValue(of([{
      assembly: 'mouse assembly', ref_seq: 'MouseGene', dataset: 'mouse assembly',
    }]));
    repseq.getDataSetApi.mockReturnValue(repertoireResponse);
    const component = create({});
    component.selectedSpecies = { id: 2, name: 'Mouse' };

    component.speciesChange();

    expect(selections.selection.value.species).toBe('Human');
    expect(component.notifiedUpdates.species).toBe(true);
    expect(genomic.getDataSetApi).toHaveBeenCalledWith('Mouse');
    expect(repseq.getDataSetApi).toHaveBeenCalledWith('Mouse');

    repertoireResponse.next([{ dataset: 'MouseAIRR', description: 'mouse repertoire' }]);
    repertoireResponse.complete();

    expect(selections.selection.value).toMatchObject({
      species: 'Mouse',
      datasets: ['MouseGene'],
      assemblies: ['mouse assembly'],
      repSeqs: ['MouseAIRR'],
    });
    expect(component.notifiedUpdates.species).toBe(false);
  });

  it('reloads assemblies only when the genomic dataset changes', () => {
    const component = create({});
    component.selectedSpecies = { id: 1, name: 'Human' };
    component.datasets = [{ id: 1, text: 'IGH' }, { id: 2, text: 'IGK' }];
    component.selectedGen = [component.datasets[0]];
    component.singleSelectedGen = component.datasets[0];
    component.selectedRep = [{ id: 1, text: 'IGH' }];
    component.selectedCommon = [{ id: 1, text: 'IGH' }];
    selections.selection.next({
      species: 'Human', datasets: ['IGH'], genDatasetDescriptions: [], assemblies: ['assembly1'],
      repSeqs: ['IGH'], repDatasetDescriptions: [], commonDatasets: ['IGH'],
    });

    component.refSeqChange();
    expect(genomic.getAssemblyApi).not.toHaveBeenCalled();

    genomic.getAssemblyApi.mockReturnValue(of([{
      assembly: 'assembly2', ref_seq: 'IGK', dataset: 'assembly2',
    }]));
    component.singleSelectedGen = component.datasets[1];
    component.refSeqChange();

    expect(genomic.getAssemblyApi).toHaveBeenCalledWith('Human', 'IGK');
    expect(selections.selection.value).toMatchObject({
      datasets: ['IGK'],
      assemblies: ['assembly2'],
      repSeqs: ['IGH'],
    });
  });

  it('clears loading state and exposes failures from dataset, assembly, and repertoire requests', () => {
    const component = create({});
    component.selectedSpecies = { id: 1, name: 'Human' };

    genomic.getDataSetApi.mockReturnValue(throwError(() => ({ status: 404, message: 'datasets unavailable' })));
    component.isFetching = true;
    component.updateGen([]);
    expect(component.error).toMatchObject({ status: 404, message: 'datasets unavailable' });
    expect(component.isFetching).toBe(false);

    genomic.getAssemblyApi.mockReturnValue(throwError(() => ({ status: 404, message: 'assemblies unavailable' })));
    component.selectedGen = [{ id: 1, text: 'IGH' }];
    component.isFetching = true;
    component.updateAssemblies([]);
    expect(component.error).toMatchObject({ status: 404, message: 'assemblies unavailable' });
    expect(component.isFetching).toBe(false);

    repseq.getDataSetApi.mockReturnValue(throwError(() => ({ status: 404, message: 'repertoire unavailable' })));
    component.isFetching = true;
    component.updateRep([]);
    expect(component.error).toMatchObject({ status: 404, message: 'repertoire unavailable' });
    expect(component.isFetching).toBe(false);
  });

  it('clears stale genomic and assembly choices when a species has no genomic datasets', () => {
    const component = create({});
    component.selectedSpecies = { id: 1, name: 'Human' };
    component.datasets = [{ id: 1, text: 'old dataset' }];
    component.selectedGen = [component.datasets[0]];
    component.assemblies = [{ id: 1, text: 'old assembly' }];
    component.selectedAssembly = [component.assemblies[0]];
    genomic.getDataSetApi.mockReturnValue(of([]));

    component.updateGen([]);

    expect(component.datasets).toEqual([]);
    expect(component.selectedGen).toEqual([]);
    expect(component.assemblies).toEqual([]);
    expect(component.selectedAssembly).toEqual([]);
    expect(genomic.getAssemblyApi).not.toHaveBeenCalled();
  });

  it('falls back to an available locus after all lists load when a requested locus is missing', () => {
    genomic.getSpeciesApi.mockReturnValue(of(['Human']));
    genomic.getDataSetApi.mockReturnValue(of([{ dataset: 'IGH', description: 'Genomic' }]));
    genomic.getAssemblyApi.mockReturnValue(of([{
      assembly: 'assembly1', ref_seq: 'IGH', dataset: 'assembly1',
    }]));
    repseq.getDataSetApi.mockReturnValue(of([{ dataset: 'IGK', description: 'Repertoire' }]));
    const component = create({ species: 'Human', dataset: 'missing-locus' });

    component.updateSpecies(selections.selection.value);

    expect(selections.selection.value).toMatchObject({
      species: 'Human',
      datasets: ['IGH'],
      assemblies: ['assembly1'],
      repSeqs: ['IGK'],
      commonDatasets: ['IGH'],
    });
    expect(component.commonDatasets.map(value => value.text)).toEqual(['IGH', 'IGK']);
  });

  it('publishes a changed repertoire choice but suppresses duplicate changes outside initialization', () => {
    const component = create({});
    component.selectedSpecies = { id: 1, name: 'Human' };
    component.repSeqs = [{ id: 1, text: 'IGH' }, { id: 2, text: 'IGK' }];
    component.singleSelectedRep = component.repSeqs[0];
    selections.selection.next({
      species: 'Human', datasets: [], genDatasetDescriptions: [], assemblies: [],
      repSeqs: ['IGH'], repDatasetDescriptions: [], commonDatasets: [],
    });
    const publish = vi.spyOn(selections.selection, 'next');

    component.repSeqChange();
    expect(publish).not.toHaveBeenCalled();

    component.singleSelectedRep = component.repSeqs[1];
    component.repSeqChange();
    expect(selections.selection.value.repSeqs).toEqual(['IGK']);
    expect(publish).toHaveBeenCalledTimes(1);

    component.initializing = true;
    component.repSeqChange();
    expect(publish).toHaveBeenCalledTimes(2);
    expect(component.initializing).toBe(false);
  });
});
