import {Component, Injectable, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {ReportsListDataSource} from './reports-list-data.source';
import {ReportsService} from '../../../dist/digby-swagger-client';
import {catchError, map} from 'rxjs/operators';
import {DataSource} from '@angular/cdk/collections';
import {defer, Observable, of, Subscription} from 'rxjs';
import {ReportList} from './reports-list.model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ReportParamsDialogComponent} from './report-params-dialog/report-params-dialog.component';
import {GenSampleFilterService} from '../gen-sample/gen-sample-filter.service';
import {RepSampleFilterService} from '../rep-sample/rep-sample-filter.service';
import {GeneTableSelectorService} from '../gene-table-selector/gene-table-selector.service';
import {GeneTableSelection} from '../gene-table-selector/gene-table-selector.model';
import {ReportErrorDialogComponent} from './report-error-dialog/report-error-dialog.component';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ReportRunDialogComponent} from './report-run-dialog/report-run-dialog.component';
import {ReportRequestService} from './report-request-service';
import {ReportRunService} from './report-run.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  providers: [ReportRunService]
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
    private reportRunService: ReportRunService,
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
        if (this.reportWindow) {
          if (result.status === 'PENDING') {
            if (result.info === this.lastReportInfo) {
              this.reportWindow.document.getElementById('status_line').innerHTML =
                this.reportWindow.document.getElementById('status_line').innerHTML + '.';
            } else {
              this.reportWindow.document.getElementById('status_line').innerHTML = result.info;
              this.lastReportInfo = result.info;
            }
          } else if (result.status === 'FAILURE') {
            this.reportWindow.close();
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
    this.reportRunService.runReport(report, format, this.geneTableSelection.species,
      this.geneTableSelection.datasets, this.genSampleFilters,
      this.geneTableSelection.repSeqs, this.repSampleFilters);
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

