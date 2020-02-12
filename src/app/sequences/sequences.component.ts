import { Component, OnInit } from '@angular/core';
import { ImgtimgtGeneTableService } from '../../../dist/digby-swagger-client';

@Component({
  selector: 'app-sequences',
  templateUrl: './sequences.component.html',
  styleUrls: ['./sequences.component.scss']
})
export class SequencesComponent implements OnInit {

  columnDefs = [];
  rowData = [];
  isFetching = false;
  error = null;

  constructor(private apiGateway: ImgtimgtGeneTableService) {
  }

  ngOnInit() {
    this.isFetching = true;
    this.apiGateway.getImgtAlleles().subscribe((resp) => {
      this.isFetching = false;
      resp = JSON.parse(resp);
      console.log(Object.keys(resp[0]));
      let cols = [];

      for (const key of Object.keys(resp[0])) {
        cols.push({headerName: key, field: key, sortable: true, filter: true});
      }

      this.columnDefs = cols
      this.rowData = resp;
    }, error => {
      this.isFetching = false;
      this.error = error.message;
    });
  }
}
