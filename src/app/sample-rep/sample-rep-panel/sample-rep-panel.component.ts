/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import { RepseqService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../../genetable/gene-table.model';
import { GeneTableService } from '../../genetable/gene-table.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import {RepSequenceDataSource} from '../rep-sequence.datasource';
import { FilterMode } from './filter/filter-mode.enum';
import { ColumnPredicate } from './filter/column-predicate';

@Component({
  selector: 'app-sample-rep-panel',
  templateUrl: './sample-rep-panel.component.html',
  styleUrls: ['./sample-rep-panel.component.scss']
})
export class SampleRepPanelComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  dataSource: RepSequenceDataSource;
  displayedColumns = ['name', 'status', 'tissue', 'combined_cell_type', 'row_reads', 'sequencing_length', 'umi'];
  paginatorSubscription = null;
  geneTableServiceSubscription = null;
  filterModeEnum = FilterMode;
  filters = [];


  applyFilter(columnPredicate: ColumnPredicate) {
    console.log('applyFilter field: ' + columnPredicate.predicate.field +
      ' op: ' + columnPredicate.predicate.op +
      ' value: ' + columnPredicate.predicate.value);

    for (let i = this.filters.length - 1; i >= 0; i--) {
      if (this.filters[i].field === columnPredicate.predicate.field) {
        this.filters.splice(i, 1);
      }
    }

    if (columnPredicate.predicate.op) {
      this.filters.push(columnPredicate.predicate);
    }

    this.loadSequencesPage();
  }

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
              this.selection = sel;
              this.paginator.firstPage()
              this.table.renderRows();
              this.loadSequencesPage();

            }
          );
      });
  }

  loadSequencesPage() {
    this.dataSource.loadRepSequences(this.selection.species, this.selection.repSeqs.join(), this.selection.imgt, this.selection.novel, this.selection.full, JSON.stringify(this.filters), 'asc', this.paginator.pageIndex, this.paginator.pageSize);
  }


}
