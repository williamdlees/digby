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
});
