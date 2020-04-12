import {Component, Input, OnDestroy, OnInit, ViewChild, Directive, HostListener, AfterViewInit} from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../gene-table.model';
import { GeneTableService } from '../gene-table.service';
import {Subject} from 'rxjs';
import {DataTableDirective} from 'angular-datatables';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SeqModalComponent} from '../seq-modal/seq-modal.component';
import {environment} from '../../../environments/environment';


@Component({
  selector: 'app-gene-table-panel',
  templateUrl: './gene-table-panel.component.html',
  styleUrls: ['./gene-table-panel.component.scss']
})

export class GeneTablePanelComponent implements OnDestroy, OnInit {
  @ViewChild(DataTableDirective, {static: false})
  dtElement: DataTableDirective;

  @Input() selection: GeneTableSelection;
  isFetching = false;
  error = null;
  outstandingRequests = 0;
  dtOptions: any = {};
  rows = [];
  cols = [];
  dtTrigger: Subject<null> = new Subject();
  initialisedTable = false;
  newRows = [];
  newCols = [];
  browserLink = '';

  constructor(private apiGateway: GenomicService,
              private geneTableService: GeneTableService,
              private modalService: NgbModal) {

  }

/* tslint:disable:no-string-literal */

  ngOnInit() {
    this.dtOptions = {
      select: {
        style: 'single',
        items: 'cell'
      }
    };

    this.geneTableService.selectionUpdated.subscribe(
      (sel: GeneTableSelection) => {
        this.selection = sel;
        this.assembleData();
      }
    );
  }

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  // Assemble data for the panel, which potentially comes from multiple reference sequence requests
  assembleData() {
    this.newRows = [];
    this.newCols = [];

    if (this.selection.species !== 'none' && this.selection.refSeqs.length) {
      this.isFetching = true;
      this.outstandingRequests = this.selection.refSeqs.length;

      for (const seqName of this.selection.refSeqs) {
        this.getRefSeqData(seqName);
      }
    }
  }

  // update panel with results from a single reference sequence
  // this may be called multiple times to combine results from several references
  getRefSeqData(refSeq) {
    this.apiGateway.getSequencesApi(this.selection.species, refSeq).subscribe((resp) => {
      if (resp['sequences'].length) {
        this.newRows.push(...resp['sequences']);
        this.isFetching = true;
        this.checkComplete();
      }
    }, error => {
      this.error = error.message;
      this.checkComplete();
    });
  }

  // Check whether all gets have completed, if so display the data
  private checkComplete() {
    this.outstandingRequests -= 1;
    if (!this.outstandingRequests) {
      this.isFetching = false;
      this.displayData();
    }
  }

// display the assembled data on the panel
  displayData() {
    // determine coloumn manes
    for (const key of Object.keys(this.newRows[0])) {
    this.newCols.push(key);
    }

    // truncate long columns and add _full equivalents
    this.truncateCols();

    // destroy table data if necessary
    if (this.initialisedTable) {
      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        // Destroy the table first
        dtInstance.destroy();
      });
    };

    // assign the new data and trigger update event
    this.rows = this.newRows;
    this.cols = this.newCols;
    this.dtTrigger.next();

    // set up the select callback and hide _full columns
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      if (!this.initialisedTable) {
        dtInstance.on('select', this.getSelectCallback(dtInstance));
        this.initialisedTable = true;
      }

      const nCols = dtInstance.columns().nodes().length;
      for (let i = 0; i < nCols; i++) {
        const head = $(dtInstance.column(i).header()).html();
        if (head.includes('_full')) {
          dtInstance.column(i).visible(false);
        }
      }

      // set up the link to the gene browser

      this.browserLink = environment.jbrowseBasePath + '/' + this.selection.species.replace(' ', '_') + '.html';
    });

  }

  private truncateCols() {
  // truncate lengthy columns, create _full equivalents
    const fullCols = [];

    for (const col of this.newCols) {
      let maxLength = 0;
      for (const row of this.newRows) {
        const foo: string = row[col];
        if (foo) {
          maxLength = Math.max(maxLength, foo.length);
        }
      }

      if (maxLength > 25) {
        fullCols.push(col + '_full');
        for (let i = 0; i < this.newRows.length; i++) {
          this.newRows[i][col + '_full'] = this.newRows[i][col];
          if (this.newRows[i][col].length > 15) {
            this.newRows[i][col] = this.newRows[i][col].slice(0, 15) + '...';
          }
        }
      }
    }

    this.newCols.push(...fullCols);
  }

  // The select callback

  private getSelectCallback(dtInstance: DataTables.Api) {
    const self = this;
    return function () {
      // find column header and gene name
      const clickedCell = dtInstance.cell({selected: true});
      const clickedColumnIndex = clickedCell.index();
      const clickedHeader = $(dtInstance.column(clickedColumnIndex.column).header()).html();
      const clickedGene = dtInstance.cell(clickedColumnIndex.row, 0).data();

      // check for a _full column.
      if (self.cols.includes(clickedHeader + '_full')) {
        const nCols = dtInstance.columns().nodes().length;
        for (let i = 0; i < nCols; i++) {
          const head = $(dtInstance.column(i).header()).html();
          if (head === clickedHeader + '_full') {
            const modalRef = self.modalService.open(SeqModalComponent, { size: 'lg'});
            modalRef.componentInstance.name = clickedGene;
            modalRef.componentInstance.content = dtInstance.cell(clickedColumnIndex.row, i).data();
          }
        }
      }
    };
  }
}
