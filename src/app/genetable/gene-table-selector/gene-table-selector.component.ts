import { Component, Input, OnInit } from '@angular/core';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import { GeneTableService } from '../gene-table.service';

@Component({
  selector: 'app-gene-table-selector',
  templateUrl: './gene-table-selector.component.html',
  styleUrls: ['./gene-table-selector.component.scss']
})
export class GeneTableSelectorComponent implements OnInit {
  @Input() showFilter: string;
  species = [];
  selectedSpecies = null;
  refSeqs = [];
  selectedRef = null;
  showImgt = true;
  showNovel = true;
  showFull = true;
  filter = null;
  isFetching: boolean;
  error = null;

  constructor(private apiGateway: GenomicService,
              private geneTableService: GeneTableService) { }

  ngOnInit() {
    this.isFetching = true;
    this.showImgt = this.geneTableService.selection.value.imgt;
    this.showNovel = this.geneTableService.selection.value.novel;
    this.showFull = this.geneTableService.selection.value.full;

    let selectedVal = null;
    this.apiGateway.getSpeciesApi().subscribe((resp) => {
      this.isFetching = false;
      let id = 1;
      for (const sp of resp) {
        const sel = {id, name: sp};
        this.species.push(sel);
        if (sp === this.geneTableService.selection.value.species) {
          selectedVal = sel;
        }
        id = id + 1;
      }

      if (selectedVal) {
        this.selectedSpecies = selectedVal;
        this.refSeqs = [];
        this.updateRefs(this.geneTableService.selection.value.refSeqs);
      }
    }, error => {
      this.isFetching = false;
      this.error = error.message;
    });
  }


  updateRefs(selectedName?: string) {
    this.apiGateway.getRefSeqApi(this.selectedSpecies.name).subscribe((resp) => {
      this.isFetching = false;
      this.refSeqs = [];
      this.selectedRef = null;

      let id = 1;
      for (const ref of resp) {
        const sel = {id, displayName: ref.ref_seq + ' (' + ref.locus + ')', name: ref.ref_seq};
        this.refSeqs.push(sel);
        if (selectedName === sel.name) {
          this.selectedRef = sel;
        }
        id = id + 1;

        if (!this.selectedRef) {
          this.selectedRef = sel;
        }
      }
     }, error => {
        this.isFetching = false;
        this.error = error.message;
      });
  }


  speciesChange() {
    this.selectedRef = null;
    if (this.selectedSpecies.name !== 'None') {
      this.updateRefs();
    }
  }

  onSubmit() {
    this.geneTableService.selection.next({species: this.selectedSpecies.name, refSeqs: this.selectedRef.name,
      imgt: this.showImgt, novel: this.showNovel, full: this.showFull, filter: this.filter});
  }
}
