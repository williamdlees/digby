/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation, ElementRef } from '@angular/core';
import {ReportsService, RepseqService} from 'projects/digby-swagger-client';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {RepSampleDataSource} from '../rep-sample-data.source';
import { FilterMode } from '../../table/filter/filter-mode.enum';
import { ColumnPredicate } from '../../table/filter/column-predicate';
import { IChoices } from '../../table/filter/ichoices';
import {BehaviorSubject, fromEvent, Observable, Subscription} from 'rxjs';
import { columnInfo } from './rep-sample-panel-cols';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RepSampleInfoComponent} from '../rep-sample-info/rep-sample-info.component';
import { RepGeneSelectedService } from '../../rep-gene-table/rep-gene-selected.service';
import { RepSampleSelectedService } from '../rep-sample-selected.service';
import {RepSampleFilterService} from '../rep-sample-filter.service';
import {ResizeEvent} from 'angular-resizable-element';
import {TableParamsStorageService} from '../../table/table-params-storage-service';
import { HttpClient } from '@angular/common/http';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {ReportRunService} from '../../reports/report-run.service';


@Component({
  selector: 'app-sample-rep-panel',
  templateUrl: './rep-sample-panel.component.html',
  styleUrls: ['./rep-sample-panel.component.css'],
  providers: [TableParamsStorageService],
  encapsulation: ViewEncapsulation.None,   // needed for css styling on mat-menu-panel
})

export class RepSamplePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  @ViewChild('searchBox', { static: true }) searchBox: ElementRef;
  dataSource: RepSampleDataSource;
  params$: Subscription;    // params for the route
  displayedColumns = ['sample_name', 'reads', 'lab_name', 'study_id', 'tissue_label', 'genotype', 'haplotypes'];
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
              private reportRunService: ReportRunService,
              private router: Router,
              private el: ElementRef,
              ) {

  }

  ngOnInit() {
    this.resizeEvents = this.tableParamsStorageService.loadSavedInfo(this.resizeEvents, 'rep-sample-table-widths');
    this.dataSource = new RepSampleDataSource(this.repseqService);
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
        .pipe(debounceTime(500)).subscribe(
          (sel: GeneTableSelection) => {
            console.log("repGeneTableSelectorComponent received selection:", sel.species, sel.datasets[0], sel.repSeqs[0]);

            this.selection = sel;
            this.onSelectedSamplesChange();
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
          if (arraysEqual(this.selectedSequenceNames, selectedNames.names)) {
            return;
          }

          this.selectedSequenceNames = selectedNames.names;
          if (this.isSelectedSamplesChecked && this.selectedSequenceNames.length === 0) {
              this.isSelectedSamplesChecked = false;
          } else if (selectedNames.onlySelected) {
              this.isSelectedSamplesChecked = true;
          }

          this.onSelectedSamplesChange();
        }
      );

      this.router.events.subscribe((val) => {
        if (val instanceof NavigationEnd) {
          //this.applyResizes();      don't think this is doing anything useful
        }
      });

      const searchOrder = {field: 'sample_name', predicates: [], sort: {field: 'sample_name', order: 'asc'}}
      this.applyFilter(searchOrder);
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
    this.repSampleFilterService.selection.next({filters: this.filters});
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
    modalRef.componentInstance.sampleName = sample.sample_name;
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
    const columnElts = this.el.nativeElement.getElementsByClassName('mat-column-' + columnName);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < columnElts.length; i++) {
      const currentEl = columnElts[i] as HTMLDivElement;
      currentEl.style.width = cssValue;
    }
  }

  sendReportRequest(report, format, params) {
    let reportParams: any;
    let sampleFilter = [];
    let repSeqs = this.selection.repSeqs;
    let title = '';
    if (report === 'rep_single_haplotype') {
      title = 'Haplotype Report';
      params = JSON.parse(params);
      sampleFilter = [{field: 'sample_name', op: 'in', value : [params.name]}];
      reportParams = {haplo_gene: params.hap_gene, sort_order: params.sort_order};
      repSeqs = params.repSeqs;
    } else if (report === 'rep_single_genotype') {
      title = 'Genotype Report';
      params = JSON.parse(params);
      sampleFilter = [{field: 'sample_name', op: 'in', value : [params.name]}];
      reportParams = {sort_order: params.sort_order};
      repSeqs = params.repSeqs;
    } else if (report === 'download_rep_data') {
      title = 'Download Data';
      reportParams = params;
      sampleFilter = this.filters;
    }

    this.reportRunService.runReport({name: report, title, filter_params: []}, format, this.selection.species,
      [], [], repSeqs, sampleFilter, reportParams);
    }
}


function difference(setA, setB) {
    const diff = new Set(setA);
    for (const elem of setB) {
        diff.delete(elem);
    }
    return diff;
}

function arraysEqual(a1, a2) {
  return a1.length === a2.length && a1.every((v) => a2.includes(v));
}
