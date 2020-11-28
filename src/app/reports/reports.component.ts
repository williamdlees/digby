import {AfterViewInit, Component, Injectable, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {ReportsListDataSource} from './reports-list-data.source';
import {ReportsService} from '../../../dist/digby-swagger-client';
import {catchError, filter, flatMap, map, toArray} from 'rxjs/operators';
import {DataSource} from '@angular/cdk/collections';
import {defer, EMPTY, Observable, of, Subscription} from 'rxjs';
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
import {ReportRunDialogComponent} from './report-run-dialog/report-run-dialog.component';
import {ReportRequestService} from './report-request-service';

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
  reportRequest = null;
  reportWindow = null;
  lastReportInfo = '';
  private reportResult$Subscription: Subscription;

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
      }
    );

    this.repSampleFilterSubscription = this.repSampleFilterService.source.subscribe(
      filters => {
        this.repSampleFilters = filters.filters;
      }
    );

    this.globalReportFilterParamsSubscription = this.reportsListDataSource.globalReportFilterParams$.subscribe(
      globalReportFilters => {
        this.globalReportFilters = globalReportFilters;
      }
    );

    this.reportRequest = new ReportRequestService(this.reportsService);
    this.reportResult$Subscription = this.reportRequest.reportResult$.subscribe(
      (result) => {
        if(this.reportWindow) {
          if (result.status === 'PENDING') {
            if (result.info === this.lastReportInfo) {
              this.reportWindow.document.getElementById('status_line').innerHTML =
                this.reportWindow.document.getElementById('status_line').innerHTML + '.';
            } else {
              this.reportWindow.document.getElementById('status_line').innerHTML = result.info;
              this.lastReportInfo = result.info;
            }
          } else if (result.status === 'FAILURE') {
            this.reportWindow.close()
            this.reportWindow = null;
            this.displayError(result.info);
          } else if (result.status === 'SUCCESS') {
            this.reportWindow.location = result.response.results.url;
          }
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.geneTableServiceSubscription.unsubscribe();
    this.genSampleFilterSubscription.unsubscribe();
    this.repSampleFilterSubscription.unsubscribe();
  }

  runReport(report, format) {
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
    params = JSON.stringify(params);
    const species = this.geneTableSelection.species;
    const genSeqs = this.geneTableSelection.datasets.join(',');
    const genFilters = JSON.stringify(this.genSampleFilters);
    const repSeqs = this.geneTableSelection.repSeqs.join(',');
    const repFilters = JSON.stringify(this.repSampleFilters);

    if (format !== 'html') {
      this.sendDownloadReportRequest(report, format, species, genSeqs, genFilters, repSeqs, repFilters, params);
    } else {
      this.sendHtmlReportRequest(report, format, species, genSeqs, genFilters, repSeqs, repFilters, params)
    }
  }

  private sendDownloadReportRequest(report, format: string, species: string, genSeqs: string, genFilters: string, repSeqs: string,
                                    repFilters: string, params: string) {
    const modalRef = this.modalService.open(ReportRunDialogComponent, {size: 'm'});
    modalRef.componentInstance.report = report;
    modalRef.componentInstance.format = format;
    modalRef.componentInstance.species = species;
    modalRef.componentInstance.genSeqs = genSeqs;
    modalRef.componentInstance.genFilters = genFilters;
    modalRef.componentInstance.repSeqs = repSeqs;
    modalRef.componentInstance.repFilters = repFilters;
    modalRef.componentInstance.params = params;

    modalRef.result.then((response) => {
      if (response.status === 'SUCCESS') {
      const token = 'my JWT';
      const headers = new HttpHeaders().set('authorization', 'Bearer ' + token);
      this.httpClient.get(response.results.url, {headers, responseType: 'blob' as 'json'}).subscribe(
        (rep: any) => {
          const dataType = rep.type;
          const downloadLink = document.createElement('a');
          downloadLink.href = window.URL.createObjectURL(rep);
          downloadLink.setAttribute('download', response.results.filename);
          document.body.appendChild(downloadLink);
          downloadLink.click();
        });
      }
    });
  }


  private sendHtmlReportRequest(report, format: string, species: string, genSeqs: string, genFilters: string, repSeqs: string,
                                    repFilters: string, params: string) {
    this.reportWindow = window.open('', '_blank');

    this.reportWindow.document.write(
      '<h3>Preparing your report...</h3>' +
      '<p id="status_line"></p>'
    );

    this.reportRequest.requestReport(report.name, format, species, genSeqs, genFilters, repSeqs, repFilters, params);
  }

  private fetchReportStatus(jobId) {
    return defer(() =>
      this.reportsService.getReportsStatus(jobId)
    ).pipe(catchError(err => {console.log('error fetching report status', err); return of({status: 'FAILURE'}); }));
  }

  private showResult(response, reportWindow: Window) {
    if (!response.filename) {
      reportWindow.focus();
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

  private displayError(error) {
    const modalRef = this.modalService.open(ReportErrorDialogComponent, {size: 'm'});
    modalRef.componentInstance.report = 'Error running report';
    modalRef.componentInstance.errorMessage = error;

    modalRef.result.then();
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

