/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation} from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../gene-table.model';
import { GeneTableService } from '../gene-table.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SeqModalComponent} from '../seq-modal/seq-modal.component';
import {GeneSequenceDataSource} from '../gene-sequence.datasource';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {columnInfo} from './gene-table-panel-cols';
import {FilterMode} from '../../table/filter/filter-mode.enum';
import {Observable} from 'rxjs';
import {IChoices} from '../../table/filter/ichoices';
import {ColumnPredicate} from '../../table/filter/column-predicate';


@Component({
  selector: 'app-gene-table-panel',
  templateUrl: './gene-table-panel.component.html',
  styleUrls: ['./gene-table-panel.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})

export class GeneTablePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  dataSource: GeneSequenceDataSource;

  displayedColumns = ['name', 'imgt_name', 'type', 'sequence', 'gapped_sequence'];
  allColumns = columnInfo;
  lastLoadedColumns = [];
  paginatorSubscription = null;
  geneTableServiceSubscription = null;
  filterModeEnum = FilterMode;
  filters = [];
  sorts = [];
  choices$: Observable<IChoices>;

  constructor(private genomicService: GenomicService,
              private geneTableService: GeneTableService,
              private modalService: NgbModal) {
  }


  ngOnInit() {
    this.dataSource = new GeneSequenceDataSource(this.genomicService);
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
      this.dataSource.loadGeneSequences(
        this.selection.species,
        this.selection.refSeqs.join(),
        this.selection.imgt,
        this.selection.novel,
        this.selection.full,
        JSON.stringify(this.filters),
        JSON.stringify(this.sorts),
        this.paginator.pageIndex,
        this.paginator.pageSize,
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

