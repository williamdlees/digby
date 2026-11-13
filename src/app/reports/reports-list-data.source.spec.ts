import { TestBed } from '@angular/core/testing';
import { ReportsService } from 'projects/digby-swagger-client';
import { firstValueFrom, of, throwError } from 'rxjs';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { ReportsListDataSource } from './reports-list-data.source';

describe('reports list data source', () => {
  const api = { getReportsApi: vi.fn() };
  let selection: GeneTableSelectorService;
  let source: ReportsListDataSource;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      GeneTableSelectorService,
      { provide: ReportsService, useValue: api },
    ] });
    selection = TestBed.inject(GeneTableSelectorService);
    source = new ReportsListDataSource(TestBed.inject(ReportsService), selection);
  });

  afterEach(() => {
    source.disconnect();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('debounces selection changes and maps reports and global filters', async () => {
    const report = {
      title: 'Title', description: 'Description', thumbnail: 'image',
      params: {}, filter_params: true, scope: ['gen_sample'], format: ['html'],
    };
    const filters = { combined: {}, gen: { gene: 'x' }, rep: {} };
    api.getReportsApi.mockReturnValue(of({ reports: { sample: report }, filters }));
    selection.selection.next({
      ...selection.selection.value, species: 'Mouse', datasets: ['one', 'two'], repSeqs: ['IGH', 'IGK'],
    });
    vi.advanceTimersByTime(499);
    expect(api.getReportsApi).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(api.getReportsApi).toHaveBeenCalledWith('Mouse', 'one,two', 'IGH,IGK');
    expect(await firstValueFrom(source.connect())).toEqual([{ name: 'sample', ...report }]);
    expect(await firstValueFrom(source.globalReportFilterParams$)).toEqual(filters);
    expect(await firstValueFrom(source.loading$)).toBe(false);
  });

  it('publishes errors and resets the error after a successful reload', async () => {
    api.getReportsApi.mockReturnValueOnce(throwError(() => ({ status: 400, message: 'invalid' })))
      .mockReturnValueOnce(of({ reports: {}, filters: null }));
    vi.advanceTimersByTime(500);
    expect(await firstValueFrom(source.error$)).toEqual({ status: 400, message: 'invalid' });
    expect(await firstValueFrom(source.loading$)).toBe(false);
    source.reload();
    expect(await firstValueFrom(source.error$)).toBeNull();
    expect(await firstValueFrom(source.connect())).toEqual([]);
    expect(api.getReportsApi).toHaveBeenCalledTimes(2);
  });
});
