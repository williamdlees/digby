/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation} from '@angular/core';
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
import {Observable} from 'rxjs';
import {IChoices} from '../../table/filter/ichoices';
import {ColumnPredicate} from '../../table/filter/column-predicate';
import { GenGeneSelectedService } from '../gen-gene-selected.service'
import {GenSampleSelectedService} from '../../gen-sample/gen-sample-selected.service';
import { ResizeEvent } from 'angular-resizable-element';
import { TableParamsStorageService } from '../../table/table-params-storage-service';


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
  genSampleSelectedServiceSubscription = null;
  selectedSampleIds: string[] = [];
  isSelectedGenesChecked = false;
  resizeEvents = new Map();

  constructor(private genomicService: GenomicService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private genGeneSelectedService: GenGeneSelectedService,
              private tableParamsStorageService: TableParamsStorageService,
              private genSampleSelectedService: GenSampleSelectedService) {
  }


  ngOnInit() {
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
              if (sel.species && sel.refSeqs) {
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
              this.genGeneSelectedService.selection.next({names: choices.name});
            } else {
              this.genGeneSelectedService.selection.next({names: []});
            }
          }
        );

        this.genSampleSelectedServiceSubscription = this.genSampleSelectedService.source.subscribe(
          selectedIds => {
            this.selectedSampleIds = selectedIds.ids;

            if (this.isSelectedGenesChecked) {
              this.onSelectedIdsChange(null);
            }
          }
        );
      });
  }

  onSelectedIdsChange(state) {
    if (this.isSelectedGenesChecked && this.selectedSampleIds.length) {
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

  applyFilter(columnPredicate: ColumnPredicate) {
    for (let i = this.filters.length - 1; i >= 0; i--) {
      if (this.filters[i].field === columnPredicate.field) {
        this.filters.splice(i, 1);
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
      this.dataSource.loadGeneSequences(
        this.selection.species,
        this.selection.refSeqs.join(),
        this.paginator.pageIndex,
        this.paginator.pageSize,
        JSON.stringify(this.filters),
        JSON.stringify(this.sorts),
        JSON.stringify(this.displayedColumns)
      );
    }
  }

  onCellClick(seq, type) {
    const modalRef = this.modalService.open(SeqModalComponent, { size: 'lg'});
    modalRef.componentInstance.name = seq.name;

    if (type === 'seq') {
      modalRef.componentInstance.content = seq.sequence;
    } else {
      modalRef.componentInstance.content = seq.gapped_sequence;
    }
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

