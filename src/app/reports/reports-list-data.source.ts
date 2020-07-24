import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, BehaviorSubject, of, EMPTY} from 'rxjs';
import { ReportsService } from '../../../dist/digby-swagger-client';
import {catchError, finalize} from 'rxjs/operators';
import {GlobalReportFilterParams, ReportList} from './reports-list.model';
import {retryWithBackoff} from '../shared/retry_with_backoff';
import {MatTableDataSource} from '@angular/material/table';
import {Injectable, OnInit} from '@angular/core';
import {GeneTableSelection} from '../gene-table-selector/gene-table-selector.model';
import {GeneTableSelectorService} from '../gene-table-selector/gene-table-selector.service';

@Injectable({ providedIn: 'root'})
export class ReportsListDataSource implements DataSource<ReportList> {

    private reportListSubject = new BehaviorSubject<ReportList[]>([]);
    private globalReportFilterParamsSubject = new BehaviorSubject<GlobalReportFilterParams>(null);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string>(null);

    public globalReportFilterParams$ = this.globalReportFilterParamsSubject.asObservable();
    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();
    private geneTableServiceSubscription = null;
    private geneTableSelection: GeneTableSelection = null;

    constructor(private reportsService: ReportsService,
                private geneTableService: GeneTableSelectorService,
    ) {
      this.load();
    }

    load(): void {
      this.geneTableServiceSubscription = this.geneTableService.source
        .subscribe(
          (sel: GeneTableSelection) => {
            console.log('GeneTableSelection changed. Reloading global filters');
            this.geneTableSelection = sel;
            this.reload();
          }
        );
    }

    reload(): void {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        this.reportsService.getReportsApi(
          this.geneTableSelection.species, this.geneTableSelection.refSeqs.join(','), this.geneTableSelection.repSeqs.join(',')
        ).pipe(
          retryWithBackoff(),
          catchError(error => {
            this.errorSubject.next(error);
            return([]);
          }),
          finalize(() => {
            this.loadingSubject.next(false);
          })
        )
        .subscribe((response) => {
          const rl = [];
          const reportList = response.reports;

          for (const name of Object.keys(reportList)) {
            const el = {
              name,
              title: reportList[name].title,
              description: reportList[name].description,
              params: reportList[name].params,
              filter_params: reportList[name].filter_params,
              scope: reportList[name].scope,
              format: reportList[name].format
            };
            rl.push(el);
          }

          this.reportListSubject.next(rl);
          this.globalReportFilterParamsSubject.next(response.filters);
        });
    }

    connect(): Observable<ReportList[]> {
      return this.reportListSubject.asObservable();
    }

    disconnect(): void {
        this.reportListSubject.complete();
        this.loadingSubject.complete();
        this.errorSubject.complete();
    }

}
