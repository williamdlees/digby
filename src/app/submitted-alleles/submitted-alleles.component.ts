import { Component, OnInit } from '@angular/core';
import {LongReadsubmittedSequencesService} from '../../../dist/digby-swagger-client';

@Component({
  selector: 'app-submitted-alleles',
  templateUrl: './submitted-alleles.component.html',
  styleUrls: ['./submitted-alleles.component.scss']
})
export class SubmittedAllelesComponent implements OnInit {

  columnDefs = [];
  rowData = [];
  isFetching = false;
  error = null;

  constructor(private apiGateway: LongReadsubmittedSequencesService) { }

  ngOnInit() {
    this.isFetching = true;

    this.apiGateway.getSubmittedSequences().subscribe((resp) => {
      this.isFetching = false;
      resp = JSON.parse(resp);
      console.log(Object.keys(resp[0]));
      let cols = [];

      for (const key of Object.keys(resp[0])) {
        cols.push({headerName: key, field: key, sortable: true, filter: true });
      }

      this.columnDefs = cols
      this.rowData = resp;
    }, error => {
      this.isFetching = false;
      this.error = error.message;
    });
  }
}
