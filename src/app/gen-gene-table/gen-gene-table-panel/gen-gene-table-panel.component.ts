/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation, ElementRef} from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SeqModalComponent} from '../../seq-modal/seq-modal.component';
import {GeneSequenceDataSource} from '../gene-sequence.datasource';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {columnInfo} from './gene-table-panel-cols';
import {FilterMode} from '../../table/filter/filter-mode.enum';
import {BehaviorSubject, fromEvent, Observable} from 'rxjs';
import {IChoices} from '../../table/filter/ichoices';
import {ColumnPredicate} from '../../table/filter/column-predicate';
import { GenGeneSelectedService } from '../gen-gene-selected.service'
import {GenSampleSelectedService} from '../../gen-sample/gen-sample-selected.service';
import { ResizeEvent } from 'angular-resizable-element';
import { TableParamsStorageService } from '../../table/table-params-storage-service';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {NavigationEnd, Router} from '@angular/router';
import {ReportRunService} from '../../reports/report-run.service';


@Component({
  selector: 'app-gene-table-panel',
  templateUrl: './gen-gene-table-panel.component.html',
  styleUrls: ['./gen-gene-table-panel.component.css'],
  encapsulation: ViewEncapsulation.None,   // needed for css styling on mat-menu-panel
  providers: [TableParamsStorageService],
})

export class GenGeneTablePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  @ViewChild('searchBox', { static: true }) searchBox: ElementRef;
  dataSource: GeneSequenceDataSource;

  displayedColumns = [];
  allColumns = columnInfo;
  lastLoadedColumns = [];
  paginatorSubscription = null;
  geneTableServiceSubscription = null;
  filterModeEnum = FilterMode;
  filters = [];
  sorts = [];
  choices$: Observable<IChoices>;
  choices$Subscription = null;
  loading$Subscription = null;
  genSampleSelectedServiceSubscription = null;
  selectedSampleIds = [];
  samplesSelected = false;
  isSelectedGenesChecked = false;
  resizeEvents = new Map();
  clearSubject = new BehaviorSubject<null>(null);
  clear$ = this.clearSubject.asObservable();
  setFilterSubject = new BehaviorSubject<any>(null);
  setFilter$ = this.setFilterSubject.asObservable();
  redirectOnLoad = null;
  onlySelectedSamplesSet = false;

  constructor(private genomicService: GenomicService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private genGeneSelectedService: GenGeneSelectedService,
              private tableParamsStorageService: TableParamsStorageService,
              private genSampleSelectedService: GenSampleSelectedService,
              private router: Router,
              private reportRunService: ReportRunService,
  ) {
  }


  ngOnInit() {
    this.resizeEvents = this.tableParamsStorageService.loadSavedInfo(this.resizeEvents, 'gen-gene-table-widths');
    this.dataSource = new GeneSequenceDataSource(this.genomicService);
  }

  ngOnDestroy() {
    this.paginatorSubscription.unsubscribe();
    this.geneTableServiceSubscription.unsubscribe();
    this.choices$Subscription.unsubscribe();
    this.genSampleSelectedServiceSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.paginatorSubscription = this.paginator.page
      .subscribe(() => this.loadSequencesPage());

    // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .subscribe(
          (sel: GeneTableSelection) => {
            if (sel.species && sel.datasets) {
              this.selection = sel;
              this.paginator.firstPage();
              this.table.renderRows();
              this.loadSequencesPage();
            }
          }
        );

      this.loading$Subscription = this.dataSource.loading$.subscribe(
        loading => {
          if (!loading) {
            this.applyResizes();

            if (this.redirectOnLoad) {
              const r = this.redirectOnLoad;
              this.redirectOnLoad = null;
              this.router.navigate(r);
            }
          }
        }
      );

      this.choices$Subscription = this.dataSource.choices$.subscribe(
        choices => {
          if (this.filters.length > 0 && !this.isSelectedGenesChecked) {
            this.genGeneSelectedService.selection.next({names: choices.name, onlySelected: this.onlySelectedSamplesSet});
          } else {
            this.onlySelectedSamplesSet = false;
            this.genGeneSelectedService.selection.next({names: [], onlySelected: this.onlySelectedSamplesSet});
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

      this.genSampleSelectedServiceSubscription = this.genSampleSelectedService.source.subscribe(
        selectedIds => {
          // check if selection really has changed
          if (sampleIdsEqual(selectedIds.ids, this.selectedSampleIds)) {
            return;
          }

          this.selectedSampleIds = selectedIds.ids;
          this.samplesSelected = Object.keys(this.selectedSampleIds).length > 0;

          if (this.isSelectedGenesChecked) {
            if (!this.samplesSelected) {
              this.isSelectedGenesChecked = false;
            }

            this.onSelectedIdsChange(null);
          }
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

  onSelectedIdsChange(state) {
    if (this.isSelectedGenesChecked && this.samplesSelected) {
      this.applyFilter(
        {
          field: 'sample_id',
          predicates: [{field: 'sample_id', op: 'in', value: this.selectedSampleIds}],
          sort: {order: ''}
        });
    } else {
      this.applyFilter(
        {
          field: 'sample_id',
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
      this.dataSource.loadGeneSequences(
        this.selection.species,
        this.selection.datasets.join(),
        this.paginator.pageIndex,
        this.paginator.pageSize,
        JSON.stringify(this.filters),
        JSON.stringify(this.sorts),
        JSON.stringify(this.displayedColumns)
      );
    }
  }

  onSequenceClick(seq) {
    const modalRef = this.modalService.open(SeqModalComponent, { size: 'lg'});
    modalRef.componentInstance.name = seq.name;
    modalRef.componentInstance.content = {ungapped: seq.sequence, gapped: seq.gapped_sequence};
  }

  onAppearancesClick(seq) {
    this.onlySelectedSamplesSet = true;
    this.redirectOnLoad = ['./genesample', 'true'];

    this.setFilterSubject.next({operator: { name: 'Includes', operands: 2, operator: 'like', prefix: '', postfix: '' }, op1: seq.name, op2: ''});
  }

  onResizeEnd(event: ResizeEvent, columnName): void {
    if (event.edges.right) {
      const cssValue = event.rectangle.width + 'px';
      this.updateColumnWidth(columnName, cssValue);
      this.resizeEvents.set(columnName, cssValue);
      this.tableParamsStorageService.saveInfo(this.resizeEvents, 'gen-gene-table-widths');
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
    const datasets = this.selection.datasets;
    const title = 'Download';
    params.filters = this.filters;

    this.reportRunService.runReport({name: report, title, filter_params: []}, format, this.selection.species,
      datasets, [], [], [], params);
  }
}

function isSuperset(set, subset) {
    for (const elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
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

function sampleIdsEqual(id1, id2) {
  if (!arraysEqual(Object.keys(id1), Object.keys(id2))) {
    return false;
  }

  return Object.keys(id1).every((v) => arraysEqual(id1[v], id2[v]));
}
