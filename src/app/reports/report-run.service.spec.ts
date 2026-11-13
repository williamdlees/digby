import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportsService } from 'projects/digby-swagger-client';
import { BehaviorSubject } from 'rxjs';
import { ReportParamsDialogComponent } from './report-params-dialog/report-params-dialog.component';
import { ReportRunDialogComponent } from './report-run-dialog/report-run-dialog.component';
import { ReportsListDataSource } from './reports-list-data.source';
import { ReportRunService } from './report-run.service';

describe('report runner', () => {
  const modal = { open: vi.fn() };
  const filters = new BehaviorSubject({ combined: { mode: 'both' }, gen: { mode: 'gen' }, rep: { mode: 'rep' } });
  let service: ReportRunService;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      ReportRunService,
      { provide: NgbModal, useValue: modal },
      { provide: ReportsService, useValue: {} },
      { provide: ReportsListDataSource, useValue: { globalReportFilterParams$: filters } },
      { provide: HttpClient, useValue: {} },
    ] });
    service = TestBed.inject(ReportRunService);
  });

  afterEach(() => {
    service.globalReportFilterParamsSubscription.unsubscribe();
    service.reportResult$Subscription.unsubscribe();
  });

  it('passes applicable filters to the parameter dialog then prepares a download', async () => {
    const paramsDialog = { componentInstance: {}, result: Promise.resolve({ limit: 5 }) };
    const runDialog = { componentInstance: {}, result: new Promise(() => {}) };
    modal.open.mockReturnValueOnce(paramsDialog).mockReturnValueOnce(runDialog);
    const report = { name: 'sample', params: ['limit'], filter_params: true, scope: ['rep_sample'] };
    service.runReport(report, 'csv', 'Human', ['gen'], [], ['rep'], [{ field: 'gene' }], null, { limit: '2' });
    expect(modal.open).toHaveBeenNthCalledWith(1, ReportParamsDialogComponent, { size: 'm' });
    expect(paramsDialog.componentInstance).toMatchObject({
      report, initialValues: { limit: '2' }, filterParams: { mode: 'rep' },
      sampleCoverage: { genomic: ['gen'], genomicScope: 'all', AIRRSeq: ['rep'], AIRRSeqScope: 'selected' },
    });
    await Promise.resolve();
    expect(modal.open).toHaveBeenNthCalledWith(2, ReportRunDialogComponent, { size: 'm' });
    expect(runDialog.componentInstance).toMatchObject({
      report, format: 'csv', species: 'Human', genSeqs: 'gen', genFilters: '[]',
      repSeqs: 'rep', repFilters: '[{"field":"gene"}]', params: '{"limit":5}',
    });
  });

  it('skips the parameter dialog when parameters are supplied', () => {
    const dialog = { componentInstance: {}, result: new Promise(() => {}) };
    modal.open.mockReturnValue(dialog);
    service.runReport({ name: 'sample', params: ['limit'] }, 'csv', 'Mouse', [], [], [], [], { limit: 1 });
    expect(modal.open).toHaveBeenCalledOnce();
    expect(modal.open).toHaveBeenCalledWith(ReportRunDialogComponent, { size: 'm' });
    expect(dialog.componentInstance).toMatchObject({ params: '{"limit":1}', species: 'Mouse' });
  });
});
