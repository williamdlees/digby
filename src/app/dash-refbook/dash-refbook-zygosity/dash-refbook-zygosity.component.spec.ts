import { ElementRef, SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as UpSetJS from '@upsetjs/bundle';
import { of, throwError } from 'rxjs';
import { RefbookService } from '../../../../projects/digby-swagger-client/api/refbook.service';
import { DashDrillService } from '../dash-drill.service';
import { DashRefbookZygosityComponent } from './dash-refbook-zygosity.component';

vi.mock('@upsetjs/bundle', async importOriginal => ({
  ...await importOriginal<typeof import('@upsetjs/bundle')>(),
  renderUpSet: vi.fn(),
}));

describe('reference zygosity plot', () => {
  const api = { getAscZygosity: vi.fn() };
  const drill = { drill: vi.fn() };
  let component: DashRefbookZygosityComponent;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: RefbookService, useValue: api }, { provide: DashDrillService, useValue: drill },
    ] });
    const host = document.createElement('div');
    const container = document.createElement('div');
    container.className = 'upset-chart';
    Object.defineProperty(container, 'clientWidth', { value: 600 });
    host.appendChild(container);
    component = new DashRefbookZygosityComponent(TestBed.inject(RefbookService),
      new ElementRef(host), TestBed.inject(DashDrillService));
    component.selection = { species: 'Human', chain: 'IGH', asc: 'V1', sources: ['genomic'] };
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('draws carrier combinations and exports the selected most-carried alleles', () => {
    api.getAscZygosity.mockReturnValue(of({ samples: [
      { name: 's1', sets: ['A', 'B'] }, { name: 's2', sets: ['A'] }, { name: 's3', sets: ['B'] },
    ] }));
    component.ngOnInit();
    vi.runAllTimers();
    expect(api.getAscZygosity).toHaveBeenCalledWith('Human', 'IGH', 'V1', undefined, undefined, undefined, 'genomic');
    expect(component.alleleCount).toBe(2);
    expect(UpSetJS.renderUpSet).toHaveBeenCalled();
    expect(component.exportTable.columns).toEqual(['alleles', 'n_alleles', 'samples']);
    expect(component.exportScript).toContain('/api/refbook/asc_zygosity/Human/IGH/V1');
    component.onTopChange(1);
    vi.runAllTimers();
    expect(component.exportTable.rows).toEqual([['A', 1, 2]]);
  });

  it('reports an API failure without drawing', () => {
    api.getAscZygosity.mockReturnValue(throwError(() => ({ status: 400 })));
    component.ngOnInit();
    expect(component.error).toBe('Failed to load zygosity data.');
    expect(component.isFetching).toBe(false);
    expect(UpSetJS.renderUpSet).not.toHaveBeenCalled();
  });

  it('fetches again when the selection changes, but not without a complete selection', () => {
    api.getAscZygosity.mockReturnValue(of({ samples: [] }));
    component.selection = { species: 'Human', chain: 'IGH' };
    component.ngOnInit();
    expect(api.getAscZygosity).not.toHaveBeenCalled();
    expect(component.exportTable.rows).toEqual([]);
    expect(component.exportScript).toBe('');

    component.selection = {
      species: 'Human', chain: 'IGH', asc: 'V2', projects: ['P1'], samples: ['S1'],
      alleles: ['A'], sources: ['airrseq'],
    };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.getAscZygosity).not.toHaveBeenCalled();
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, false) });
    expect(api.getAscZygosity).toHaveBeenCalledWith(
      'Human', 'IGH', 'V2', 'P1', 'S1', 'A', 'airrseq',
    );
    vi.runAllTimers();
    expect(UpSetJS.renderUpSet).not.toHaveBeenCalled();
  });

  it('reports rendering errors and clears the chart', () => {
    api.getAscZygosity.mockReturnValue(of({ samples: [{ name: 's1', sets: ['A'] }] }));
    vi.mocked(UpSetJS.renderUpSet).mockImplementation(() => {
      throw new Error('render failed');
    });
    component.ngOnInit();
    vi.runAllTimers();
    expect(component.error).toBe('Could not draw the plot: render failed');
    expect(component.isFetching).toBe(false);
  });

  it('keeps all allele combinations when the top limit is cleared', () => {
    api.getAscZygosity.mockReturnValue(of({ samples: [
      { name: 's1', sets: ['A', 'B'] }, { name: 's2', sets: ['B', 'C'] },
    ] }));
    component.ngOnInit();
    component.onTopChange(1);
    vi.runAllTimers();
    expect(component.exportTable.rows).toEqual([['B', 1, 2]]);
    component.onTopChange(null);
    vi.runAllTimers();
    expect(component.alleleCount).toBe(3);
    expect(component.exportTable.rows).toEqual(expect.arrayContaining([
      ['A;B', 2, 1], ['B;C', 2, 1],
    ]));
  });

  it('drills into allele labels and individual samples in the plot', () => {
    api.getAscZygosity.mockReturnValue(of({ samples: [
      { name: 'sample-1', sets: ['IGHV1*01'] },
      { name: 'sample-2', sets: ['IGHV1*02'] },
    ] }));
    component.ngOnInit();
    vi.runAllTimers();
    const options = vi.mocked(UpSetJS.renderUpSet).mock.calls[0][1];
    const click = new MouseEvent('click');
    options.onClick(options.sets[0], click, []);
    expect(drill.drill).toHaveBeenLastCalledWith('allele', 'IGHV1*01');
    if (!Array.isArray(options.combinations)) {
      throw new Error('Expected rendered combinations');
    }
    const single = options.combinations.find(combination => combination.elems.length === 1);
    options.onClick(single, click, []);
    expect(drill.drill).toHaveBeenLastCalledWith('sample', 'sample-1');
    options.onClick(null, click, []);
    expect(drill.drill).toHaveBeenCalledTimes(2);
    options.onHover(options.sets[0], click, []);
    vi.runAllTimers();
    expect(UpSetJS.renderUpSet).toHaveBeenCalledTimes(2);
  });
});
