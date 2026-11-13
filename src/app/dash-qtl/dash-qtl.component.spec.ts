import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { DashQtlComponent } from './dash-qtl.component';
import { QtlService } from './qtl.service';

describe('QTL dashboard state', () => {
  const api = { project: null, speciesAndLoci: vi.fn(), ascs: vi.fn(), pairingVariants: vi.fn() };
  const router = { navigate: vi.fn() };
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let component: DashQtlComponent;

  function initialize(params: Record<string, string> = {}) {
    routeParams = new BehaviorSubject(convertToParamMap(params));
    TestBed.configureTestingModule({ providers: [
      { provide: QtlService, useValue: api },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { queryParamMap: routeParams, snapshot: { queryParamMap: routeParams.value } } },
    ] });
    component = new DashQtlComponent(TestBed.inject(QtlService), TestBed.inject(ActivatedRoute), TestBed.inject(Router));
    component.ngOnInit();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    api.project = null;
    api.speciesAndLoci.mockReturnValue(of({
      species: ['Human'], loci: { Human: ['IGH', 'IGK'] },
      datasets: [
        { species: 'Human', locus: 'IGH', project: 'Study A' },
        { species: 'Human', locus: 'IGK', project: 'Study B' },
      ],
    }));
    api.ascs.mockReturnValue(of({ ascs: [
      { asc: 'V1', segment: 'V', n_significant: 2, best_neglog10_p: 5 },
      { asc: 'J1', segment: 'J', n_significant: 0, best_neglog10_p: 1 },
    ] }));
    api.pairingVariants.mockReturnValue(of({
      variants: [{ variant: 'v1', gene: 'IGHV1' }, { variant: 'v2', gene: 'IGHJ1' }],
      n_variants_scanned: 20, scanned: true,
    }));
  });

  afterEach(() => component?.ngOnDestroy());

  it('restores a deep link and scopes requests to its selected project', () => {
    initialize({ species: 'Human', project: 'Study A', locus: 'IGH', view: 'gene', asc: 'V1' });
    expect(api.project).toBe('Study A');
    expect(api.ascs).toHaveBeenCalledWith('Human', 'IGH');
    expect(component.atGallery).toBe(false);
    expect(component.isOpen('gene')).toBe(true);
    expect(component.projectsFor('Human')).toEqual(['Study A', 'Study B']);
    expect(component.lociFor('Human')).toEqual(['IGH']);
    expect(component.ascsWithSignal).toBe(1);
    component.onVariantPicked({ variant: 'v1', asc: 'V1' });
    expect(component.plotSelection).toMatchObject({ species: 'Human', locus: 'IGH', asc: 'V1', variant: 'v1' });
    expect(component.chosen).toBe('v1');
    component.onRegionVariant('v2');
    expect(component.plotSelection.variant).toBe('v2');
    component.clearDrill();
    expect(component.plotSelection.variant).toBeUndefined();
  });

  it('filters gene choices and commits a unique match', () => {
    initialize();
    component.showView('gene');
    component.ascFilter = 'ighv1';
    expect(component.filteredAscs.map(asc => asc.asc)).toEqual(['V1']);
    component.onAscFilterChange();
    expect(component.selection.asc).toBe('V1');
    expect(component.segmentsPresent).toEqual(['V', 'J']);
    component.toggleSegment('J');
    expect(component.filteredAscs).toEqual([]);
    component.toggleSegment('J');
    expect(component.filteredAscs).toHaveLength(1);
  });

  it('keeps variant and gene selections separate while changing tabs and projects', () => {
    initialize();
    component.showView('variant');
    component.onVariantMapPick({ variant: 'v1' });
    component.onAscPicked('V1');
    expect(component.selection.variant).toBe('v1');
    expect(component.plotSelection.asc).toBe('V1');
    component.showView('gene');
    expect(component.plot).toBeUndefined();
    expect(component.selection.variant).toBe('v1');
    component.selection = { ...component.selection, project: 'Study B' };
    component.onProjectChange();
    expect(component.selection).toMatchObject({ locus: 'IGK', project: 'Study B' });
    expect(component.selection.variant).toBeUndefined();
    expect(api.project).toBe('Study B');
    expect(api.ascs).toHaveBeenLastCalledWith('Human', 'IGK');
  });

  it('loads and filters pairing variants and switches conditional scans', () => {
    initialize({ view: 'pairing', pairing: 'v1' });
    expect(api.pairingVariants).toHaveBeenCalledWith('Human', 'IGH', 'P(J|D)', 400);
    component.pairingFilter = 'ighj';
    expect(component.shownPairingVariants.map(v => v.variant)).toEqual(['v2']);
    component.setConditional('P(D|J)');
    expect(component.pairingVariant).toBeNull();
    expect(component.pairingAnchorSide).toBe('D');
    expect(api.pairingVariants).toHaveBeenLastCalledWith('Human', 'IGH', 'P(D|J)', 400);
    component.pickPairingVariant('v2');
    expect(component.pairingVariant).toBe('v2');
  });

  it('follows new gene links and surfaces catalogue errors', () => {
    initialize();
    routeParams.next(convertToParamMap({ locus: 'IGK', asc: 'V1' }));
    expect(component.selection).toMatchObject({ locus: 'IGK', asc: 'V1' });
    expect(component.view).toBe('gene');
    expect(api.ascs).toHaveBeenLastCalledWith('Human', 'IGK');
  });

  it('reports an empty catalogue', () => {
    api.speciesAndLoci.mockReturnValue(of({ species: [] }));
    initialize();
    expect(component.error).toBe('No guQTL results are available on this server');
    expect(api.ascs).not.toHaveBeenCalled();
  });

  it('reports failed ASC requests', () => {
    api.ascs.mockReturnValue(throwError(() => ({ error: { message: 'unavailable' } })));
    initialize();
    expect(component.error).toBe('unavailable');
    expect(component.loading).toBe(false);
  });

  it('navigates from the gallery through summary and variant drill-downs', () => {
    initialize();
    const pairing = component.galleryPanels.find(panel => panel.id === 'pairing');
    expect(component.galleryBlocked(pairing)).toBeNull();
    component.openFromGallery(component.galleryPanels.find(panel => panel.id === 'summary'));
    expect(component.viewNote).toContain('Every significant variant');
    component.onSummaryVariant({ locus: 'IGK', variant: 'v2' });
    expect(component.selection).toMatchObject({ locus: 'IGK', variant: 'v2' });
    expect(api.ascs).toHaveBeenLastCalledWith('Human', 'IGK');
    expect(component.galleryBlocked(pairing)).toContain('Only IGH');
    component.onLookupResolved({ locus: 'IGH', variant: 'v1' });
    expect(component.selection.locus).toBe('IGH');
    component.onLookupDrill({ locus: 'IGH', variant: 'v1', asc: 'V1' });
    expect(component.isPlotting).toBe(true);
    expect(component.viewNote).toContain('Usage by genotype');
    component.onSummaryGene({ locus: 'IGH', asc: 'V1' });
    expect(component.selection.asc).toBe('V1');
    component.showGallery();
    expect(component.atGallery).toBe(true);
  });

  it('clears stale choices when changing locus or species in pairing view', () => {
    initialize({ view: 'pairing', pairing: 'v1' });
    expect(component.hasProjectChoice).toBe(true);
    expect(component.projectLabel).toBe('Study A');
    component.selection = { ...component.selection, locus: 'IGK', asc: 'V1', variant: 'v1' };
    api.pairingVariants.mockReturnValue(throwError(() => ({ error: { message: 'No scan' } })));
    component.onLocusChange();
    expect(component.selection.asc).toBeUndefined();
    expect(component.selection.variant).toBeUndefined();
    expect(component.pairingError).toBe('No scan');
    component.onSpeciesChange();
    expect(component.selection).toMatchObject({ species: 'Human', project: 'Study A', locus: 'IGH' });
    expect(component.pairingVariant).toBeNull();
    expect(component.pairingLoading).toBe(false);
  });

  it('handles an old catalogue without project metadata and invalid linked genes', () => {
    api.speciesAndLoci.mockReturnValue(of({
      species: ['Human'], loci: { Human: ['IGH'] }, datasets: [{ species: 'Human', locus: 'IGH', project: null }],
    }));
    initialize({ species: 'Mouse', project: 'unknown', locus: 'IGK', asc: 'missing',
      view: 'variant', plot: 'missing', cond: 'P(D|J)' });
    expect(component.selection).toMatchObject({ species: 'Human', project: '', locus: 'IGH' });
    expect(component.selection.asc).toBeUndefined();
    expect(component.plot).toBeUndefined();
    expect(component.hasProjectChoice).toBe(false);
    expect(component.pairingConditional).toBe('P(D|J)');
    expect(component.projectsFor()).toEqual([]);
    expect(component.lociFor()).toEqual([]);
  });

  it('surfaces a catalogue failure without issuing other requests', () => {
    api.speciesAndLoci.mockReturnValue(throwError(() => ({ error: { message: 'catalogue unavailable' } })));
    initialize();
    expect(component.error).toBe('catalogue unavailable');
    expect(api.ascs).not.toHaveBeenCalled();
  });

  it('restores a pairing link without a matching variant and handles missing scan fields', () => {
    api.pairingVariants.mockReturnValue(of({}));
    initialize({ view: 'pairing', pairing: 'missing' });
    expect(component.pairingVariant).toBeNull();
    expect(component.pairingVariants).toEqual([]);
    expect(component.pairingScanned).toBe(0);
    expect(component.pairingHasScan).toBe(false);
    component.setConditional('P(J|D)');
    expect(api.pairingVariants).toHaveBeenCalledOnce();
    component.showView('gene');
    component.clearDrill();
    expect(component.viewNote).toContain('No single scan');
    component.showView('variant');
    expect(component.viewNote).toContain('Enter a variant');
  });

  it('uses catalogue loci without project metadata and keeps unknown links in the gallery', () => {
    api.speciesAndLoci.mockReturnValue(of({
      species: ['Human'], loci: { Human: ['IGH', 'IGK'] },
    }));
    initialize({ view: 'not-a-view' });

    expect(component.atGallery).toBe(true);
    expect(component.view).toBe('summary');
    expect(component.openPanelLabel).toBe('Summary of hits');
    expect(component.isOpen('summary')).toBe(false);
    expect(component.projectsFor('Human')).toEqual([]);
    expect(component.lociFor('Human')).toEqual(['IGH', 'IGK']);
    expect(component.projectLabel).toBe('');

    component.showView('variant');
    expect(component.atGallery).toBe(false);
    expect(component.openPanelLabel).toBe('Start from a variant');
    expect(component.isOpen('variant')).toBe(true);
  });

  it('ignores query links without a new gene and only refreshes ASC data when the locus moves', () => {
    initialize({ view: 'gene', locus: 'IGH', asc: 'V1' });
    expect(api.ascs).toHaveBeenCalledTimes(1);

    routeParams.next(convertToParamMap({ locus: 'IGH', asc: 'V1' }));
    routeParams.next(convertToParamMap({ locus: 'IGH' }));
    expect(api.ascs).toHaveBeenCalledTimes(1);

    routeParams.next(convertToParamMap({ locus: 'IGK', asc: 'J1' }));
    expect(component.selection).toMatchObject({ locus: 'IGK', asc: 'J1' });
    expect(component.view).toBe('gene');
    expect(api.ascs).toHaveBeenLastCalledWith('Human', 'IGK');
  });

  it('keeps variant and gene drill-downs in their respective selection fields', () => {
    initialize();
    component.showView('gene');
    component.onAscPicked('V1');
    component.onVariantPicked({ variant: 'v1' });
    expect(component.selection.asc).toBe('V1');
    expect(component.pointAsc).toBeUndefined();
    expect(component.plot).toBe('v1');
    expect(component.plotSelection).toMatchObject({ asc: 'V1', variant: 'v1' });

    component.onRegionVariant('v2');
    expect(component.plot).toBe('v2');
    expect(component.selection.variant).toBeUndefined();
    component.showView('variant');
    component.onAscPicked('J1');
    expect(component.plot).toBe('J1');
    expect(component.chosen).toBeTruthy();
    component.onRegionVariant('v3');
    expect(component.selection.variant).toBe('v3');
    expect(component.plot).toBe('J1');
  });

  it('drops linked choices missing from a refreshed ASC response', () => {
    api.ascs.mockReturnValue(of({}));
    initialize({ view: 'variant', asc: 'missing', plot: 'missing' });

    expect(component.ascs).toEqual([]);
    expect(component.selection.asc).toBeUndefined();
    expect(component.plot).toBeUndefined();
    expect(component.loading).toBe(false);
  });

  it('handles missing pairing context and uses the fallback error when a scan fails', () => {
    initialize();
    component.pairingVariants = [{ variant: 'v1' }];
    component.selection = { ...component.selection, species: undefined, locus: undefined };
    component.setConditional('P(D|J)');
    expect(component.pairingVariants).toEqual([]);
    expect(api.pairingVariants).not.toHaveBeenCalled();

    api.pairingVariants.mockReturnValue(throwError(() => ({})));
    component.selection = { ...component.selection, species: 'Human', locus: 'IGH' };
    component.showView('pairing');
    expect(component.pairingError).toBe('No partner-pairing scan is held for IGH');
    expect(component.pairingLoading).toBe(false);
    expect(component.pairingVariants).toEqual([]);
  });

  it('settles project and locus choices when the species changes', () => {
    api.speciesAndLoci.mockReturnValue(of({
      species: ['Human', 'Mouse'],
      loci: { Human: ['IGH'], Mouse: ['IGK'] },
      datasets: [
        { species: 'Human', locus: 'IGH', project: 'Study A' },
        { species: 'Human', locus: 'IGH', project: 'Study B' },
        { species: 'Human', locus: 'IGK', project: 'Study B' },
        { species: 'Mouse', locus: 'IGK', project: 'Study C' },
      ],
    }));
    initialize({ species: 'Human', project: 'Study A', locus: 'IGH', view: 'pairing' });

    component.selection = { ...component.selection, asc: 'V1', variant: 'v1' };
    component.selection = { ...component.selection, project: 'Study B' };
    component.onProjectChange();
    expect(component.selection).toMatchObject({ species: 'Human', project: 'Study B', locus: 'IGH' });
    expect(component.selection.asc).toBeUndefined();
    expect(component.selection.variant).toBeUndefined();

    component.selection = { ...component.selection, species: 'Mouse', asc: 'V1', variant: 'v1' };
    component.onSpeciesChange();
    expect(component.selection).toMatchObject({ species: 'Mouse', project: 'Study C', locus: 'IGK' });
    expect(component.selection.asc).toBeUndefined();
    expect(component.selection.variant).toBeUndefined();
    expect(api.project).toBe('Study C');
    expect(api.ascs).toHaveBeenLastCalledWith('Mouse', 'IGK');
  });

  it('leaves scans idle when the catalogue has a species but no loci', () => {
    api.speciesAndLoci.mockReturnValue(of({ species: ['Human'], loci: { Human: [] } }));
    initialize({ view: 'pairing', locus: 'IGH' });

    expect(component.selection.locus).toBeUndefined();
    expect(component.lociFor('Human')).toEqual([]);
    expect(component.ascs).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.pairingLoading).toBe(false);
    expect(api.ascs).not.toHaveBeenCalled();
    expect(api.pairingVariants).not.toHaveBeenCalled();
  });

  it('tracks loading until ASC and pairing responses arrive', () => {
    const ascResponse = new Subject<{ ascs: typeof component.ascs }>();
    const pairingResponse = new Subject<{
      variants: { variant: string; gene: string }[];
      n_variants_scanned: number;
      scanned: boolean;
    }>();
    api.ascs.mockReturnValue(ascResponse);
    api.pairingVariants.mockReturnValue(pairingResponse);
    initialize();

    expect(component.loading).toBe(true);
    ascResponse.next({ ascs: [] });
    expect(component.loading).toBe(false);
    expect(component.ascs).toEqual([]);

    component.showView('pairing');
    expect(component.pairingLoading).toBe(true);
    pairingResponse.next({
      variants: [{ variant: 'v3', gene: 'IGHV3' }],
      n_variants_scanned: 3,
      scanned: true,
    });
    expect(component.pairingLoading).toBe(false);
    expect(component.pairingVariants).toEqual([{ variant: 'v3', gene: 'IGHV3' }]);
    expect(component.pairingScanned).toBe(3);
    expect(component.pairingHasScan).toBe(true);
    ascResponse.complete();
    pairingResponse.complete();
  });

  it('uses a fallback error when the catalogue failure has no server message', () => {
    api.speciesAndLoci.mockReturnValue(throwError(() => ({})));
    initialize();
    expect(component.error).toBe('No guQTL results are available');
    expect(api.ascs).not.toHaveBeenCalled();
  });

  it('uses an ASC fallback error and clears loading after a message-less failure', () => {
    api.ascs.mockReturnValue(throwError(() => ({})));
    initialize();

    expect(component.error).toBe('Could not load the ASCs');
    expect(component.loading).toBe(false);
  });

  it('keeps same-locus searches local and refreshes after a lookup drill changes locus', () => {
    initialize({ view: 'variant', locus: 'IGH' });
    const initialAscCalls = api.ascs.mock.calls.length;
    component.onSearchVariant({ locus: 'IGH', variant: 'v1' });
    component.onLookupResolved({ locus: 'IGH', variant: 'v1' });
    expect(api.ascs).toHaveBeenCalledTimes(initialAscCalls);
    expect(component.selection.variant).toBe('v1');

    component.onLookupDrill({ locus: 'IGK', variant: 'v2', asc: 'J1' });
    expect(component.selection).toMatchObject({ locus: 'IGK', variant: 'v2' });
    expect(component.plot).toBe('J1');
    expect(component.pointAsc).toBe('J1');
    expect(api.ascs).toHaveBeenLastCalledWith('Human', 'IGK');
  });
});
