/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, ViewEncapsulation} from '@angular/core';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {GenSampleDataSource} from '../gen-sample-data.source';
import { FilterMode } from '../../table/filter/filter-mode.enum';
import { ColumnPredicate } from '../../table/filter/column-predicate';
import { IChoices } from '../../table/filter/ichoices';
import { Observable } from 'rxjs';
import { columnInfo } from './gen-sample-panel-cols';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { GenSampleInfoComponent } from '../gen-sample-info/gen-sample-info.component';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import {GenGeneSelectedService} from '../../gen-gene-table/gen-gene-selected.service';


@Component({
  selector: 'app-gen-sample-panel',
  templateUrl: './gen-sample-panel.component.html',
  styleUrls: ['./gen-sample-panel.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})

export class GenSamplePanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  dataSource: GenSampleDataSource;

  displayedColumns = ['name', 'type', 'date', 'study_name', 'institute', 'researcher', 'reference', 'contact', 'accession_id', 'accession_reference'];
  allColumns = columnInfo;
  lastLoadedColumns = [];
  paginatorSubscription = null;
  geneTableServiceSubscription = null;
  genGeneSelectedServiceSubscription = null;
  filterModeEnum = FilterMode;
  filters = [];
  sorts = [];
  choices$: Observable<IChoices>;
  selectedSequenceNames: string[] = [];
  isSelectedSamplesChecked = false;

  constructor(private genSampleService: GenomicService,
              private geneTableService: GeneTableSelectorService,
              private modalService: NgbModal,
              private genGeneSelectedService: GenGeneSelectedService
              ) {

  }

  ngOnInit() {
    this.dataSource = new GenSampleDataSource(this.genSampleService);
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
              this.selection = sel;
              this.paginator.firstPage();
              this.table.renderRows();
              this.loadSequencesPage();
            }
          );

        this.genGeneSelectedServiceSubscription = this.genGeneSelectedService.source.subscribe(
          selectedNames => {
            this.selectedSequenceNames = selectedNames.names;
            this.onSelectedSamplesChange(null);
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
        this.selection.refSeqs.join(),
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
    modalRef.componentInstance.sampleName = sample.name;
    modalRef.componentInstance.species = this.selection.species;
    modalRef.componentInstance.studyName = sample.study_name;
  }
}

function difference(setA, setB) {
    const diff = new Set(setA);
    for (const elem of setB) {
        diff.delete(elem);
    }
    return diff;
}
