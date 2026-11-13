import { HttpClient } from '@angular/common/http';
import { ElementRef, SimpleChange } from '@angular/core';
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
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.resetAllMocks();
    params.next(convertToParamMap({}));
    TestBed.configureTestingModule({ providers: [
      { provide: HttpClient, useValue: http }, { provide: DashDrillService, useValue: drill },
      { provide: ActivatedRoute, useValue: { queryParamMap: params } },
    ] });
    host = document.createElement('div');
    component = TestBed.runInInjectionContext(() => new DashRefbookSunburstComponent(
      TestBed.inject(HttpClient), TestBed.inject(DashDrillService),
      new ElementRef(host), TestBed.inject(ActivatedRoute),
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

  it('fetches only when the species or locus changes and clears an incomplete selection', () => {
    http.get.mockReturnValue(of({ label: [] }));
    component.ngOnInit();
    expect(component.plotData).toEqual([]);

    const previous = component.selection;
    component.selection = { ...previous, sources: ['genomic'] };
    component.ngOnChanges({ selection: new SimpleChange(previous, component.selection, false) });
    expect(http.get).toHaveBeenCalledTimes(1);

    component.selection = { species: 'Mouse', chain: 'IGK' };
    component.ngOnChanges({ selection: new SimpleChange(previous, component.selection, false) });
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get.mock.calls[1][0]).toContain('/refbook/sunburst/Mouse/IGK');

    component.selection = { species: 'Mouse' };
    component.ngOnChanges({ selection: new SimpleChange(previous, component.selection, false) });
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(component.data).toBeNull();
    expect(component.plotData).toEqual([]);
  });

  it('focuses a segment from the route and ignores invalid plot clicks', () => {
    http.get.mockReturnValue(of({
      levels: ['locus', 'segment', 'allele'], levelStart: [0, 1, 2],
      label: ['IGH', 'V', 'IGHV1*01'], parent: [-1, 0, 1],
      novel: [0, 0, 0], nG: [1, 1, 1], nA: [1, 1, 1],
    }));
    params.next(convertToParamMap({ family: 'ighv' }));
    component.ngOnInit();
    expect(component.drilled).toBe(1);
    component.onPlotClick({});
    component.onPlotClick({ points: [{}] });
    expect(drill.drill).not.toHaveBeenCalled();
    params.next(convertToParamMap({ family: 'IGH' }));
    expect(component.isDrilled).toBe(false);
    component.openGene();
    expect(drill.drill).not.toHaveBeenCalled();
  });

  it('uses the generic error when the request provides no message', () => {
    http.get.mockReturnValue(throwError(() => ({ status: 400 })));
    component.ngOnInit();
    expect(component.error).toBe('Could not load the locus map');
    expect(component.plotData).toEqual([]);
  });

  it('centres sunburst labels while preserving their rotation', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    layer.classList.add('sunburstlayer');
    svg.appendChild(layer);
    host.appendChild(svg);
    const centre = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    centre.classList.add('slice');
    Object.defineProperty(centre, '__data__', { value: { rpx0: 0, rpx1: 10, pxmid: [0, 0] } });
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    Object.defineProperty(path, 'getBBox', { value: () => ({ x: 0, y: 0, width: 20, height: 20 }) });
    centre.appendChild(path);
    const centreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centre.appendChild(centreText);
    layer.appendChild(centre);
    const outer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outer.classList.add('slice');
    Object.defineProperty(outer, '__data__', { value: { rpx0: 10, rpx1: 20, pxmid: [20, 10] } });
    const outerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    outerText.setAttribute('transform', 'translate(0,0)rotate(10)');
    outer.appendChild(outerText);
    layer.appendChild(outer);
    const incomplete = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    incomplete.classList.add('slice');
    layer.appendChild(incomplete);

    component.centreLabels();
    expect(centreText.getAttribute('transform')).toBe('translate(10,10)');
    expect(outerText.getAttribute('transform')).toBe('translate(25,17.5)rotate(10)');
    expect(outerText.getAttribute('text-anchor')).toBe('middle');
    expect(outerText.getAttribute('dominant-baseline')).toBe('central');
  });
});
