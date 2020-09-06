/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation} from '@angular/core';
import { RepseqService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {RepSampleDataSource} from '../rep-sample-data.source';
import { FilterMode } from '../../table/filter/filter-mode.enum';
import { ColumnPredicate } from '../../table/filter/column-predicate';
import { IChoices } from '../../table/filter/ichoices';
import { Observable } from 'rxjs';
import { columnInfo } from './rep-sample-panel-cols';
import {SeqModalComponent} from '../../seq-modal/seq-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RepSampleInfoComponent} from '../rep-sample-info/rep-sample-info.component';
import { RepGeneSelectedService } from '../../rep-gene-table/rep-gene-selected.service';
import { RepSampleSelectedService } from '../rep-sample-selected.service'
import {RepSampleFilterService} from '../rep-sample-filter.service';
import {ResizeEvent} from 'angular-resizable-element';
import {TableParamsStorageService} from '../../table/table-params-storage-service';

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
  dataSource: RepSampleDataSource;

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
  resizeEvents = new Map();

  constructor(private repseqService: RepseqService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private repGeneSelectedService: RepGeneSelectedService,
              private repSampleSelectedService: RepSampleSelectedService,
              private repSampleFilterService: RepSampleFilterService,
              private tableParamsStorageService: TableParamsStorageService,
              ) {

  }

  ngOnInit() {
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
              this.repSampleSelectedService.selection.next({ids: choices.id});
            } else {
              this.repSampleSelectedService.selection.next({ids: []});
            }
          }
        );

        this.repGeneSelectedServiceSubscription = this.repGeneSelectedService.source.subscribe(
          selectedNames => {
            this.selectedSequenceNames = selectedNames.names;
            if (this.isSelectedSamplesChecked) {
              this.onSelectedSamplesChange(null);
            }
          }
        );
      });
  }

  onSelectedSamplesChange(state) {
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

    this.repSampleFilterService.selection.next({filters: this.filters});
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
}


function difference(setA, setB) {
    const diff = new Set(setA);
    for (const elem of setB) {
        diff.delete(elem);
    }
    return diff;
}
