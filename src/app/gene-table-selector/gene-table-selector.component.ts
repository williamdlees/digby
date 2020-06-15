import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import { GenomicService } from '../../../dist/digby-swagger-client';
import { RepseqService } from '../../../dist/digby-swagger-client';
import { GeneTableSelectorService } from './gene-table-selector.service';
import { retryWithBackoff } from '../shared/retry_with_backoff';
import { catchError  } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import {GeneTableSelection} from './gene-table-selector.model';

@Component({
  selector: 'app-gene-table-selector',
  templateUrl: './gene-table-selector.component.html',
  styleUrls: ['./gene-table-selector.component.scss']
})
export class GeneTableSelectorComponent implements OnInit, AfterViewInit {
  @Input() showGenomic: boolean;
  @Input() showRepseq: boolean;
  species = null;
  selectedSpecies = null;
  refSeqs: { id: number, text: string }[] = [];
  repSeqs: { id: number, text: string }[] = [];
  selectedGen: { id: number, text: string }[] = [];
  selectedRep: { id: number, text: string }[] = [];
  isFetching: boolean;
  error = null;
  geneTableServiceSubscription = null;
  genDropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'id',
    textField: 'text',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 3,
    allowSearchFilter: true
  };

  repDropdownSettings: IDropdownSettings = {
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
              private geneTableService: GeneTableSelectorService) { }

  ngOnInit() {
    this.isFetching = true;

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .subscribe(
          (sel: GeneTableSelection) => {
            if (!this.species) {
              this.updateSpecies(sel);

            } else if (sel.species && (!this.selectedSpecies || sel.species !== this.selectedSpecies.name)) {
              this.selectedSpecies = this.species.filter((s) => s.name === sel.species)[0];
              this.updateRefs(sel.refSeqs);
              this.updateReps(sel.repSeqs);

            } else {
              if (sel.repSeqs && symmetricDifference(new Set(sel.repSeqs), new Set(this.selectedRep.map((x) => (x.text)))).size) {
                this.selectedRep = this.repSeqs.filter((r) => sel.repSeqs.indexOf(r.text) >= 0);
              }

              if (sel.refSeqs && symmetricDifference(new Set(sel.refSeqs), new Set(this.selectedGen.map((x) => (x.text)))).size) {
                this.selectedGen = this.refSeqs.filter((r) => sel.refSeqs.indexOf(r.text) >= 0);
              }
            }
          }
        );
    });
  }

  updateSpecies(selection) {
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
      this.species = [];
      for (const sp of resp) {
        const sel = {id, name: sp};
        this.species.push(sel);
        if (sp === selection.species) {
          this.selectedSpecies = sel;
        }
        id = id + 1;
      }

      this.updateRefs(selection.refSeqs);
      this.updateReps(selection.repSeqs);

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
        this.refSeqs.push({id, text: ref.ref_seq});

        if (selectedNames && selectedNames.indexOf(ref.ref_seq) >= 0) {
          this.selectedGen.push({id, text: ref.ref_seq});
        }

        id = id + 1;
      }

      // for testing
      this.refSeqs.push({ id, text: 'Test'});

      if (selectedNames && selectedNames.indexOf('Test') >= 0) {
        this.selectedGen.push({id, text: 'Test'});
      }
      // end of testing block


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
        this.repSeqs.push({id, text: ref});

        if (selectedNames.indexOf(ref) >= 0) {
          this.selectedRep.push({id, text: ref});
        }

        id = id + 1;
      }
      // for testing
      this.repSeqs.push({ id, text: 'Test'});

      if (selectedNames.indexOf('Test') >= 0) {
        this.selectedRep.push({ id, text: 'Test'});
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
    if (this.selectedSpecies.name !== 'None') {
      if (this.geneTableService.selection.value.species === this.selectedSpecies.name) {
        this.updateRefs(this.geneTableService.selection.value.refSeqs);
        this.updateReps(this.geneTableService.selection.value.repSeqs);
      } else {
        this.updateRefs([]);
        this.updateReps([]);
      }
    }
  }

  repSeqChange() {
    if (symmetricDifference(new Set(this.geneTableService.selection.value.repSeqs), new Set(this.selectedRep.map((x) => (x.text)))).size) {
      this.onSelectionChange();
    }
  }

  refSeqChange() {
    if (symmetricDifference(new Set(this.geneTableService.selection.value.refSeqs), new Set(this.selectedGen.map((x) => (x.text)))).size) {
      this.onSelectionChange();
    }
  }

  onSelectionChange() {
    if (this.selectedSpecies) {
      this.geneTableService.selection.next({
        species: this.selectedSpecies.name,
        refSeqs: this.selectedGen.map(x => x.text),
        repSeqs: this.selectedRep.map(x => x.text),
      });
    }
  }
}

function symmetricDifference(setA, setB) {
    const difference = new Set(setA);
    for (const elem of setB) {
        if (difference.has(elem)) {
            difference.delete(elem);
        } else {
            difference.add(elem);
        }
    }
    return difference;
}
