import { Component, OnInit } from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneTableService } from '../gene-table.service';

@Component({
  selector: 'app-gene-table-selector',
  templateUrl: './gene-table-selector.component.html',
  styleUrls: ['./gene-table-selector.component.scss']
})
export class GeneTableSelectorComponent implements OnInit {
  species = [];
  selectedSpecies = null;
  refSeqs = [];
  selectedRef = null;
  isFetching: boolean;
  error = null;

  constructor(private apiGateway: GenomicService,
              private geneTableService: GeneTableService) { }

  ngOnInit() {
    this.isFetching = true;
    this.apiGateway.getSpeciesApi().subscribe((resp) => {
      this.isFetching = false;

      this.species = [];
      let id = 1;
      for (const sp of resp) {
        this.species.push({id, name: sp});
        id = id + 1;
      }
    }, error => {
      this.isFetching = false;
      this.error = error.message;
    });
  }

  speciesChange() {
    console.log(this.selectedSpecies);

    if (this.selectedSpecies.name !== 'None') {
      this.apiGateway.getRefSeqApi(this.selectedSpecies.name).subscribe((resp) => {
      this.isFetching = false;
      this.refSeqs = [];

      const allSeqs = [];
      for (const ref of resp) {
        // duplicated for testing
        // allSeqs.push(ref.ref_seq);
        // allSeqs.push(ref.ref_seq);
        // allSeqs.push(ref.ref_seq);
        // allSeqs.push(ref.ref_seq);
        // allSeqs.push(ref.ref_seq);
        allSeqs.push(ref.ref_seq);
      }
      this.refSeqs.push({id: 0, displayName: 'All', names: allSeqs});
      let id = 1;
      for (const ref of resp) {
        this.refSeqs.push({id, displayName: ref.ref_seq + ' (' + ref.locus + ')', names: [ref.ref_seq]});
        id = id + 1;
      }
      }, error => {
        this.isFetching = false;
        this.error = error.message;
      });
    } else {
      this.refSeqs = [];
    }
  }

  onSubmit() {
    this.geneTableService.selectionUpdated.next({species: this.selectedSpecies.name, refSeqs: this.selectedRef.names});
  }
}
