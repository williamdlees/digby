/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation, ElementRef} from '@angular/core';
import { RepseqService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SeqModalComponent} from '../../seq-modal/seq-modal.component';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {columnInfo} from './rep-gene-table-panel-cols';
import {FilterMode} from '../../table/filter/filter-mode.enum';
import {BehaviorSubject, fromEvent, Observable} from 'rxjs';
import {IChoices} from '../../table/filter/ichoices';
import {ColumnPredicate} from '../../table/filter/column-predicate';
import {RepSequenceDataSource} from '../rep-sequence.datasource';
import { RepGeneSelectedService } from '../rep-gene-selected.service';
import {RepSampleSelectedService} from '../../rep-sample/rep-sample-selected.service';
import {RepGeneNotesComponent} from '../rep-gene-notes/rep-gene-notes.component';
import { ResizeEvent } from 'angular-resizable-element';
import {TableParamsStorageService} from '../../table/table-params-storage-service';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';


@Component({
  selector: 'app-rep-gene-table-panel',
  templateUrl: './rep-gene-table-panel.component.html',
  styleUrls: ['./rep-gene-table-panel.component.css'],
  providers: [TableParamsStorageService],
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})
export class RepGeneTablePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  @ViewChild('searchBox', { static: true }) searchBox: ElementRef;
  dataSource: RepSequenceDataSource;

  displayedColumns = ['name', 'pipeline_name', 'seq', 'seq_len', 'similar', 'appears', 'is_single_allele', 'low_confidence', 'novel', 'max_kdiff'];
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
  selectedSampleIds = [];
  isSelectedGenesChecked = false;
  repSampleSelectedServiceSubscription = null;
  resizeEvents = new Map();
  samplesSelected = false;
  clearSubject = new BehaviorSubject<null>(null);
  clear$ = this.clearSubject.asObservable();
  setFilterSubject = new BehaviorSubject<any>(null);
  setFilter$ = this.setFilterSubject.asObservable();

  constructor(private repseqService: RepseqService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private repGeneSelectedService: RepGeneSelectedService,
              private repSampleSelectedService: RepSampleSelectedService,
              private tableParamsStorageService: TableParamsStorageService) {
  }

  ngOnInit() {
    this.resizeEvents = this.tableParamsStorageService.loadSavedInfo(this.resizeEvents, 'rep-gene-table-widths');
    this.dataSource = new RepSequenceDataSource(this.repseqService);
  }

  ngOnDestroy() {
    this.paginatorSubscription.unsubscribe();
    this.geneTableServiceSubscription.unsubscribe();
    this.choices$Subscription.unsubscribe();
    this.repSampleSelectedServiceSubscription.unsubscribe();
  }

  ngAfterViewInit() {

    this.paginatorSubscription = this.paginator.page
      .subscribe(() => this.loadSequencesPage());

    // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .subscribe(
          (sel: GeneTableSelection) => {
            if (sel.species && sel.repSeqs) {
              this.selection = sel;
              this.paginator.firstPage();
              this.table.renderRows();
              this.loadSequencesPage();
            }
          }
        );

      this.choices$Subscription = this.dataSource.choices$.subscribe(
        choices => {
          if (this.filters.length > 0 && !this.isSelectedGenesChecked) {
            this.repGeneSelectedService.selection.next({names: choices.name});
          } else {
            this.repGeneSelectedService.selection.next({names: []});
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

      this.repSampleSelectedServiceSubscription = this.repSampleSelectedService.source.subscribe(
        selectedIds => {
          this.selectedSampleIds = selectedIds.ids;
          this.samplesSelected = Object.keys(this.selectedSampleIds).length > 0;

          if (this.isSelectedGenesChecked) {
            this.onSelectedIdsChange();
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

  onSelectedIdsChange() {
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
      this.dataSource.loadRepSequences(
        this.selection.species,
        this.selection.repSeqs.join(),
        JSON.stringify(this.filters),
        JSON.stringify(this.sorts),
        this.paginator.pageIndex,
        this.paginator.pageSize,
        JSON.stringify(this.displayedColumns),
      );
    }

    this.lastLoadedColumns = this.displayedColumns;
  }

  showNotes(seq) {
    const modalRef = this.modalService.open(RepGeneNotesComponent, {size: 'lg'});
    modalRef.componentInstance.sequenceName = seq.name;
    modalRef.componentInstance.notes = seq.notes;
  }

  onSequenceClick(seq) {
    const modalRef = this.modalService.open(SeqModalComponent, {size: 'lg'});
    modalRef.componentInstance.name = seq.name;

    if (seq.seq.indexOf('.') < 0) {
      modalRef.componentInstance.content = {ungapped: seq.seq, gapped: ''};
    } else {
      modalRef.componentInstance.content = {ungapped: seq.seq.replace(/\./g, ''), gapped: seq.seq};
    }
  }

  onAppearancesClick(seq) {
  }

  onResizeEnd(event: ResizeEvent, columnName): void {
    if(event.edges.right) {
      const cssValue = event.rectangle.width + 'px';
      this.updateColumnWidth(columnName, cssValue);
      this.resizeEvents.set(columnName, cssValue);
      this.tableParamsStorageService.saveInfo(this.resizeEvents, 'rep-gene-table-widths');
    }
  }

  applyResizes(): void {
    for(const [columnName, cssValue] of this.resizeEvents) {
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



