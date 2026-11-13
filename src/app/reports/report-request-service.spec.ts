import { TestBed } from '@angular/core/testing';
import { ReportsService } from 'digby-swagger-client';
import { filter, firstValueFrom, of, throwError } from 'rxjs';
import { ReportRequestService } from './report-request-service';

describe('report requests', () => {
  const api = { getReportsRunApi: vi.fn(), getReportsStatus: vi.fn() };
  let service: ReportRequestService;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: ReportsService, useValue: api }] });
    service = new ReportRequestService(TestBed.inject(ReportsService));
  });

  it('submits the selected parameters and publishes the completed result', async () => {
    api.getReportsRunApi.mockReturnValue(of({ id: 'job-1' }));
    api.getReportsStatus.mockReturnValue(of({ status: 'SUCCESS', results: { status: 'ok' } }));
    const result = firstValueFrom(service.reportResult$.pipe(filter(value => value.status === 'SUCCESS')));
    service.requestReport('report', 'pdf', 'Human', 'IGH', 'gen-filter', 'IGH', 'rep-filter', '{}');
    expect(api.getReportsRunApi).toHaveBeenCalledWith('report', 'pdf', 'Human', 'IGH', 'gen-filter', 'IGH', 'rep-filter', '{}');
    expect((await result).response).toEqual({ status: 'SUCCESS', results: { status: 'ok' } });
    expect(api.getReportsStatus).toHaveBeenCalledWith('job-1');
  });

  it('reports an error when submission fails', async () => {
    api.getReportsRunApi.mockReturnValue(throwError(() => ({ error: { message: 'invalid request' } })));
    const result = firstValueFrom(service.reportResult$.pipe(filter(value => value.status === 'FAILURE')));
    service.requestReport('report', 'pdf', 'Human', '', '', '', '', '{}');
    expect((await result).info).toBe('Error: invalid request');
    expect(api.getReportsStatus).not.toHaveBeenCalled();
  });

  it('reports a completed job whose results contain an error', async () => {
    api.getReportsRunApi.mockReturnValue(of({ id: 'job-1' }));
    api.getReportsStatus.mockReturnValue(of({
      status: 'SUCCESS', results: { status: 'error', description: 'No matching data' },
    }));
    const result = firstValueFrom(service.reportResult$.pipe(filter(value => value.status === 'FAILURE')));
    service.requestReport('report', 'pdf', 'Human', '', '', '', '', '{}');
    expect((await result).info).toBe('No matching data');
  });

  it('reports a status request failure', async () => {
    api.getReportsRunApi.mockReturnValue(of({ id: 'job-1' }));
    api.getReportsStatus.mockReturnValue(throwError(() => ({ message: 'Status unavailable' })));
    const result = firstValueFrom(service.reportResult$.pipe(filter(value => value.status === 'FAILURE')));
    service.requestReport('report', 'pdf', 'Human', '', '', '', '', '{}');
    expect((await result).info).toBe('return code:FAILURE Status unavailable');
  });

  it.each([
    [{ message: 'network error' }, 'network error'],
    [{ status: 503, name: 'HttpError', statusText: 'Unavailable' }, '503. HttpError: Unavailable'],
    [{ status: 403 }, '403'],
  ])('formats submission errors from the available details', async (error, message) => {
    api.getReportsRunApi.mockReturnValue(throwError(() => error));
    const result = firstValueFrom(service.reportResult$.pipe(filter(value => value.status === 'FAILURE')));
    service.requestReport('report', 'pdf', 'Human', '', '', '', '', '{}');
    expect((await result).info).toBe(`Error: ${message}`);
  });

  it('publishes progress while polling and then the successful result', () => {
    vi.useFakeTimers();
    try {
      api.getReportsRunApi.mockReturnValue(of({ id: 'job-1' }));
      api.getReportsStatus
        .mockReturnValueOnce(of({ status: 'PENDING', info: { stage: 'Preparing' } }))
        .mockReturnValueOnce(of({ status: 'PENDING' }))
        .mockReturnValueOnce(of({ status: 'SUCCESS', results: { status: 'ok', url: '/report' } }));
      const received: { status: string; info: string }[] = [];
      const subscription = service.reportResult$.subscribe(result => received.push(result));
      service.requestReport('report', 'html', 'Human', '', '', '', '', '{}');
      vi.advanceTimersByTime(6000);
      expect(received.map(result => [result.status, result.info])).toEqual([
        ['PENDING', ''], ['PENDING', 'Preparing'], ['PENDING', 'PENDING'], ['SUCCESS', ''],
      ]);
      expect(service.pollCount).toBe(3);
      subscription.unsubscribe();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('reports a timeout if the job never completes', () => {
    vi.useFakeTimers();
    try {
      api.getReportsRunApi.mockReturnValue(of({ id: 'job-1' }));
      api.getReportsStatus.mockReturnValue(of({ status: 'PENDING' }));
      const received: { status: string; info: string }[] = [];
      const subscription = service.reportResult$.subscribe(result => received.push(result));
      service.requestReport('report', 'html', 'Human', '', '', '', '', '{}');
      vi.advanceTimersByTime(120_000);
      expect(received[received.length - 1]).toMatchObject({
        status: 'FAILURE', info: 'Timeout waiting for report',
      });
      expect(service.pollCount).toBe(40);
      subscription.unsubscribe();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
