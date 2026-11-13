import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RefbookService } from '../../../../projects/digby-swagger-client/api/refbook.service';
import { DashDrillService } from '../dash-drill.service';
import { DashRefbookAlleleComponent } from './dash-refbook-allele.component';

describe('reference allele detail', () => {
  const api = {
    getAscsOverview: vi.fn(), getAscUsage: vi.fn(), getAscZygosity: vi.fn(),
    getProjects: vi.fn(), getAscAlignment: vi.fn(), getAscSeqs: vi.fn(),
  };
  const drill = { drill: vi.fn() };
  let component: DashRefbookAlleleComponent;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: RefbookService, useValue: api }, { provide: DashDrillService, useValue: drill },
    ] });
    component = new DashRefbookAlleleComponent(
      TestBed.inject(RefbookService), TestBed.inject(DashDrillService), new ElementRef(document.createElement('div')),
    );
    component.selection = { species: 'Human', chain: 'IGH', asc: 'V1', alleles: ['A'], sources: ['genomic', 'airrseq'] };
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('combines carriers from both databases without double-counting subjects', () => {
    api.getAscsOverview.mockReturnValue(of({
      alleles: ['A'], genomic_counts: [2], vdjbase_counts: [1], novel: 1, scoped: { genomic: true },
    }));
    api.getAscUsage.mockReturnValue(of({ alleles: [
      { name: 'A', usage: ['0.1', '0.3', 'bad'], samples: ['P1_s1', 'P2_s2', 'P3_s3'] },
    ] }));
    api.getAscZygosity.mockReturnValueOnce(of({ samples: [
      { name: 'P1_s1', sets: ['A', 'B'] }, { name: 'P2_s2', sets: ['A'] },
    ] })).mockReturnValueOnce(of({ samples: [
      { name: 'P1_s1', sets: ['A', 'C'] }, { name: 'P3_s3', sets: ['B'] },
    ] }));
    api.getProjects.mockReturnValue(of({ projects: [
      { name: 'P1', by_source: { genomic: 10, airrseq: 20 } }, { name: 'P2', by_source: { genomic: 5 } },
    ] }));
    api.getAscAlignment.mockReturnValue(of({ alignment: 'alignment' }));
    api.getAscSeqs.mockReturnValue(of({ alleles: [{ name: 'A', seq: 'AC', seq_gapped: 'A.C' }] }));
    component.ngOnInit();
    vi.runAllTimers();
    expect(component.isFetching).toBe(false);
    expect(component.genomicAppearances).toBe(2);
    expect(component.airrseqAppearances).toBe(1);
    expect(component.isNovel).toBe(true);
    expect(component.genomicScoped).toBe(true);
    expect(component.carriers).toBe(2);
    expect(component.aloneCount).toBe(1);
    expect(component.partners).toEqual([
      { name: 'B', samples: 1, share: 0.5 }, { name: 'C', samples: 1, share: 0.5 },
    ]);
    expect(component.usageCount).toBe(2);
    expect(component.usageMin).toBe(0.1);
    expect(component.usageMedian).toBe(0.3);
    expect(component.usageMax).toBe(0.3);
    expect(component.carrierPlot).toEqual([
      expect.objectContaining({ name: 'Genomic', x: ['P1', 'P2'], y: [1, 1] }),
      expect.objectContaining({ name: 'AIRR-seq', x: ['P1', 'P2'], y: [1, null] }),
    ]);
    expect(component.seqText()).toBe('>A\nAC');
    component.seqView = 'alignment';
    expect(component.seqText()).toBe('alignment');
    component.openPartner('B');
    component.clearAllele();
    expect(drill.drill.mock.calls).toEqual([['allele', 'B'], ['allele', 'A']]);
  });

  it('allows missing optional data and does not request disabled databases', () => {
    component.selection.sources = ['genomic'];
    api.getAscsOverview.mockReturnValue(throwError(() => new Error('offline')));
    api.getAscUsage.mockReturnValue(of({ alleles: [] }));
    api.getAscZygosity.mockReturnValue(of({ samples: [] }));
    api.getProjects.mockReturnValue(of({ projects: [] }));
    api.getAscAlignment.mockReturnValue(of({ alignment: '' }));
    api.getAscSeqs.mockReturnValue(of({ alleles: [] }));
    component.ngOnInit();
    expect(api.getAscZygosity).toHaveBeenCalledOnce();
    expect(component.genomicAppearances).toBe(0);
    expect(component.carriers).toBe(0);
    expect(component.usageMedian).toBeNull();
    expect(component.seqText()).toBe('');
  });
});
