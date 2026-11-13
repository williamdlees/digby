import { ElementRef } from '@angular/core';
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
});
