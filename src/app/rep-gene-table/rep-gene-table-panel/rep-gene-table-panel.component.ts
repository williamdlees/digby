/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation} from '@angular/core';
import { RepseqService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../../genetable/gene-table.model';
import { GeneTableService } from '../../genetable/gene-table.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SeqModalComponent} from '../../genetable/seq-modal/seq-modal.component';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {columnInfo} from './rep-gene-table-panel-cols';
import {FilterMode} from '../../table/filter/filter-mode.enum';
import {Observable} from 'rxjs';
import {IChoices} from '../../table/filter/ichoices';
import {ColumnPredicate} from '../../table/filter/column-predicate';
import {RepSequenceDataSource} from '../rep-sequence.datasource';


@Component({
  selector: 'app-rep-gene-table-panel',
  templateUrl: './rep-gene-table-panel.component.html',
  styleUrls: ['./rep-gene-table-panel.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})
export class RepGeneTablePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  dataSource: RepSequenceDataSource;

  displayedColumns = ['name', 'seq', 'seq_len', 'similar', 'appears', 'is_single_allele', 'low_confidence', 'novel', 'max_kdiff'];
  allColumns = columnInfo;
  lastLoadedColumns = [];
  paginatorSubscription = null;
  geneTableServiceSubscription = null;
  filterModeEnum = FilterMode;
  filters = [];
  sorts = [];
  choices$: Observable<IChoices>;

  constructor(private repseqService: RepseqService,
              private geneTableService: GeneTableService,
              private modalService: NgbModal) {
  }


  ngOnInit() {
    this.dataSource = new RepSequenceDataSource(this.repseqService);
  }

  ngOnDestroy() {
    this.paginatorSubscription.unsubscribe();
    this.geneTableServiceSubscription.unsubscribe();
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
      });
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
      this.dataSource.loadRepSequences(
        this.selection.species,
        this.selection.refSeqs.join(),
        JSON.stringify(this.filters),
        JSON.stringify(this.sorts),
        this.paginator.pageIndex,
        this.paginator.pageSize,
        JSON.stringify(this.displayedColumns),
      );
    }

    this.lastLoadedColumns = this.displayedColumns;
  }

  onCellClick(seq, type) {
    const modalRef = this.modalService.open(SeqModalComponent, {size: 'lg'});
    modalRef.componentInstance.name = seq.name;

    if (type === 'seq') {
      modalRef.componentInstance.content = seq.seq;
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



