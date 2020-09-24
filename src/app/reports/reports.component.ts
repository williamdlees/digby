import {AfterViewInit, Component, Injectable, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {ReportsListDataSource} from './reports-list-data.source';
import {ReportsService} from '../../../dist/digby-swagger-client';
import {catchError, filter, flatMap, map, toArray} from 'rxjs/operators';
import {DataSource} from '@angular/cdk/collections';
import {defer, EMPTY, Observable} from 'rxjs';
import {ReportList} from './reports-list.model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ReportParamsDialogComponent} from './report-params-dialog/report-params-dialog.component';
import {GenSampleFilterService} from '../gen-sample/gen-sample-filter.service';
import {RepSampleFilterService} from '../rep-sample/rep-sample-filter.service';
import {environment} from '../../environments/environment';
import {GeneTableSelectorService} from '../gene-table-selector/gene-table-selector.service';
import {GeneTableSelection} from '../gene-table-selector/gene-table-selector.model';
import {ReportErrorDialogComponent} from './report-error-dialog/report-error-dialog.component';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { pollUntil } from '../shared/poll-until-rxjs';
import {ajax} from 'rxjs/ajax';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
  @ViewChild(MatTable) table: MatTable<string>;
  displayedColumns = ['thumbnail', 'title', 'description', 'actions'];
  geneTableServiceSubscription = null;
  geneTableSelection: GeneTableSelection = null;
  genSampleFilterSubscription = null;
  genSampleFilters = [];
  repSampleFilterSubscription = null;
  globalReportFilterParamsSubscription = null;
  repSampleFilters = [];
  globalReportFilters = null;

  constructor(
    private modalService: NgbModal,
    private reportsService: ReportsService,
    private geneTableService: GeneTableSelectorService,
    private repSampleFilterService: RepSampleFilterService,
    private genSampleFilterService: GenSampleFilterService,
    public repListDataSource: RepOnlyDataSource,
    private reportsListDataSource: ReportsListDataSource,
    private httpClient: HttpClient,
  ) {
  }

  ngOnInit(): void {
    this.geneTableServiceSubscription = this.geneTableService.source
      .subscribe(
        (sel: GeneTableSelection) => {
          this.geneTableSelection = sel;
        }
      );

    this.genSampleFilterSubscription = this.genSampleFilterService.source.subscribe(
      filters => {
        this.genSampleFilters = filters.filters;
        console.log('genSampleFilter length: ' + this.genSampleFilters.length);
      }
    );

    this.repSampleFilterSubscription = this.repSampleFilterService.source.subscribe(
      filters => {
        this.repSampleFilters = filters.filters;
        console.log('repSampleFilter length: ' + this.repSampleFilters.length);
      }
    );

    this.globalReportFilterParamsSubscription = this.reportsListDataSource.globalReportFilterParams$.subscribe(
      globalReportFilters => {
        this.globalReportFilters = globalReportFilters;
      }
    );
  }

  ngOnDestroy(): void {
    this.geneTableServiceSubscription.unsubscribe();
    this.genSampleFilterSubscription.unsubscribe();
    this.repSampleFilterSubscription.unsubscribe();
  }

  runReport(report, format) {
    console.log('Run report: ' + report.name + ' to ' + format);

    if (report.params.length > 0 || report.filter_params) {
      const modalRef = this.modalService.open(ReportParamsDialogComponent, {size: 'm'});
      modalRef.componentInstance.report = report;

      let filterParams = null;

      if (report.filter_params) {
        if (report.scope.length > 1) {
          filterParams = this.globalReportFilters.combined;
        } else if (report.scope.indexOf('rep_sample') >= 0) {
          filterParams = this.globalReportFilters.rep;
        } else {
          filterParams = this.globalReportFilters.gen;
        }
      }

      modalRef.componentInstance.filterParams = filterParams;

      modalRef.result.then((result) => {
        if (result) {
          this.sendReportRequest(report, format, result);
        }
      }, () => {
      });
    } else {
      this.sendReportRequest(report, format, {});
    }
  }


  private sendReportRequest(report, format, params) {
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" ' +
      'integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">' +
      '<h3>Running your report...</h3>' +
      '<div  class="spinner-border" role="status"> ' +
      '<span class="sr-only">Loading...</span> ' +
      '</div>');

    this.reportsService.getReportsRunApi(
      report.name,
      format,
      this.geneTableSelection.species,
      this.geneTableSelection.refSeqs.join(','),
      JSON.stringify(this.genSampleFilters),
      this.geneTableSelection.repSeqs.join(','),
      JSON.stringify(this.repSampleFilters),
      JSON.stringify(params)
    ).subscribe((reportResponse) => {
      const jobId = reportResponse.id;
      console.log('job id:' + jobId);

      let pollCount = 0;

      this.fetchReportStatus(jobId)
        .pipe(pollUntil(3000, 20, (response) => {
          console.log(response.status + ': ' + pollCount);
          pollCount += 1;
          return (response.status === 'SUCCESS' || response.status === 'FAILURE');
        }))
        .subscribe((response) => {
            console.log('status: ' + response.status);
            if (response.status === 'SUCCESS') {
              if (response.results.status === 'ok') {
                this.showResult(response.results, reportWindow);
              } else {
                this.displayError(reportWindow, report, {status: response.results.description});
              }
            } else {
              this.displayError(reportWindow, report, 'return code:' + response.status + ' ' + response.description);
            }
          },
          (error) => {
            console.log('error: poll count exceeded');
            this.displayError(reportWindow, report, {status: 'Timeout waiting for report'});
          }
        );
    },
      (error) => {
        console.log('error from run request');
        this.displayError(reportWindow, report, error);
      }
    );
  }

  private fetchReportStatus(jobId) {
    return defer(() =>
      this.reportsService.getReportsStatus(jobId)
    ).pipe(catchError(() => EMPTY));
  }

  private showResult(response, reportWindow: Window) {
    if (!response.filename) {
      reportWindow.location = response.url;
    } else {
      reportWindow.close();
      const token = 'my JWT';
      const headers = new HttpHeaders().set('authorization', 'Bearer ' + token);
      this.httpClient.get(response.url, {headers, responseType: 'blob' as 'json'}).subscribe(
        (rep: any) => {
          const dataType = rep.type;
          const downloadLink = document.createElement('a');
          downloadLink.href = window.URL.createObjectURL(rep);
          downloadLink.setAttribute('download', response.filename);
          document.body.appendChild(downloadLink);
          downloadLink.click();
        });
    }
  }

  private displayError(reportWindow: Window, report, error) {
    reportWindow.close();
    const modalRef = this.modalService.open(ReportErrorDialogComponent, {size: 'm'});
    modalRef.componentInstance.report = 'Error running ' + report.title;

    if ('error' in error && 'message' in error.error && error.error.message) {
      modalRef.componentInstance.errorMessage = error.error.message;
    } else if ('statusText' in error && error.statusText) {
      modalRef.componentInstance.errorMessage = error.status + '. ' + error.name + ': ' + error.statusText;
    } else {
      modalRef.componentInstance.errorMessage = error.status;
    }

    modalRef.result.then(
      (result) => {
      },
      () => {
      }
    );
  }
}

@Injectable({ providedIn: 'any'})
export class RepOnlyDataSource  extends DataSource<any> {

  constructor(
    private reportsService: ReportsService,
    private geneTableService: GeneTableSelectorService,
    private reportsListDataSource: ReportsListDataSource
  ) {
    super();
  }

  connect(): Observable<ReportList[]> {
    return this.reportsListDataSource.connect().pipe(
      map(data => data.filter(item => item.scope.indexOf('rep_sample') >= 0))
    );
  }

  disconnect(): void {
  }

}

