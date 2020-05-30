import { Component, Input, OnInit } from '@angular/core';
import { GenomicService } from '../../../dist/digby-swagger-client';
import { RepseqService } from '../../../dist/digby-swagger-client';
import { GeneTableService } from '../genetable/gene-table.service';
import { retryWithBackoff } from '../shared/retry_with_backoff';
import { catchError  } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-gene-table-selector',
  templateUrl: './gene-table-selector.component.html',
  styleUrls: ['./gene-table-selector.component.scss']
})
export class GeneTableSelectorComponent implements OnInit {
  @Input() showFilter: boolean;
  @Input() showGenomic: boolean;
  @Input() showRepseq: boolean;
  species = [];
  selectedSpecies = null;
  refSeqs: { id: number, text: string }[] = [{ id: 1, text: ' ' }];
  repSeqs = [];
  selectedGen: { id: number, text: string }[] = null;
  selectedRep = null;
  showImgt = true;
  showNovel = true;
  showFull = true;
  filter = null;
  isFetching: boolean;
  error = null;
  dropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'id',
    textField: 'text',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 3,
    allowSearchFilter: true
  };


  constructor(private genomicService: GenomicService,
              private repseqService: RepseqService,
              private geneTableService: GeneTableService) { }

  ngOnInit() {
    this.isFetching = true;
    this.showImgt = this.geneTableService.selection.value.imgt;
    this.showNovel = this.geneTableService.selection.value.novel;
    this.showFull = this.geneTableService.selection.value.full;

    let selectedVal = null;
    this.genomicService.getSpeciesApi()
      .pipe(
        retryWithBackoff(),
        catchError(err => {
          this.isFetching = false;
          this.error = err;
          return EMPTY;
        })
      )
      .subscribe((resp) => {
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
        // this.updateRefs(this.geneTableService.selection.value.refSeqs);
        this.updateRefs(this.geneTableService.selection.value.refSeqs);
        this.updateReps(this.geneTableService.selection.value.repSeqs);
      }
    }, error => {
      this.isFetching = false;
      this.error = error.message;
    });
  }


  updateRefs(selectedNames: string[]) {
    this.genomicService.getRefSeqApi(this.selectedSpecies.name)
      .pipe(
        retryWithBackoff(),
        catchError(err => {
          this.isFetching = false;
          this.error = err;
          return EMPTY;
        })
      )
      .subscribe((resp) => {
      this.isFetching = false;
      this.refSeqs = [];
      this.selectedGen = [];

      let id = 1;
      for (const ref of resp) {
        this.refSeqs.push({ id, text: ref.ref_seq});
        id = id + 1;

        if (selectedNames.indexOf(ref.ref_seq) >= 0) {
          this.selectedGen.push({ id, text: ref.ref_seq});
        }

        // for testing
        this.refSeqs.push({ id, text: ref.ref_seq});
        id = id + 1;

        if (selectedNames.indexOf(ref.ref_seq) >= 0) {
          this.selectedGen.push({ id, text: ref.ref_seq});
        }
        // end of testing block
      }

      if (this.selectedGen.length === 0 && this.refSeqs.length > 0) {
        this.selectedGen.push(this.refSeqs[0]);
      }
     }, error => {
        this.isFetching = false;
        this.error = error.message;
      });
  }


  updateReps(selectedNames: string[]) {
    this.repseqService.getDataSetApi(this.selectedSpecies.name)
      .pipe(
        retryWithBackoff(),
        catchError(err => {
          this.isFetching = false;
          this.error = err;
          return EMPTY;
        })
      )
      .subscribe((resp) => {
      this.isFetching = false;
      this.repSeqs = [];
      this.selectedRep = [];

      let id = 1;
      for (const ref of resp) {
        this.repSeqs.push({ id, text: ref});
        id = id + 1;

        if (selectedNames.indexOf(ref) >= 0) {
          this.selectedRep.push({ id, text: ref});
         }

        // for testing
        this.repSeqs.push({ id, text: ref});
        id = id + 1;

        if (selectedNames.indexOf(ref) >= 0) {
          this.selectedRep.push({ id, text: ref});
        }
        // end of testing block
      }

      if (this.selectedRep.length === 0 && this.repSeqs.length > 0) {
        this.selectedRep.push(this.repSeqs[0]);
      }
     }, error => {
        this.isFetching = false;
        this.error = error.message;
      });
  }

  handleError(error: HttpErrorResponse) {
    this.isFetching = false;
    this.error = error.message;
  }


  speciesChange() {
    this.selectedGen = null;
    if (this.selectedSpecies.name !== 'None') {
      const empty: string[] = [];
      this.updateRefs(empty);
      this.updateReps(empty);
    }
  }

  genomicChange() {
    this.onSelectionChange();
  }

  repSeqChange() {
    this.onSelectionChange();
  }

  onSelectionChange() {
    if (this.selectedSpecies) {
      this.geneTableService.selection.next({
        species: this.selectedSpecies.name,
        refSeqs: this.selectedGen ? this.selectedGen.map(x => x.text) : null,
        repSeqs: this.selectedRep ? this.selectedRep.map(x => x.text) : null,
        imgt: this.showImgt,
        novel: this.showNovel,
        full: this.showFull,
        filter: this.filter});
    }
  }
}
