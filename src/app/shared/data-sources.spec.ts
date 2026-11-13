import { CollectionViewer } from '@angular/cdk/collections';
import { TestBed } from '@angular/core/testing';
import { GenomicService, RepseqService } from 'projects/digby-swagger-client';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { GeneSequenceDataSource } from '../gen-gene-table/gene-sequence.datasource';
import { GenSampleDataSource } from '../gen-sample/gen-sample-data.source';
import { RepSequenceDataSource } from '../rep-gene-table/rep-sequence.datasource';
import { RepSampleDataSource } from '../rep-sample/rep-sample-data.source';

describe('table data sources', () => {
  const genomic = { getSubjectsApi: vi.fn(), getSequencesApi: vi.fn() };
  const repseq = { getSamplesApi: vi.fn(), getSequencesApi: vi.fn() };
  const viewer: CollectionViewer = { viewChange: of({ start: 0, end: 10 }) };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: GenomicService, useValue: genomic },
      { provide: RepseqService, useValue: repseq },
    ] });
  });

  it('loads genomic samples and resets rows when a required selection is absent', async () => {
    const response = new Subject<{ total_items: number; uniques: object; samples: object[] }>();
    genomic.getSubjectsApi.mockReturnValue(response);
    const source = new GenSampleDataSource(TestBed.inject(GenomicService));
    const loading: boolean[] = [];
    source.loading$.subscribe(value => loading.push(value));

    source.loadGenSamples('Human', 'dataset', 2, 20, 'filter', 'sort', 'cols');
    expect(genomic.getSubjectsApi).toHaveBeenCalledWith('Human', 'dataset', 2, 20, 'filter', 'sort', 'cols');
    expect(loading).toEqual([false, true]);
    response.next({ total_items: 1, uniques: { country: ['UK'] }, samples: [{ id: 'one' }] });
    response.complete();
    expect(await firstValueFrom(source.connect(viewer))).toEqual([{ id: 'one' }]);
    expect(await firstValueFrom(source.choices$)).toEqual({ country: ['UK'] });
    expect(source.totalItems).toBe(1);
    expect(loading).toEqual([false, true, false]);

    source.loadGenSamples('', 'dataset', 0, 20, '', '', '');
    expect(await firstValueFrom(source.connect(viewer))).toEqual([]);
    expect(source.totalItems).toBe(0);
    source.disconnect(viewer);
  });

  it('maps test repertoire sequences and exposes server errors without retrying client errors', async () => {
    repseq.getSamplesApi.mockReturnValueOnce(of({ total_items: 1, uniques: {}, samples: [{ id: 'one' }] }))
      .mockReturnValueOnce(throwError(() => ({ status: 400, message: 'invalid filter' })));
    const source = new RepSampleDataSource(TestBed.inject(RepseqService));
    source.loadRepSamples('Human', 'Test,IGK', 0, 10, 'filter', '', '');
    expect(repseq.getSamplesApi).toHaveBeenCalledWith('Human', 'IGH,IGK', 0, 10, 'filter', '', '');
    expect(await firstValueFrom(source.connect(viewer))).toEqual([{ id: 'one' }]);
    source.loadRepSamples('Human', 'IGH', 0, 10, 'bad', '', '');
    expect(await firstValueFrom(source.error$)).toEqual({ status: 400, message: 'invalid filter' });
    expect(await firstValueFrom(source.loading$)).toBe(false);
    expect(repseq.getSamplesApi).toHaveBeenCalledTimes(2);
    source.disconnect(viewer);
  });

  it('updates genomic sequence rows and optional columns asynchronously', async () => {
    vi.useFakeTimers();
    try {
      genomic.getSequencesApi.mockReturnValueOnce(of({
        total_items: 1, uniques: { gene: ['A'] }, sequences: [{ gene: 'A' }], extra_cols: [{ name: 'extra' }],
      })).mockReturnValueOnce(of({ total_items: 0, uniques: {}, sequences: [] }));
      const source = new GeneSequenceDataSource(TestBed.inject(GenomicService));
      source.loadGeneSequences('Human', 'Test', 1, 25, 'filter', 'sort', 'cols');
      expect(genomic.getSequencesApi).toHaveBeenCalledWith('Human', 'IGH', 1, 25, 'filter', 'sort', 'cols');
      expect(await firstValueFrom(source.extraCols$)).toEqual([{ name: 'extra' }]);
      vi.advanceTimersByTime(50);
      expect(await firstValueFrom(source.connect(viewer))).toEqual([{ gene: 'A' }]);
      expect(await firstValueFrom(source.loading$)).toBe(false);
      source.loadGeneSequences('Human', 'IGH', 0, 25, '', '', '');
      vi.advanceTimersByTime(50);
      expect(await firstValueFrom(source.extraCols$)).toEqual([]);
      expect(await firstValueFrom(source.connect(viewer))).toEqual([]);
      source.disconnect(viewer);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('loads repertoire sequence rows with translated selection and clears missing data', async () => {
    vi.useFakeTimers();
    try {
      repseq.getSequencesApi.mockReturnValueOnce(of({
        total_items: 1, uniques: {}, samples: [{ gene: 'A' }], extra_cols: ['extra'],
      })).mockReturnValueOnce(of({ total_items: 0, uniques: {} }));
      const source = new RepSequenceDataSource(TestBed.inject(RepseqService));
      source.loadRepSequences('Human', 'Test,IGK', 'filter', 'sort', 1, 25, 'cols');
      expect(repseq.getSequencesApi).toHaveBeenCalledWith('Human', 'IGH,IGK', 1, 25, 'filter', 'sort', 'cols');
      vi.advanceTimersByTime(50);
      expect(await firstValueFrom(source.connect(viewer))).toEqual([{ gene: 'A' }]);
      expect(await firstValueFrom(source.extraCols$)).toEqual(['extra']);
      source.loadRepSequences('Human', 'IGH', '', '', 0, 25, '');
      vi.advanceTimersByTime(50);
      expect(await firstValueFrom(source.connect(viewer))).toEqual([]);
      source.disconnect(viewer);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
