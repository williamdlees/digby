/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation, ElementRef} from '@angular/core';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {GenSampleDataSource} from '../gen-sample-data.source';
import { FilterMode } from '../../table/filter/filter-mode.enum';
import { ColumnPredicate } from '../../table/filter/column-predicate';
import { IChoices } from '../../table/filter/ichoices';
import {BehaviorSubject, fromEvent, Observable, Subscription} from 'rxjs';
import { columnInfo } from './gen-sample-panel-cols';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { GenSampleInfoComponent } from '../gen-sample-info/gen-sample-info.component';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import {GenGeneSelectedService} from '../../gen-gene-table/gen-gene-selected.service';
import {GenSampleSelectedService} from '../gen-sample-selected.service';
import {GenSampleFilterService} from '../gen-sample-filter.service';
import { ResizeEvent } from 'angular-resizable-element';
import {TableParamsStorageService} from '../../table/table-params-storage-service';
import {ActivatedRoute, NavigationEnd, ParamMap, Router} from '@angular/router';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {ReportRunService} from '../../reports/report-run.service';


@Component({
  selector: 'app-gen-sample-panel',
  templateUrl: './gen-sample-panel.component.html',
  styleUrls: ['./gen-sample-panel.component.css'],
  providers: [TableParamsStorageService],
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})

export class GenSamplePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  @ViewChild('searchBox', { static: true }) searchBox: ElementRef;
  dataSource: GenSampleDataSource;
  params$: Subscription;    // params for the route

  displayedColumns = ['identifier', 'name_in_study', 'age', 'sex', 'annotation_path', 'annotation_method',
    'annotation_format', 'annotation_reference', 'study_name', 'study_date', 'study_description', 'researcher', 'reference', 'contact', 'dataset'];
  allColumns = columnInfo;
  lastLoadedColumns = [];
  paginatorSubscription = null;
  geneTableServiceSubscription = null;
  genGeneSelectedServiceSubscription = null;
  filterModeEnum = FilterMode;
  filters = [];
  sorts = [];
  choices$: Observable<IChoices>;
  choices$Subscription = null;
  loading$Subscription = null;
  selectedSequenceNames: string[] = [];
  isSelectedSamplesChecked = false;
  resizeEvents = new Map();
  clearSubject = new BehaviorSubject<null>(null);
  clear$ = this.clearSubject.asObservable();
  setFilterSubject = new BehaviorSubject<any>(null);
  setFilter$ = this.setFilterSubject.asObservable();

  constructor(private genSampleService: GenomicService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private genGeneSelectedService: GenGeneSelectedService,
              private genSampleSelectedService: GenSampleSelectedService,
              private genSampleFilterService: GenSampleFilterService,
              private tableParamsStorageService: TableParamsStorageService,
              private route: ActivatedRoute,
              private reportRunService: ReportRunService,
              private router: Router,
              ) {

  }

  ngOnInit() {
    this.resizeEvents = this.tableParamsStorageService.loadSavedInfo(this.resizeEvents, 'gen-sample-table-widths');
    this.dataSource = new GenSampleDataSource(this.genSampleService);
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
            this.selection = sel;
            this.paginator.firstPage();
            this.table.renderRows();
            this.loadSequencesPage();
          }
        );

      this.choices$Subscription = this.dataSource.choices$.subscribe(
        choices => {
          if (this.filters.length > 0 && !this.isSelectedSamplesChecked) {
            this.genSampleSelectedService.selection.next({ids: choices.names_by_dataset});
          } else {
            this.genSampleSelectedService.selection.next({ids: []});
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

      this.genGeneSelectedServiceSubscription = this.genGeneSelectedService.source.subscribe(
        selectedNames => {
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
          this.applyResizes();
        }
      });
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
    this.genSampleFilterService.selection.next({filters: this.filters});
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

    this.genSampleFilterService.selection.next({filters: this.filters});
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
      this.dataSource.loadGenSamples(this.selection.species,
        this.selection.datasets.join(),
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
    const modalRef = this.modalService.open(GenSampleInfoComponent, { size: 'xl'});
    modalRef.componentInstance.subjectName = sample.identifier;
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

  sendReportRequest(report, format, params) {
    let reportParams = {};
    const datasets = this.selection.datasets;
    let sampleFilter = {};
    let title = '';

    if (report == 'rep_single_genotype') {
      title = 'Genotype Report';
      sampleFilter = [{field: 'identifier', op: 'in', value : [params.identifier]}];
      reportParams = {sort_order: 'Locus'};
    } else if (report == 'download_gen_data') {
      title = 'Download';
      sampleFilter = this.filters;
      params.filters = this.filters;
      reportParams = params;
    }

    this.reportRunService.runReport({name: report, title, filter_params: []}, format, this.selection.species,
      datasets, sampleFilter, [], [], reportParams);
  }
}

function difference(setA, setB) {
    const diff = new Set(setA);
    for (const elem of setB) {
        diff.delete(elem);
    }
    return diff;
}
