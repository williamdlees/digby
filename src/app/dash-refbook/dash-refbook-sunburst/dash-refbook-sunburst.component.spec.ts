import { HttpClient } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DashDrillService } from '../dash-drill.service';
import { DashRefbookSunburstComponent } from './dash-refbook-sunburst.component';

describe('reference locus sunburst', () => {
  const http = { get: vi.fn() };
  const drill = { drill: vi.fn() };
  const params = new BehaviorSubject(convertToParamMap({}));
  let component: DashRefbookSunburstComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    params.next(convertToParamMap({}));
    TestBed.configureTestingModule({ providers: [
      { provide: HttpClient, useValue: http }, { provide: DashDrillService, useValue: drill },
      { provide: ActivatedRoute, useValue: { queryParamMap: params } },
    ] });
    component = TestBed.runInInjectionContext(() => new DashRefbookSunburstComponent(
      TestBed.inject(HttpClient), TestBed.inject(DashDrillService),
      new ElementRef(document.createElement('div')), TestBed.inject(ActivatedRoute),
    ));
    component.selection = { species: 'Human', chain: 'IGH' };
  });

  it('draws the hierarchy and drills into genes and alleles', () => {
    http.get.mockReturnValue(of({
      levels: ['locus', 'gene', 'allele'], levelStart: [0, 1, 3],
      label: ['IGH', 'IGHV1', 'IGHV2', 'IGHV1*01', 'IGHV1*02', 'IGHV2*01'],
      parent: [-1, 0, 0, 1, 1, 2], novel: [1, 1, 0, 0, 1, 0], nG: [3, 2, 1, 1, 1, 1],
      nA: [1, 1, 0, 1, 0, 0],
    }));
    component.ngOnInit();
    expect(http.get.mock.calls[0][0]).toContain('/refbook/sunburst/Human/IGH');
    expect(component.plotData[0]).toMatchObject({
      type: 'sunburst', values: [3, 2, 1, 1, 1, 1], parents: ['', '0', '0', '1', '1', '2'],
    });
    component.onPlotClick({ points: [{ pointNumber: 1 }] });
    expect(component.drilledGene).toBe('IGHV1');
    expect(component.trail).toEqual([1]);
    component.openGene();
    component.onPlotClick({ points: [{ pointNumber: 3 }] });
    expect(drill.drill.mock.calls).toEqual([['gene', 'IGHV1'], ['allele', 'IGHV1*01']]);
    component.onPlotClick({ points: [{ pointNumber: 1 }] });
    expect(component.isDrilled).toBe(false);
    params.next(convertToParamMap({ family: 'IGHV2' }));
    expect(component.drilledGene).toBe('IGHV2');
  });

  it('reports an unavailable hierarchy', () => {
    http.get.mockReturnValue(throwError(() => ({ status: 400, error: { message: 'unavailable' } })));
    component.ngOnInit();
    expect(component.error).toBe('unavailable');
    expect(component.isFetching).toBe(false);
    expect(component.plotData).toEqual([]);
  });
});
