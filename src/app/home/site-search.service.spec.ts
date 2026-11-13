import { firstValueFrom, of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { GenomicService, RefbookService, RepseqService } from 'projects/digby-swagger-client';
import { SiteSearchService } from './site-search.service';

describe('site search', () => {
  const repseq = {
    getDataSetApi: vi.fn(),
    getSequencesApi: vi.fn(),
  };
  const genomic = {
    getDataSetApi: vi.fn(),
    getSequencesApi: vi.fn(),
  };
  const refbook = { getAscsInLocusApi: vi.fn() };
  let service: SiteSearchService;

  beforeEach(() => {
    vi.resetAllMocks();
    repseq.getDataSetApi.mockReturnValue(of([{ dataset: 'IGH' }]));
    genomic.getDataSetApi.mockReturnValue(of([{ dataset: 'IGH' }]));
    repseq.getSequencesApi.mockReturnValue(of({ samples: [{ name: 'IGHV1-2*01', gene_name: 'IGHV1-2' }] }));
    genomic.getSequencesApi.mockReturnValue(of({ sequences: [{ name: 'IGHV1-2*01', gene_name: 'IGHV1-2' }] }));
    refbook.getAscsInLocusApi.mockReturnValue(of({ ascs: ['IGHV1-2'] }));
    TestBed.configureTestingModule({ providers: [
      SiteSearchService,
      { provide: RepseqService, useValue: repseq },
      { provide: GenomicService, useValue: genomic },
      { provide: RefbookService, useValue: refbook },
    ] });
    service = TestBed.inject(SiteSearchService);
  });

  it('ignores short queries and routes pasted sequences to the report', async () => {
    expect(await firstValueFrom(service.search('IG', 'Human'))).toEqual([]);
    const sequence = 'ACGT'.repeat(8);
    const results = await firstValueFrom(service.search(sequence, 'Human'));
    expect(results[0].type).toBe('Sequence');
    expect(results[0].actions[0].queryParams).toEqual({ report: 'sequence_search', sequence });
    expect(repseq.getDataSetApi).not.toHaveBeenCalled();
  });

  it('groups matching genes and alleles from both sources with navigable actions', async () => {
    const results = await firstValueFrom(service.search('IGHV1-2', 'Human'));
    const gene = results.find(result => result.type === 'Gene');
    const allele = results.find(result => result.type === 'Allele');
    expect(gene?.actions.map(action => action.label)).toEqual(['Gene overview', 'AIRR-seq table', 'Genomic table']);
    expect(allele?.actions[0].queryParams?.alleles).toBe('IGHV1-2*01');
    expect(results.find(result => result.type === 'Download')?.actions[0].queryParams)
      .toEqual({ species: 'Human', dataset: 'IGH' });
  });

  it('continues searching available datasets when one source fails', async () => {
    genomic.getDataSetApi.mockReturnValue(throwError(() => new Error('unavailable')));
    const results = await firstValueFrom(service.search('IGHV1-2', 'Human'));
    expect(results.find(result => result.type === 'Gene')?.actions.map(action => action.label))
      .toEqual(['Gene overview', 'AIRR-seq table']);
  });
});
