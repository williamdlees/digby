/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation, ElementRef} from '@angular/core';
import {ReportsService, RepseqService} from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {RepSampleDataSource} from '../rep-sample-data.source';
import { FilterMode } from '../../table/filter/filter-mode.enum';
import { ColumnPredicate } from '../../table/filter/column-predicate';
import { IChoices } from '../../table/filter/ichoices';
import {BehaviorSubject, defer, EMPTY, fromEvent, Observable, Subscription} from 'rxjs';
import { columnInfo } from './rep-sample-panel-cols';
import {SeqModalComponent} from '../../seq-modal/seq-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RepSampleInfoComponent} from '../rep-sample-info/rep-sample-info.component';
import { RepGeneSelectedService } from '../../rep-gene-table/rep-gene-selected.service';
import { RepSampleSelectedService } from '../rep-sample-selected.service';
import {RepSampleFilterService} from '../rep-sample-filter.service';
import {ResizeEvent} from 'angular-resizable-element';
import {TableParamsStorageService} from '../../table/table-params-storage-service';
import {MatMenuTrigger} from '@angular/material/menu';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ReportErrorDialogComponent} from '../../reports/report-error-dialog/report-error-dialog.component';
import {pollUntil} from '../../shared/poll-until-rxjs';
import {catchError} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';


@Component({
  selector: 'app-sample-rep-panel',
  templateUrl: './rep-sample-panel.component.html',
  styleUrls: ['./rep-sample-panel.component.css'],
  providers: [TableParamsStorageService],
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})

