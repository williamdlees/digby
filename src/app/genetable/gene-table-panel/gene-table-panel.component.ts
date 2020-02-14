import {Component, Input, OnInit} from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneTableSelection } from '../gene-table.model';
import { GeneTableService } from '../gene-table.service';
import { take } from 'rxjs/operators';


@Component({
  selector: 'app-gene-table-panel',
  templateUrl: './gene-table-panel.component.html',
  styleUrls: ['./gene-table-panel.component.scss']
})
export class GeneTablePanelComponent implements OnInit {
  @Input() selection: GeneTableSelection;

  columnDefs = [];
  rowData = [];
  isFetching = false;
  error = null;
  outstandingRequests = 0;

  constructor(private apiGateway: GenomicService,
              private geneTableService: GeneTableService) {

    this.geneTableService.selectionUpdated.subscribe(
      (sel: GeneTableSelection) => {
        this.selection = sel;
        console.log(sel);
        this.panelDisplay();
      }
    );
  }

/* tslint:disable:no-string-literal */

  ngOnInit() {
  }

  // update panel with results from a single reference sequence
  // this may be called multiple times to combine results from several references
  updatePanel(refSeq) {
    this.apiGateway.getSequencesApi(this.selection.species, refSeq).pipe(take(1)).subscribe((resp) => {
      if (resp['sequences'].length) {
        this.rowData.push(...resp['sequences']);
        this.isFetching = true;

        if (!this.columnDefs.length) {
          for (const key of Object.keys(this.rowData[0])) {
            this.columnDefs.push({headerName: key, field: key, sortable: true, filter: true});
            console.log(key);
          }
        }

        this.outstandingRequests -= 1;
        if (!this.outstandingRequests) {
          this.isFetching = false;
        }
      }
    }, error => {
      this.error = error.message;
      this.outstandingRequests -= 1;

      if (!this.outstandingRequests) {
        this.isFetching = false;
      }
    });
  }

  panelDisplay() {
    this.rowData = [];
    this.columnDefs = [];

    if (this.selection.species !== 'none' && this.selection.refSeqs.length) {
      this.isFetching = true;
      this.outstandingRequests = this.selection.refSeqs.length;

      for (const seqName of this.selection.refSeqs) {
        this.updatePanel(seqName);
      }
    }
  }
}
