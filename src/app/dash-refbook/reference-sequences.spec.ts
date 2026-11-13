import { HttpClient, HttpParams } from '@angular/common/http';
import { ElementRef, SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RefbookService } from '../../../projects/digby-swagger-client/api/refbook.service';
import { DashDrillService } from './dash-drill.service';
import { DashRefbookAlignmentComponent } from './dash-refbook-alignment/dash-refbook-alignment.component';
import { DashRefbookTreeComponent } from './dash-refbook-tree/dash-refbook-tree.component';

describe('reference sequence views', () => {
  const api = { getAscAlignment: vi.fn() };
  const http = { get: vi.fn() };
  const drill = { drill: vi.fn() };
  const host = new ElementRef(document.createElement('div'));

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: RefbookService, useValue: api }, { provide: HttpClient, useValue: http },
      { provide: DashDrillService, useValue: drill },
    ] });
  });

  it('builds a dendrogram and exports its merge distances', () => {
    http.get.mockReturnValue(of({
      labels: ['IGHV1*01', 'IGHV1*02', 'IGHV1*03'], order: [0, 1, 2],
      merges: [[0, 1, 2, 2], [3, 2, 4, 3]], informative_columns: [1, 4],
      duplicate_groups: [['IGHV1*01', 'IGHV1*01a']], columns: 300, gapped: true,
    }));
    const component = new DashRefbookTreeComponent(TestBed.inject(HttpClient), TestBed.inject(DashDrillService), host);
    component.selection = { species: 'Human', chain: 'IGH', asc: 'V1', sources: ['genomic'], alleles: ['IGHV1*01'] };
    component.ngOnInit();
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/refbook/asc_tree/Human/IGH/V1');
    expect((options.params as HttpParams).get('sources')).toBe('genomic');
    expect((options.params as HttpParams).get('alleles')).toBe('IGHV1*01');
    expect(component.plotData[0]).toMatchObject({ x: [0, 2, 2, 0, null, 2, 4, 4, 0, null] });
    expect(component.plotData[1]).toMatchObject({ customdata: ['IGHV1*01', 'IGHV1*02', 'IGHV1*03'] });
    expect(component.exportTable.rows).toEqual([[0, 1, 2, 2], [3, 2, 4, 3]]);
    expect(component.exportScript).toContain('[3, 2, 4, 3]');
    expect(component.columnsNote).toContain('2 of 300 IMGT-gapped positions');
    component.onPlotClick({ points: [{ customdata: 'IGHV1*02' }] });
    expect(drill.drill).toHaveBeenCalledWith('allele', 'IGHV1*02');
  });

  it('clears a failed dendrogram request', () => {
    http.get.mockReturnValue(throwError(() => ({ status: 400, error: { message: 'invalid gene' } })));
    const component = new DashRefbookTreeComponent(TestBed.inject(HttpClient), TestBed.inject(DashDrillService), host);
    component.selection = { species: 'Human', chain: 'IGH', asc: 'V1' };
    component.ngOnInit();
    expect(component.error).toBe('invalid gene');
    expect(component.tree).toBeNull();
    expect(component.plotData).toEqual([]);
    expect(component.isFetching).toBe(false);
  });

  it('handles a single ungapped allele and clears an incomplete tree selection', () => {
    http.get.mockReturnValue(of({
      labels: ['A'], order: [0], merges: [], informative_columns: [],
      duplicate_groups: [], columns: 12, gapped: false,
    }));
    const component = new DashRefbookTreeComponent(TestBed.inject(HttpClient), TestBed.inject(DashDrillService), host);
    component.selection = { species: 'Human', chain: 'IGH', asc: 'D1' };
    component.ngOnInit();
    expect(component.plotData).toEqual([]);
    expect(component.exportTable.rows).toEqual([]);
    expect(component.exportScript).toBe('');
    expect(component.columnsNote).toContain('no IMGT-gapped form');
    component.onPlotClick({});
    expect(drill.drill).not.toHaveBeenCalled();
    const previous = component.selection;
    component.selection = { species: 'Human' };
    component.ngOnChanges({ selection: new SimpleChange(previous, component.selection, false) });
    expect(component.tree).toBeNull();
    expect(component.columnsNote).toBe('');
    expect(http.get).toHaveBeenCalledOnce();
  });

  it('parses alignment rows, builds a variability profile and refetches on wrap change', () => {
    const alignment = ['      1   2', 'ref   AAA CCC', '       K', 'a1    aAA CCC', 'a2    AAA cCC'].join('\n');
    api.getAscAlignment.mockReturnValue(of({ alignment, segment: 'V', legend: { ref: 'IGHV1*01' } }));
    const component = new DashRefbookAlignmentComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService));
    component.selection = { species: 'Human', chain: 'IGH', asc: 'V1', sources: ['genomic'] };
    component.ngOnInit();
    expect(api.getAscAlignment).toHaveBeenCalledWith('Human', 'IGH', 'V1', 20, 'genomic', undefined);
    expect(component.reference).toBe('IGHV1*01');
    expect(component.profile).toEqual({
      alleles: 2, codons: [{ codon: 1, nt: 1, aa: 1 }, { codon: 2, nt: 1, aa: 0 }],
    });
    expect(component.rows[0]).toEqual({ rest: '      1   2' });
    expect(component.rows[1]).toEqual({ name: 'ref', full: 'IGHV1*01', rest: '   AAA CCC' });
    component.codonWrap = 10;
    component.onWrapChange();
    expect(api.getAscAlignment).toHaveBeenLastCalledWith('Human', 'IGH', 'V1', 10, 'genomic', undefined);
  });

  it('clears incomplete alignments and reports request errors on selection changes', () => {
    const component = new DashRefbookAlignmentComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService));
    component.selection = { species: 'Human' };
    component.ngOnInit();
    expect(api.getAscAlignment).not.toHaveBeenCalled();
    expect(component.alignment).toBe('');
    component.selection = { species: 'Human', chain: 'IGH', asc: 'J1', alleles: ['A'] };
    api.getAscAlignment.mockReturnValueOnce(of({ alignment: 'ref AAA', segment: 'J' }))
      .mockReturnValueOnce(throwError(() => ({ status: 400 })));
    component.ngOnChanges({ selection: new SimpleChange(null, component.selection, false) });
    expect(component.regions).toEqual([]);
    expect(component.regionOf(1)).toBe('');
    expect(component.reference).toBe('ref');
    expect(api.getAscAlignment).toHaveBeenCalledWith('Human', 'IGH', 'J1', 20, undefined, 'A');
    component.onWrapChange();
    expect(component.error).toBe('Could not load the alignment');
    expect(component.rows).toEqual([]);
    expect(component.isFetching).toBe(false);
  });

  it('copies and downloads the displayed alignment', () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    class TestURL extends URL {
      static createObjectURL = vi.fn(() => 'blob:alignment');
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal('URL', TestURL);
    let downloadName = '';
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });
    try {
      const component = new DashRefbookAlignmentComponent(TestBed.inject(RefbookService), TestBed.inject(DashDrillService));
      component.selection = { species: 'Rhesus Macaque', chain: 'IGH', asc: 'V1/2' };
      component.alignment = 'ref AAA';
      component.copyToClipboard();
      expect(writeText).toHaveBeenCalledWith('ref AAA');
      component.download();
      expect(click).toHaveBeenCalledOnce();
      expect(downloadName).toBe('Rhesus_Macaque_V1_2_alignment.txt');
      expect(TestURL.revokeObjectURL).toHaveBeenCalledWith('blob:alignment');
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