export class RepSamplePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  @ViewChild('searchBox', { static: true }) searchBox: ElementRef;
  dataSource: RepSampleDataSource;
  params$: Subscription;    // params for the route

  displayedColumns = ['name', 'status', 'tissue', 'combined_cell_type', 'row_reads', 'sequencing_length', 'umi', 'genotypes', 'haplotypes'];
  allColumns = columnInfo;
  lastLoadedColumns = [];
  paginatorSubscription = null;
  geneTableServiceSubscription = null;
  repGeneSelectedServiceSubscription = null;
  filterModeEnum = FilterMode;
  filters = [];
  sorts = [];
  choices$: Observable<IChoices>;
  selectedSequenceNames: string[] = [];
  isSelectedSamplesChecked = false;
  choices$Subscription = null;
  loading$Subscription = null;
  resizeEvents = new Map();
  clearSubject = new BehaviorSubject<null>(null);
  clear$ = this.clearSubject.asObservable();
  setFilterSubject = new BehaviorSubject<any>(null);
  setFilter$ = this.setFilterSubject.asObservable();

  constructor(private repseqService: RepseqService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private repGeneSelectedService: RepGeneSelectedService,
              private repSampleSelectedService: RepSampleSelectedService,
              private repSampleFilterService: RepSampleFilterService,
              private tableParamsStorageService: TableParamsStorageService,
              private reportsService: ReportsService,
              private httpClient: HttpClient,
              private route: ActivatedRoute,
              ) {

  }

  ngOnInit() {
    this.resizeEvents = this.tableParamsStorageService.loadSavedInfo(this.resizeEvents, 'rep-sample-table-widths');
    this.dataSource = new RepSampleDataSource(this.repseqService);

    this.params$ = this.route.params.subscribe(params => {
      if (params.onlySelectedSamples === 'true') {
        this.isSelectedSamplesChecked = true;
        this.onSelectedSamplesChange();
      }
      else if (params.onlySelectedSamples === 'false') {
        this.isSelectedSamplesChecked = false;
        this.onSelectedSamplesChange();
      }
    });
  }

  ngOnDestroy() {
    this.paginatorSubscription.unsubscribe();
    this.geneTableServiceSubscription.unsubscribe();
    this.choices$Subscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.paginatorSubscription = this.paginator.page
      .subscribe(() => this.loadSequencesPage());

    // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .subscribe(
          (sel: GeneTableSelection) => {
            this.selection = sel;
            this.paginator.firstPage();
            this.table.renderRows();
            this.loadSequencesPage();
          }
        );


      this.choices$Subscription = this.dataSource.choices$.subscribe(
        choices => {
          if (this.filters.length > 0 && !this.isSelectedSamplesChecked) {
            this.repSampleSelectedService.selection.next({ids: choices.names_by_dataset});
          } else {
            this.repSampleSelectedService.selection.next({ids: []});
          }
        }
      );

      this.loading$Subscription = this.dataSource.loading$.subscribe(
        loading => {
          if (!loading) {
            this.applyResizes();
          }
        }
      );

      this.repGeneSelectedServiceSubscription = this.repGeneSelectedService.source.subscribe(
        selectedNames => {
          this.selectedSequenceNames = selectedNames.names;
          if (this.isSelectedSamplesChecked) {
            this.onSelectedSamplesChange();
          }
        }
      );
    });

    fromEvent(this.searchBox.nativeElement, 'keyup').pipe(
      map((event: any) => {
        return event.target.value;
      })
      // , filter(res => res.length > 2)
      , debounceTime(1000)
      , distinctUntilChanged()
      ).subscribe((text: string) => {
        this.quickSearch(text);
    });
  }

  onSelectedSamplesChange() {
    if (this.isSelectedSamplesChecked && this.selectedSequenceNames.length) {
      this.applyFilter(
        {
          field: 'allele',
          predicates: [{field: 'allele', op: 'in', value: this.selectedSequenceNames}],
          sort: {order: ''}
        });
    } else {
      this.applyFilter(
        {
          field: 'allele',
          predicates: [],
          sort: {order: ''}
        });
    }
  }

  quickSearch(searchString) {
    this.setFilterSubject.next({operator: { name: 'Includes', operands: 2, operator: 'like', prefix: '%', postfix: '%' }, op1: searchString, op2: ''});
    this.loadSequencesPage();
  }

  clearSelection() {
    this.filters = [];
    this.clearSubject.next(null);
    this.searchBox.nativeElement.value = '';
    this.loadSequencesPage();
  }

  applyFilter(columnPredicate: ColumnPredicate) {
    for (let i = this.filters.length - 1; i >= 0; i--) {
      if (this.filters[i].field === columnPredicate.field) {
        this.filters.splice(i, 1);
      }

      if (!(columnPredicate.field === 'name'
        && columnPredicate.predicates.length === 1
        &&  columnPredicate.predicates[0].op === 'like'
      // @ts-ignore
        && columnPredicate.predicates[0].value === '%' + this.searchBox.nativeElement.value + '%'
      )) {
        this.searchBox.nativeElement.value = '';
      }
    }

    for (const predicate of columnPredicate.predicates) {
      if (predicate.op) {
        this.filters.push(predicate);
      }
    }

    for (let i = this.sorts.length - 1; i >= 0; i--) {
      if (this.sorts[i].field === columnPredicate.field) {
        this.sorts.splice(i, 1);
      }
    }

    if (columnPredicate.sort.order) {
      this.sorts.push(columnPredicate.sort);
    }

    this.repSampleFilterService.selection.next({filters: this.filters});
    this.paginator.pageIndex = 0;
    this.loadSequencesPage();
  }

  updateColumnData(event: any) {
    const sLoaded = new Set(this.lastLoadedColumns);
    const sDisplayed = new Set(this.displayedColumns);

    const deleted = difference(sLoaded, sDisplayed);
    this.filters = this.filters.filter((x) => !(deleted.has(x.field)));
    this.sorts = this.sorts.filter((x) => !(deleted.has(x.field)));

    this.loadSequencesPage();
  }

  loadSequencesPage() {
    if (this.selection) {
      this.dataSource.loadRepSamples(this.selection.species,
        this.selection.repSeqs.join(),
        this.paginator.pageIndex,
        this.paginator.pageSize,
        JSON.stringify(this.filters),
        JSON.stringify(this.sorts),
        JSON.stringify(this.displayedColumns)
      );
    }

    this.lastLoadedColumns = this.displayedColumns;
  }

  showInfo(sample) {
    const modalRef = this.modalService.open(RepSampleInfoComponent, { size: 'xl'});
    modalRef.componentInstance.sampleName = sample.name;
    modalRef.componentInstance.species = this.selection.species;
    modalRef.componentInstance.dataset = sample.dataset;
  }

  onResizeEnd(event: ResizeEvent, columnName): void {
    if (event.edges.right) {
      const cssValue = event.rectangle.width + 'px';
      this.updateColumnWidth(columnName, cssValue);
      this.resizeEvents.set(columnName, cssValue);
      this.tableParamsStorageService.saveInfo(this.resizeEvents, 'rep-sample-table-widths');
    }
  }

  applyResizes(): void {
    for (const [columnName, cssValue] of this.resizeEvents) {
      this.updateColumnWidth(columnName, cssValue);
    }
  }

  updateColumnWidth(columnName: string, cssValue: string) {
    const columnElts = document.getElementsByClassName('mat-column-' + columnName);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < columnElts.length; i++) {
      const currentEl = columnElts[i] as HTMLDivElement;
      currentEl.style.width = cssValue;
    }
  }

  // this code is duplicated in the reports compnent. Really needs breaking out into a service.

  sendReportRequest(report, format, params) {
    try {
      params = JSON.parse(params);
    } catch {
      console.log('Error parsing genotype report request parameters');
      return;
    }

    const reportWindow = window.open('', '_blank');
    reportWindow.document.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" ' +
      'integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">' +
      '<h3>Running your report...</h3>' +
      '<div  class="spinner-border" role="status"> ' +
      '<span class="sr-only">Loading...</span> ' +
      '</div>');

    let reportParams = '[]';
    if (report === 'rep_single_haplotype') {
      reportParams = '{"haplo_gene":"' + params.hap_gene + '"}';
    }

    this.reportsService.getReportsRunApi(
      report,
      format,
      params.species,
      '',
      '[]',
      params.repSeqs,
      '[{"field":"name","op":"in","value":["' + params.name + '"]}]',
      reportParams
    ).subscribe((reportResponse) => {
      const jobId = reportResponse.id;

      let pollCount = 0;

      this.fetchReportStatus(jobId)
        .pipe(pollUntil(3000, 40, (response) => {
          pollCount += 1;
          return (response.status === 'SUCCESS' || response.status === 'FAILURE');
        }))
        .subscribe((response) => {
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
            this.displayError(reportWindow, report, {status: 'Timeout waiting for report'});
          }
        );
    },
      (error) => {
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


function difference(setA, setB) {
    const diff = new Set(setA);
    for (const elem of setB) {
        diff.delete(elem);
    }
    return diff;
}
