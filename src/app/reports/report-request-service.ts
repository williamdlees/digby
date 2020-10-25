import {BehaviorSubject, defer, of} from 'rxjs';
import {ReportResult} from './report-result-model';
import {ReportsService} from 'digby-swagger-client';
import {pollUntil} from '../shared/poll-until-rxjs';
import {catchError} from 'rxjs/operators';
import {ReportErrorDialogComponent} from './report-error-dialog/report-error-dialog.component';


export class ReportRequestService {
  private reportResultSubject = new BehaviorSubject<ReportResult>({ status: 'PENDING', info: '', response: null});
  public reportResult$ = this.reportResultSubject.asObservable();

  reportName: string;
  reportFormat: string;
  species: string;
  genSeqs: string;
  genFilters: string;
  repSeqs: string;
  repFilters: string;
  params: string;
  pollCount: number;

  constructor(
    private reportsService: ReportsService,
  ) {
  }

  requestReport(reportName: string, reportFormat: string, species: string, genSeqs: string, genFilters: string, repSeqs: string, repFilters: string, params: string) {
    this.reportName = reportName;
    this.reportFormat = reportFormat;
    this.species = species;
    this.genSeqs = genSeqs;
    this.genFilters = genFilters;
    this.repSeqs = repSeqs;
    this.repFilters = repFilters;
    this.params = params;

    this.fetchReport();
  }

  private fetchReport() {
    this.pollCount = 0;
    this.reportsService.getReportsRunApi(
      this.reportName,
      this.reportFormat,
      this.species,
      this.genSeqs,
      this.genFilters,
      this.repSeqs,
      this.repFilters,
      this.params).subscribe((reportResponse) => {
        const jobId = reportResponse.id;

        this.fetchReportStatus(jobId)
          .pipe(pollUntil(3000, 40, (response) => {
            console.log(response.status + ': ' + this.pollCount);
            if (response.status === 'PENDING') {
              if (response.info) {
                this.reportResultSubject.next({status: response.status, info: response.info.stage, response});
              } else {
                this.reportResultSubject.next({status: response.status, info: response.status, response});
              }
            }
            this.pollCount += 1;
            return (response.status === 'SUCCESS' || response.status === 'FAILURE');
          }))
          .subscribe((response) => {
            if (response.status === 'SUCCESS') {
              if (response.results.status === 'ok') {
                this.reportResultSubject.next({status: response.status, info: '', response});
              } else {
                this.reportResultSubject.next({status: 'FAILURE', info: response.results.description, response});
              }
            } else {
              this.reportResultSubject.next({
                status: 'FAILURE',
                info: 'return code:' + response.status + ' ' + response.description,
                response
              });
            }
          },
        (error) => {
          console.log('error: poll count exceeded', error);
          this.reportResultSubject.next({ status: 'FAILURE', info: 'Timeout waiting for report', response: null});
        });
      },
        (error) => {
          console.log('error from run request', error);
          this.reportResultSubject.next({ status: 'FAILURE', info: 'Error: ' + this.formatError(error), response: null});
          this.pollCount = 999;
        }
      );
    }

  private fetchReportStatus(jobId) {
    return defer(() =>
      this.reportsService.getReportsStatus(jobId)
    ).pipe(
      catchError(err => {
        console.log('error fetching report status', err);
        return of({status: 'FAILURE', description: this.formatError(err) });
      })
    );
  }

  private formatError(error) {
    if ('error' in error && 'message' in error.error && error.error.message) {
      return error.error.message;
    } else if ('message' in error && error.message) {
      return error.message;
    } else if ('statusText' in error && error.statusText) {
      return error.status + '. ' + error.name + ': ' + error.statusText;
    } else {
      return error.status;
    }
  }
}
