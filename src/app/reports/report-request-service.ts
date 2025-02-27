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
        this.reportResultSubject.next({status: reportResponse.status, info: '', response: reportResponse});
      },
      (error) => {
        this.reportResultSubject.next({ status: 'FAILURE', info: 'Error: ' + this.formatError(error), response: null});
        this.pollCount = 999;
      }
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
