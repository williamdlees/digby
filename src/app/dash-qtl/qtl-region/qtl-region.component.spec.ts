import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QtlService } from '../qtl.service';
import { QtlRegionComponent } from './qtl-region.component';

describe('QTL region track', () => {
  const api = { region: vi.fn() };
  let component: QtlRegionComponent;
  const result = {
    contig: 'chr14', window: { start: 1000, end: 2000, centre: 1500 },
    annotation: { available: true, source: 'IMGT' },
    genes: [{ name: 'IGHV1', start: 1400, end: 1600, feature: 'gene', kind: 'gene' }],
    features: [{ name: 'IGHV1', start: 1450, end: 1550, feature: 'coding', kind: 'region' }],
    variants: [
      { variant: 'v1', pos: 1500, maf: 0.1, gene: 'IGHV1', feature: 'coding', sub_feature: 'region',
        neglog10_p: 5, significant: true, asc: 'V1', selected: true },
      { variant: 'v2', pos: 1700, maf: null, gene: null, feature: null, sub_feature: null,
        neglog10_p: 1, significant: false, asc: null, selected: false },
    ],
    thresholds: [{ analysis: 'usage', neglog10_threshold: 3 }],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    api.region.mockReturnValue(of(result));
    TestBed.configureTestingModule({ providers: [{ provide: QtlService, useValue: api }] });
    component = new QtlRegionComponent(TestBed.inject(QtlService));
    component.selection = { species: 'Human', locus: 'IGH', variant: 'v1', asc: 'V1' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, true) });
  });

  it('builds a track, gene detail, export rows and selectable neighbours', () => {
    expect(api.region).toHaveBeenCalledWith('Human', 'IGH', 'v1', 20000, 'V1', null);
    expect(component.genesInWindow).toEqual(['IGHV1']);
    expect(component.variantCount).toBe(2);
    expect(component.marks.map(mark => mark.variant)).toEqual(['v2', 'v1']);
    expect(component.thresholdY).not.toBeNull();
    expect(component.spanLabel).toBe('1.0 kb');
    expect(component.exportTable.rows[0]).toEqual(['v1', 'chr14', 1500, 5, 'yes', 'V1', 'IGHV1', 'coding', 'region', 0.1, 'yes']);
    component.showGene('IGHV1');
    expect(component.detailGeneBox.label).toBe('IGHV1');
    expect(component.detailBoxes[0].label).toBe('coding (V-REGION)');
    expect(component.detailVariantX).not.toBeNull();
    const picked = vi.fn();
    component.variantPicked.subscribe(picked);
    component.pick('v1');
    component.pick('v2');
    expect(picked).toHaveBeenCalledExactlyOnceWith('v2');
    component.closeGene();
    expect(component.detailGeneBox).toBeNull();
  });

  it('zooms, resets, and clears marks on errors', () => {
    component.zoomOut();
    expect(api.region).toHaveBeenLastCalledWith('Human', 'IGH', 'v1', 20000, 'V1', { start: 250, end: 2750 });
    expect(component.isRanged).toBe(true);
    component.setWindow('5000');
    expect(api.region).toHaveBeenLastCalledWith('Human', 'IGH', 'v1', 5000, 'V1', null);
    api.region.mockReturnValue(throwError(() => ({ error: { message: 'unavailable' } })));
    component.resetView();
    expect(component.error).toBe('unavailable');
    expect(component.isFetching).toBe(false);
    expect(component.marks).toEqual([]);
  });

  it('distinguishes a click from a brush zoom and suppresses the drag-ending click', () => {
    vi.useFakeTimers();
    try {
      const target = document.createElement('div');
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 1000 } as DOMRect);
      const capture = vi.fn();
      const release = vi.fn();
      target.setPointerCapture = capture;
      target.releasePointerCapture = release;
      const event = (clientX: number) => {
        const pointer = new MouseEvent('pointermove', { button: 0, clientX }) as PointerEvent;
        Object.defineProperties(pointer, { pointerId: { value: 1 }, currentTarget: { value: target } });
        return pointer;
      };
      const picked = vi.fn();
      component.variantPicked.subscribe(picked);
      component.onBrushStart(event(300));
      component.onBrushMove(event(302));
      component.onBrushEnd();
      component.pick('v2');
      expect(picked).toHaveBeenCalledOnce();
      expect(capture).not.toHaveBeenCalled();

      component.onBrushStart(event(200));
      component.onBrushMove(event(800));
      expect(component.brushWidth).toBeGreaterThan(0);
      expect(component.brushX).toBeLessThan(800);
      component.onBrushEnd();
      component.pick('v2');
      expect(picked).toHaveBeenCalledOnce();
      expect(capture).toHaveBeenCalledWith(1);
      expect(release).toHaveBeenCalledWith(1);
      expect(component.isRanged).toBe(true);
      expect(api.region).toHaveBeenLastCalledWith('Human', 'IGH', 'v1', 20000, 'V1',
        expect.objectContaining({ start: expect.any(Number), end: expect.any(Number) }));
      vi.runAllTimers();
      component.pick('v2');
      expect(picked).toHaveBeenCalledTimes(2);
      expect(component.exportTitle).toContain('chr14');
      expect(component.exportSource).toContain('/Human/IGH/v1');
      expect(component.exportName).toContain('v1_region');
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles sparse annotations, missing selection and gene detail outside the selected variant', () => {
    api.region.mockReturnValue(of({
      contig: 'chr1', window: { start: 100, end: 900, centre: 200 },
      annotation: { available: true },
      genes: [{ name: 'V2', start: 700, end: 800, feature: 'gene', kind: 'gene' }],
    }));
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, false) });
    expect(component.thresholdY).toBeNull();
    expect(component.variantCount).toBe(0);
    component.showGene('V2');
    expect(component.detailDistance).toBe(500);
    expect(component.detailVariantX).toBeNull();
    expect(component.detailNote).toContain('No annotated parts');
    expect(component.spanLabel).toBe('800 bp');
    component.showGene('V2');
    expect(component.detailGeneBox).toBeNull();
    component.selection = { species: 'Human' };
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, false) });
    expect(component.genesInWindow).toEqual([]);
    expect(component.marks).toEqual([]);
  });

  it('uses fallback labels for unknown annotations and a fallback gene', () => {
    component.selection = { species: 'Human', locus: 'IGH', variant: 'v1' };
    component.fallbackAsc = 'V2';
    api.region.mockReturnValue(of({
      contig: 'chr1', window: { start: 100, end: 20000, centre: 19000 },
      genes: [{ name: 'V2', start: 300, end: 400, feature: 'gene', kind: 'gene' }],
      features: [{ name: 'V2', start: 350, end: 360, feature: 'unknown', kind: 'unknown' }],
      variants: [{ variant: 'v3', pos: 1000, neglog10_p: 2, significant: true, selected: false,
        maf: 0.02, gene: null, feature: null, sub_feature: null, asc: null }],
    }));
    component.ngOnChanges({ fallbackAsc: new SimpleChange(null, 'V2', true) });
    expect(api.region).toHaveBeenLastCalledWith('Human', 'IGH', 'v1', 20000, 'V2', null);
    expect(component.spanLabel).toBe('20 kb');
    expect(component.marks[0].title).toContain('MAF 2.0%');
    expect(component.elementBoxes[0].label).toBe('unknown');
    component.showGene('V2');
    expect(component.detailDistance).toBe(18600);
    expect(component.detailVariantX).toBeNull();
    expect(component.exportTitle).toContain('tested against V2');
  });
});
