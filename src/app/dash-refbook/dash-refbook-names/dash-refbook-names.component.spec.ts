import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RefbookService } from '../../../../projects/digby-swagger-client/api/refbook.service';
import { DashDrillService } from '../dash-drill.service';
import { DashRefbookNamesComponent } from './dash-refbook-names.component';

describe('reference allele names', () => {
  const api = { getAscsOverview: vi.fn() };
  const drill = { drill: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: RefbookService, useValue: api },
      { provide: DashDrillService, useValue: drill },
    ] });
  });

  it('shortens names, retains full names for drilling, and clears an incomplete selection', () => {
    const longName = 'IGHV1-69*01_12345_67890_12345_67890';
    api.getAscsOverview.mockReturnValue(of({ alleles: ['IGHV1*01', longName] }));
    const component = new DashRefbookNamesComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService));
    component.selection = { species: 'Human', chain: 'IGH', asc: 'V1', sources: ['airrseq'], projects: ['study'] };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.getAscsOverview).toHaveBeenCalledWith('Human', 'IGH', 'V1', 'airrseq', undefined, 'study', undefined);
    expect(component.shortenedRows).toHaveLength(1);
    expect(component.shortenedRows[0]).toMatchObject({ full: longName, differences: 4 });
    component.open(component.shortenedRows[0]);
    expect(drill.drill).toHaveBeenCalledWith('allele', longName);
    component.selection = { species: 'Human' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, false) });
    expect(component.rows).toEqual([]);
  });

  it('reports an error instead of leaving the loading indicator active', () => {
    api.getAscsOverview.mockReturnValue(throwError(() => ({ status: 400 })));
    const component = new DashRefbookNamesComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService));
    component.selection = { species: 'Human', chain: 'IGH', asc: 'V1' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(component.error).toBe('Could not load the allele names.');
    expect(component.isFetching).toBe(false);
  });
});
