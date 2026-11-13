import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from './qtl.service';
import { QtlGenotypeCountsComponent } from './qtl-genotype-counts/qtl-genotype-counts.component';
import { QtlManhattanComponent } from './qtl-manhattan/qtl-manhattan.component';

describe('QTL plot data', () => {
  it('normalizes both genotype count response shapes, including missing classes', () => {
    const component = new QtlGenotypeCountsComponent();
    component.counts = [{ genotype: 2, n: 4 }, { genotype: 0, n: 10 }];
    component.ngOnChanges();
    expect(component.total).toBe(14);
    expect(component.plotData[0]).toMatchObject({ x: ['0/0', '0/1', '1/1'], y: [10, 0, 4] });
    component.counts = { 1: 3 };
    component.ngOnChanges();
    expect(component.total).toBe(3);
    expect(component.plotData[0]).toMatchObject({ y: [0, 3, 0] });
    component.counts = null;
    component.ngOnChanges();
    expect(component.total).toBe(0);
  });

  it('splits scan points by significance and propagates picked variants', () => {
    const api = { manhattan: vi.fn().mockReturnValue(of({
      contig: 'chr2',
      points: [
        { variant: 'v1', asc: 'A', pos: 1000000, neglog10_p: 2, significant: false },
        { variant: 'v2', asc: 'B', pos: 2500000, neglog10_p: 7, significant: true },
      ],
      thresholds: [{ analysis: 'usage', neglog10_threshold: 5, n_asc: 3 }],
    })) };
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    const component = new QtlManhattanComponent(TestBed.inject(QtlService));
    component.selection = { species: 'Human', locus: 'IGK' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.manhattan).toHaveBeenCalledWith('Human', 'IGK', undefined);
    expect(component.significantCount).toBe(1);
    expect(component.plotData).toEqual([
      expect.objectContaining({ name: 'not significant', x: [1], y: [2], customdata: [['v1', 'A']] }),
      expect.objectContaining({ name: 'significant', x: [2.5], y: [7], customdata: [['v2', 'B']] }),
    ]);
    expect(component.plotLayout).toMatchObject({
      xaxis: { title: { text: 'chr2 position (Mb)' } },
      yaxis: { title: { text: '-log10 p (best of 3 scans)' } },
      shapes: [{ y0: 5, y1: 5 }],
    });
    const picked = vi.fn();
    component.variantPicked.subscribe(picked);
    component.onPlotClick({ points: [{ customdata: ['v2', 'B'] }] });
    component.onPlotClick({ points: [] });
    expect(picked).toHaveBeenCalledOnce();
    expect(picked).toHaveBeenCalledWith({ variant: 'v2', asc: 'B' });
  });

  it('reports scan errors and does not request incomplete selections', () => {
    const api = { manhattan: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'unavailable' } }))) };
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    const component = new QtlManhattanComponent(TestBed.inject(QtlService));
    component.selection = { species: 'Human', locus: 'IGH', asc: 'A' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(component.error).toBe('unavailable');
    expect(component.isFetching).toBe(false);
    component.selection = { species: 'Human' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, false) });
    expect(api.manhattan).toHaveBeenCalledTimes(1);
    expect(component.points).toEqual([]);
  });

  it('draws a single-gene scan without a threshold and ignores invalid clicks', () => {
    const api = { manhattan: vi.fn().mockReturnValue(of({
      points: [{ variant: 'v1', asc: 'V1', pos: null, neglog10_p: 2, significant: false }],
    })) };
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    const component = new QtlManhattanComponent(TestBed.inject(QtlService));
    component.selection = { species: 'Human', locus: 'IGH', asc: 'V1' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
    expect(api.manhattan).toHaveBeenCalledWith('Human', 'IGH', 'V1');
    expect(component.ascCount).toBeNull();
    expect(component.plotData[0]).toMatchObject({ x: [0] });
    expect(component.plotLayout).toMatchObject({
      xaxis: { title: { text: 'IGH position (Mb)' } },
      yaxis: { title: { text: '-log10 p' } }, shapes: [], annotations: [],
    });
    const picked = vi.fn();
    component.variantPicked.subscribe(picked);
    component.onPlotClick({});
    component.onPlotClick({ points: [{ customdata: [] }] });
    expect(picked).not.toHaveBeenCalled();
  });
});
