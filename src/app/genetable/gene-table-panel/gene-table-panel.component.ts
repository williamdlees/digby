/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewChild, Directive, HostListener, AfterViewInit} from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../gene-table.model';
import { GeneTableService } from '../gene-table.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SeqModalComponent} from '../seq-modal/seq-modal.component';
import {GeneSequenceDataSource} from '../gene-sequence.datasource';
import {MatPaginator} from '@angular/material/paginator';
import {MatTable} from '@angular/material/table';
import { tap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-gene-table-panel',
  templateUrl: './gene-table-panel.component.html',
  styleUrls: ['./gene-table-panel.component.scss']
})

export class GeneTablePanelComponent implements AfterViewInit, OnInit {
  @Input() selection: GeneTableSelection;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<string>;
  dataSource: GeneSequenceDataSource;
  displayedColumns = ['name', 'imgt_name', 'type', 'seq', 'gapped'];

  constructor(private genomicService: GenomicService,
              private geneTableService: GeneTableService,
              private modalService: NgbModal) {
  }


  ngOnInit() {
    this.dataSource = new GeneSequenceDataSource(this.genomicService);
  }

  ngAfterViewInit() {
      this.paginator.page
        .subscribe(() => this.loadSequencesPage());

      // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
      setTimeout(() => {
        this.geneTableService.source
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
    console.log('loadGeneSequences page' + this.paginator.pageIndex)
    this.dataSource.loadGeneSequences(this.selection.species, this.selection.refSeqs, this.selection.imgt, this.selection.novel, this.selection.full, this.selection.filter, 'asc', this.paginator.pageIndex, this.paginator.pageSize);
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
