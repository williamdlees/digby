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

  it.each([
    ['IGH', 'Locus'],
    ['IGHV', 'Genes'],
    ['IGHV1', 'Family'],
  ] as const)('offers a locus map for matching %s search', async (query, type) => {
    const results = await firstValueFrom(service.search(query, 'Human'));
    expect(results.find(result => result.type === type)?.actions[0]).toMatchObject({
      route: ['/dash_refbook'], queryParams: { panel: 'sunburst', family: query },
    });
  });

  it('only offers table actions for genes not available in the reference dashboard', async () => {
    refbook.getAscsInLocusApi.mockReturnValue(of({ ascs: [] }));
    const results = await firstValueFrom(service.search('IGHV1-2', 'Human'));
    expect(results.find(result => result.type === 'Gene')?.actions.map(action => action.label))
      .toEqual(['AIRR-seq table', 'Genomic table']);
    expect(results.find(result => result.type === 'Allele')?.actions.map(action => action.label))
      .toEqual(['AIRR-seq table', 'Genomic table']);
  });

  it('reuses dataset and gene catalogues and tolerates a failed sequence source', async () => {
    genomic.getSequencesApi.mockReturnValue(throwError(() => new Error('unavailable')));
    const first = await firstValueFrom(service.search('IGHV1', 'Human'));
    const second = await firstValueFrom(service.search('IGHV1-2', 'Human'));
    expect(first.find(result => result.type === 'Gene')?.actions.map(action => action.label))
      .toEqual(['Gene overview', 'AIRR-seq table']);
    expect(second.find(result => result.type === 'Allele')).toBeDefined();
    expect(repseq.getDataSetApi).toHaveBeenCalledOnce();
    expect(genomic.getDataSetApi).toHaveBeenCalledOnce();
    expect(refbook.getAscsInLocusApi).toHaveBeenCalledOnce();
  });

  it('does not request sequences for loci absent from both catalogues', async () => {
    const results = await firstValueFrom(service.search('IGKV', 'Human'));
    expect(results).toEqual([]);
    expect(repseq.getSequencesApi).not.toHaveBeenCalled();
    expect(genomic.getSequencesApi).not.toHaveBeenCalled();
  });
});
