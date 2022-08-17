import {Component, Injectable, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {ReportsListDataSource} from './reports-list-data.source';
import {ReportsService} from '../../../dist/digby-swagger-client';
import {catchError, debounceTime, map} from 'rxjs/operators';
import {DataSource} from '@angular/cdk/collections';
import {defer, Observable, of, Subscription} from 'rxjs';
import {ReportList} from './reports-list.model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {GenSampleFilterService} from '../gen-sample/gen-sample-filter.service';
import {RepSampleFilterService} from '../rep-sample/rep-sample-filter.service';
import {GeneTableSelectorService} from '../gene-table-selector/gene-table-selector.service';
import {GeneTableSelection} from '../gene-table-selector/gene-table-selector.model';
import {ReportErrorDialogComponent} from './report-error-dialog/report-error-dialog.component';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ReportRunService} from './report-run.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  @ViewChild(MatTable) table: MatTable<string>;
  displayedColumns = ['thumbnail', 'title', 'description', 'actions'];
  reportSections = null;
  geneTableServiceSubscription = null;
  geneTableSelection: GeneTableSelection = null;
  genSampleFilterSubscription = null;
  genSampleFilters = [];
  repSampleFilterSubscription = null;
  repSampleFilters = [];
  globalReportFilters = null;
  reportRequest = null;
  private reportResult$Subscription: Subscription;

  constructor(
    private modalService: NgbModal,
    private reportsService: ReportsService,
    private geneTableService: GeneTableSelectorService,
    private repSampleFilterService: RepSampleFilterService,
    private genSampleFilterService: GenSampleFilterService,
    public repListDataSource: RepOnlyDataSource,
    public genOrRepListDataSource: GenOrRepDataSource,
    private reportsListDataSource: ReportsListDataSource,
    private httpClient: HttpClient,
    private reportRunService: ReportRunService,
  ) {
      this.reportSections = [
        {source: repListDataSource, title: 'Reports using just AIRR-seq Sample Data', empty: 'Select AIRR-Seq data sets to see reports in this section'},
        {source: genOrRepListDataSource, title: 'Reports using either AIRR-Seq or genomic data, or both', empty: 'Select some data sets to see reports in this section'}
      ]
  }

  ngOnInit(): void {
    this.geneTableServiceSubscription = this.geneTableService.source
      .pipe(debounceTime(500)).subscribe(
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
  }

  ngOnDestroy(): void {
    this.geneTableServiceSubscription.unsubscribe();
    this.genSampleFilterSubscription.unsubscribe();
    this.repSampleFilterSubscription.unsubscribe();
  }

  runReport(report, format) {
    this.reportRunService.runReport(report, format, this.geneTableSelection.species,
      this.geneTableSelection.datasets, this.genSampleFilters,
      this.geneTableSelection.repSeqs, this.repSampleFilters,
      null);
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
      map(data => data.filter(item => item.scope.indexOf('rep_sample') >= 0 && !(item.scope.indexOf('gen_sample') >= 0)))
    );
  }

  disconnect(): void {
  }

}

@Injectable({ providedIn: 'any'})
export class GenOrRepDataSource  extends DataSource<any> {

  constructor(
    private reportsService: ReportsService,
    private geneTableService: GeneTableSelectorService,
    private reportsListDataSource: ReportsListDataSource
  ) {
    super();
  }

  connect(): Observable<ReportList[]> {
    return this.reportsListDataSource.connect().pipe(
      map(data => data.filter(item => item.scope.indexOf('rep_sample') >= 0 && item.scope.indexOf('gen_sample') >= 0))
    );
  }

  disconnect(): void {
  }

}

