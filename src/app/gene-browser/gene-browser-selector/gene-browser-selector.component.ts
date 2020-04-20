import { Component, OnInit } from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneBrowserService } from '../gene-browser.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-gene-browser-selector',
  templateUrl: './gene-browser-selector.component.html',
  styleUrls: ['./gene-browser-selector.component.scss']
})
export class GeneBrowserSelectorComponent implements OnInit {
  species = [];
  selectedSpecies = null;
  refSeqs = [];
  selectedRef = null;
  isFetching: boolean;
  error = null;

  constructor(private apiGateway: GenomicService,
              private geneBrowserService: GeneBrowserService) { }

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
    if (this.selectedSpecies.name !== 'None') {
      this.apiGateway.getRefSeqApi(this.selectedSpecies.name).subscribe((resp) => {
        this.isFetching = false;
        this.refSeqs = [];

        let id = 1;
        for (const ref of resp) {
          this.refSeqs.push({id, displayName: ref.ref_seq + ' (' + ref.locus + ')', name: [ref.ref_seq]});
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
    this.geneBrowserService.selectionUpdated.next({
      species: this.selectedSpecies.name.toString().replace(' ', '_'),
      refSeq: this.selectedRef.name.toString().replace(' ', '_')});
  }
}

