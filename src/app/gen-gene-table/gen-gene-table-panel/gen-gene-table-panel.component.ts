/* tslint:disable:max-line-length */
import { Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation, ElementRef } from '@angular/core';
import { GenomicService } from 'projects/digby-swagger-client';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SeqModalComponent } from '../../seq-modal/seq-modal.component';
import { GeneSequenceDataSource } from '../gene-sequence.datasource';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { columnInfo } from './gene-table-panel-cols';
import { FilterMode } from '../../table/filter/filter-mode.enum';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { IChoices } from '../../table/filter/ichoices';
import { ColumnPredicate } from '../../table/filter/column-predicate';
import { GenGeneSelectedService } from '../gen-gene-selected.service'
import { GenSampleSelectedService } from '../../gen-sample/gen-sample-selected.service';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ReportRunService } from '../../reports/report-run.service';
import { listsOfDictionariesEqual } from '../../shared/struct_utils';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { ColumnSorterComponent } from '../../table/column-sorter/column-sorter.component';
import { MatMenuTrigger, MatMenu, MatMenuContent } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { TableResizeDirective } from '../../table/table-resize.directive';
import { ColumnResizeDirective } from '../../table/column-resize.directive';
import { FilterComponent } from '../../table/filter/filter.component';


@Component({
    selector: 'app-gene-table-panel',
    templateUrl: './gen-gene-table-panel.component.html',
    styleUrls: ['./gen-gene-table-panel.component.css'],
    encapsulation: ViewEncapsulation.None, // needed for css styling on mat-menu-panel
    providers: [],
    imports: [NgIf, MatIcon, ColumnSorterComponent, MatMenuTrigger, FormsModule, MatPaginator, MatTable, TableResizeDirective, NgFor, MatColumnDef, MatHeaderCellDef, MatHeaderCell, ColumnResizeDirective, FilterComponent, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatMenu, MatMenuContent, AsyncPipe]
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
  filters = []
  sorts = []
  choices$: Observable<IChoices>;
  choices$Subscription = null;
  loading$Subscription = null;
  genSampleSelectedServiceSubscription = null;
  selectedSampleIds = [];
  samplesSelected = false;
  isSelectedGenesChecked = false;
  clearSubject = new BehaviorSubject<null>(null);
  clear$ = this.clearSubject.asObservable();
  setFilterSubject = new BehaviorSubject<any>(null);
  setFilter$ = this.setFilterSubject.asObservable();
  setTypeFilterSubject = new BehaviorSubject<any>(null);
  setTypeFilter$ = this.setTypeFilterSubject.asObservable();
  setFuncFilterSubject = new BehaviorSubject<any>(null);
  setFuncFilter$ = this.setFuncFilterSubject.asObservable();
  loadSequencesSubject = new BehaviorSubject<any>(null);
  loadSequences$ = this.loadSequencesSubject.asObservable();
  loadSequences$Subscription = null
  extraCols$: Observable<[]>;
  extraCols$Subscription = null;
  redirectOnLoad = null;
  onlySelectedSamplesSet = false;

  constructor(private genomicService: GenomicService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private genGeneSelectedService: GenGeneSelectedService,
              private genSampleSelectedService: GenSampleSelectedService,
              private router: Router,
              private reportRunService: ReportRunService,
  ) {
  }


  ngOnInit() {
    this.dataSource = new GeneSequenceDataSource(this.genomicService);
  }

  ngOnDestroy() {
    this.paginatorSubscription.unsubscribe();
    this.geneTableServiceSubscription.unsubscribe();
    this.choices$Subscription.unsubscribe();
    this.genSampleSelectedServiceSubscription.unsubscribe();
    this.extraCols$Subscription.unsubscribe();
    this.loadSequences$Subscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.paginatorSubscription = this.paginator.page
      .subscribe(() => {
        this.loadSequencesSubject.next(null);
      });

    // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .pipe(debounceTime(500)).subscribe(
          (sel: GeneTableSelection) => {
            if (sel.species && sel.datasets) {
              this.selection = sel;
              this.paginator.firstPage();
              //this.table.renderRows();
              console.log('loadSequencesPage: geneTableServiceSubscription');
              this.loadSequencesSubject.next(null);
            }
          }
        );

      this.loading$Subscription = this.dataSource.loading$.subscribe(
        loading => {
          if (!loading) {
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
            //this.onlySelectedSamplesSet = false;
            //this.genGeneSelectedService.selection.next({names: [], onlySelected: this.onlySelectedSamplesSet});
          }
        }
      );

      this.extraCols$Subscription = this.dataSource.extraCols$.subscribe(
        (extra_cols) => {
          this.allColumns = columnInfo.concat(extra_cols);
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


      this.loadSequences$Subscription = this.loadSequences$.pipe(debounceTime(500)).subscribe(() => {
        this.loadSequencesPage();
      });

      // Set up initial search order and filter conditions
      const searchOrder = {field: 'name', predicates: [], sort: {field: 'name', order: 'asc'}}
      this.applyFilter(searchOrder);
      this.setTypeFilterSubject.next({operator: { name: 'Includes', operands: 2, operator: 'like', prefix: '%', postfix: '%' }, op1: 'REGION', op2: ''});
      this.setFuncFilterSubject.next({operator: { name: 'Includes', operands: 2, operator: 'like', prefix: '%', postfix: '%' }, op1: 'Functional', op2: ''});
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
          field: 'sample_identfier',
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
    console.log('loadSequencesPage 2');
    this.loadSequencesSubject.next(null);
  }

  clearSelection() {
    this.filters = [];
    this.clearSubject.next(null);
    this.searchBox.nativeElement.value = '';
    console.log('loadSequencesPage 3');
    this.loadSequencesSubject.next(null);
  }

  applyFilter(columnPredicate: ColumnPredicate) {
    // copy existing filters and sorts so that we can check for changes later
    const oldFilters = this.filters.slice(0);
    const oldSorts = this.sorts.slice(0);
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

    if (listsOfDictionariesEqual(oldFilters, this.filters) && listsOfDictionariesEqual(oldSorts, this.sorts)) {
      return;
    }

    this.paginator.pageIndex = 0;
    this.loadSequencesSubject.next(null);
  }

  updateColumnData(event: any) {
    const sLoaded = new Set(this.lastLoadedColumns);
    const sDisplayed = new Set(this.displayedColumns);

    const deleted = difference(sLoaded, sDisplayed);
    this.filters = this.filters.filter((x) => !(deleted.has(x.field)));
    this.sorts = this.sorts.filter((x) => !(deleted.has(x.field)));
  }

  loadSequencesPage() {
    console.log('loadSequencesPage');
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

    this.lastLoadedColumns = this.displayedColumns;
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
