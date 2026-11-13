import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportsService } from 'projects/digby-swagger-client';
import { BehaviorSubject, of } from 'rxjs';
import { ReportParamsDialogComponent } from './report-params-dialog/report-params-dialog.component';
import { ReportErrorDialogComponent } from './report-error-dialog/report-error-dialog.component';
import { ReportRunDialogComponent } from './report-run-dialog/report-run-dialog.component';
import { ReportsListDataSource } from './reports-list-data.source';
import { ReportRunService } from './report-run.service';

describe('report runner', () => {
  const modal = { open: vi.fn() };
  const api = { getReportsRunApi: vi.fn(), getReportsStatus: vi.fn() };
  const http = { get: vi.fn() };
  const filters = new BehaviorSubject({ combined: { mode: 'both' }, gen: { mode: 'gen' }, rep: { mode: 'rep' } });
  let service: ReportRunService;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      ReportRunService,
      { provide: NgbModal, useValue: modal },
      { provide: ReportsService, useValue: api },
      { provide: ReportsListDataSource, useValue: { globalReportFilterParams$: filters } },
      { provide: HttpClient, useValue: http },
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

  it.each([
    [['gen_sample'], 'gen'],
    [['gen_sample', 'rep_sample'], 'both'],
  ])('selects filters for report scope %s and stops when the dialog is cancelled', async (scope, mode) => {
    const dialog = { componentInstance: {}, result: Promise.resolve(null) };
    modal.open.mockReturnValue(dialog);
    service.runReport({ name: 'sample', params: [], filter_params: true, scope },
      'csv', 'Human', [], [{ field: 'gene' }], [], [], null);
    expect(dialog.componentInstance).toMatchObject({
      filterParams: { mode },
      sampleCoverage: { genomicScope: 'selected', AIRRSeqScope: 'all' },
    });
    await Promise.resolve();
    expect(modal.open).toHaveBeenCalledOnce();
  });

  it('downloads a successful report response', async () => {
    class TestURL extends URL {
      static createObjectURL = vi.fn(() => 'blob:report');
    }
    vi.stubGlobal('URL', TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      const dialog = {
        componentInstance: {},
        result: Promise.resolve({ status: 'SUCCESS', results: { url: '/report.csv', filename: 'report.csv' } }),
      };
      modal.open.mockReturnValue(dialog);
      http.get.mockReturnValue(of(new Blob(['data'])));
      service.runReport({ name: 'sample', params: [] }, 'csv', 'Human', [], [], [], [], null);
      await Promise.resolve();
      expect(http.get).toHaveBeenCalledWith('/report.csv', expect.objectContaining({ responseType: 'blob' }));
      const link = document.querySelector('a[download="report.csv"]');
      expect(link?.getAttribute('href')).toBe('blob:report');
      expect(click).toHaveBeenCalledOnce();
      link?.remove();
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('updates the HTML report window through pending and successful states', () => {
    vi.useFakeTimers();
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const popup = frame.contentWindow;
    const open = vi.spyOn(window, 'open').mockReturnValue(popup);
    try {
      api.getReportsRunApi.mockReturnValue(of({ id: 'job-1' }));
      api.getReportsStatus
        .mockReturnValueOnce(of({ status: 'PENDING', info: { stage: 'Preparing' } }))
        .mockReturnValueOnce(of({ status: 'PENDING', info: { stage: 'Preparing' } }))
        .mockReturnValueOnce(of({ status: 'SUCCESS', results: { status: 'ok', url: `${popup.location.href}#report` } }));
      service.runReport({ name: 'sample', params: [] }, 'html', 'Human', [], [], [], [], null);
      vi.advanceTimersByTime(0);
      expect(popup.document.getElementById('status_line')?.textContent).toBe('Preparing');
      vi.advanceTimersByTime(3000);
      expect(popup.document.getElementById('status_line')?.textContent).toBe('Preparing.');
      vi.advanceTimersByTime(3000);
      expect(popup.location.hash).toBe('#report');
    } finally {
      open.mockRestore();
      frame.remove();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('closes the HTML report window and displays a failed request', () => {
    vi.useFakeTimers();
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const popup = frame.contentWindow;
    const open = vi.spyOn(window, 'open').mockReturnValue(popup);
    const close = vi.spyOn(popup, 'close').mockImplementation(() => {});
    try {
      api.getReportsRunApi.mockReturnValue(of({ id: 'job-1' }));
      api.getReportsStatus.mockReturnValue(of({ status: 'FAILURE', description: 'No data' }));
      const dialog = { componentInstance: {}, result: Promise.resolve() };
      modal.open.mockReturnValue(dialog);
      service.runReport({ name: 'sample', params: [] }, 'html', 'Human', [], [], [], [], null);
      vi.advanceTimersByTime(0);
      expect(close).toHaveBeenCalledOnce();
      expect(modal.open).toHaveBeenCalledWith(ReportErrorDialogComponent, { size: 'm' });
      expect(dialog.componentInstance).toMatchObject({ errorMessage: 'return code:FAILURE No data' });
    } finally {
      close.mockRestore();
      open.mockRestore();
      frame.remove();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
