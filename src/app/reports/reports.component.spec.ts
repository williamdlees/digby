import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportsService } from 'projects/digby-swagger-client';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { GenSampleFilterService } from '../gen-sample/gen-sample-filter.service';
import { RepSampleFilterService } from '../rep-sample/rep-sample-filter.service';
import { ReportRunService } from './report-run.service';
import { ReportList } from './reports-list.model';
import { ReportsListDataSource } from './reports-list-data.source';
import { GenOrRepDataSource, RepOnlyDataSource, ReportsComponent } from './reports.component';

describe('reports page', () => {
  const report: ReportList = {
    name: 'sequence_search', title: 'Search', description: '', thumbnail: '',
    params: {}, filter_params: true, scope: ['rep_sample', 'gen_sample'], format: ['csv', 'html'],
  };
  const runner = { runReport: vi.fn() };
  let reports: BehaviorSubject<ReportList[]>;
  let filters: BehaviorSubject<{ combined: object; gen: object; rep: object }>;
  let component: ReportsComponent;
  let repOnly: RepOnlyDataSource;
  let combined: GenOrRepDataSource;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    reports = new BehaviorSubject<ReportList[]>([]);
    filters = new BehaviorSubject(null);
    TestBed.configureTestingModule({ providers: [
      GeneTableSelectorService, GenSampleFilterService, RepSampleFilterService,
      { provide: ReportsService, useValue: {} },
      { provide: ReportsListDataSource, useValue: { connect: () => reports.asObservable(), globalReportFilterParams$: filters } },
      { provide: ReportRunService, useValue: runner }, { provide: NgbModal, useValue: {} },
      { provide: HttpClient, useValue: {} },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({
        report: 'sequence_search', format: 'pdf', sequence: 'ACGT',
      }) } } },
    ] });
    const api = TestBed.inject(ReportsService);
    const selector = TestBed.inject(GeneTableSelectorService);
    const source = TestBed.inject(ReportsListDataSource);
    repOnly = new RepOnlyDataSource(api, selector, source);
    combined = new GenOrRepDataSource(api, selector, source);
    component = new ReportsComponent(
      TestBed.inject(NgbModal), api, selector, TestBed.inject(RepSampleFilterService),
      TestBed.inject(GenSampleFilterService), repOnly, combined, source,
      TestBed.inject(HttpClient), TestBed.inject(ReportRunService), TestBed.inject(ActivatedRoute),
    );
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('waits for report and filter data before opening a deep link', () => {
    vi.advanceTimersByTime(500);
    expect(runner.runReport).not.toHaveBeenCalled();
    reports.next([report]);
    filters.next({ combined: {}, gen: {}, rep: {} });
    vi.advanceTimersByTime(1);
    expect(runner.runReport).toHaveBeenCalledWith(
      report, 'csv', 'Human', [], [], ['IGH'], [], null, { sequence: 'ACGT' },
    );
    component.runReport(report, 'html');
    expect(runner.runReport).toHaveBeenLastCalledWith(report, 'html', 'Human', [], [], ['IGH'], [], null);
  });

  it('partitions reports by their declared sample scopes', async () => {
    reports.next([
      report, { ...report, name: 'rep', scope: ['rep_sample'] },
      { ...report, name: 'gen', scope: ['gen_sample'] },
    ]);
    expect((await firstValueFrom(repOnly.connect())).map(item => item.name)).toEqual(['rep']);
    expect((await firstValueFrom(combined.connect())).map(item => item.name)).toEqual(['sequence_search']);
  });
});
