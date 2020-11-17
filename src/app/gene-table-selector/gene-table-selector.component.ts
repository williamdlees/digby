import {AfterViewInit, Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
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
  styleUrls: ['./gene-table-selector.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GeneTableSelectorComponent implements OnInit, AfterViewInit {
  @Input() showGenomic: boolean;
  @Input() showRepseq: boolean;
  species = null;
  selectedSpecies = null;
  datasets: { id: number, text: string }[] = [];
  repSeqs: { id: number, text: string }[] = [];
  selectedGen: { id: number, text: string }[] = [];
  selectedRep: { id: number, text: string }[] = [];
  repDatasetDescriptions: { dataset: string, description: string }[] = [];
  isFetching: boolean;
  initializing: boolean = false;
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
              this.initializing = true;
              this.updateSpecies(sel);

            } else if (sel.species && (!this.selectedSpecies || sel.species !== this.selectedSpecies.name)) {
              this.selectedSpecies = this.species.filter((s) => s.name === sel.species)[0];
              this.updateGen(sel.datasets);
              this.updateRep(sel.repSeqs);

            } else {
              if (sel.repSeqs && symmetricDifference(new Set(sel.repSeqs), new Set(this.selectedRep.map((x) => (x.text)))).size) {
                this.selectedRep = this.repSeqs.filter((r) => sel.repSeqs.indexOf(r.text) >= 0);
              }

              if (sel.datasets && symmetricDifference(new Set(sel.datasets), new Set(this.selectedGen.map((x) => (x.text)))).size) {
                this.selectedGen = this.datasets.filter((r) => sel.datasets.indexOf(r.text) >= 0);
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

      this.updateGen(selection.refSeqs);
      this.updateRep(selection.repSeqs);

    }, error => {
      this.isFetching = false;
      this.error = error.message;
    });
  }

  updateGen(selectedNames: string[]) {
    this.genomicService.getDataSetApi(this.selectedSpecies.name)
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
      this.datasets = [];
      this.selectedGen = [];

      let id = 1;
      for (const ref of resp) {
        this.datasets.push({id, text: ref.dataset});

        if (selectedNames && selectedNames.indexOf(ref.ref_seq) >= 0) {
          this.selectedGen.push({id, text: ref.dataset});
        }

        id = id + 1;
      }

      if (this.selectedGen.length === 0 && this.datasets.length > 0) {
        this.selectedGen.push(this.datasets[0]);
      }

     }, error => {
        this.isFetching = false;
        this.error = error.message;
      });
  }


  updateRep(selectedNames: string[]) {
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
      this.repDatasetDescriptions = resp;

      let id = 1;
      for (const ref of resp) {
        const dsName = ref.dataset;
        this.repSeqs.push({id, text: dsName});

        if (selectedNames.indexOf(dsName) >= 0) {
          this.selectedRep.push({id, text: dsName});
        }

        id = id + 1;
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
        this.updateGen(this.geneTableService.selection.value.datasets);
        this.updateRep(this.geneTableService.selection.value.repSeqs);
      } else {
        this.updateGen([]);
        this.updateRep([]);
      }
    }
  }

  repSeqChange() {
    if (symmetricDifference(new Set(this.geneTableService.selection.value.repSeqs), new Set(this.selectedRep.map((x) => (x.text)))).size || this.initializing) {
      this.onSelectionChange();
    }

    this.initializing = false;  // the flag is a bit of a hack but we need to make sure the descriptions get refreshed the first time through
  }

  refSeqChange() {
    if (symmetricDifference(new Set(this.geneTableService.selection.value.datasets), new Set(this.selectedGen.map((x) => (x.text)))).size) {
      this.onSelectionChange();
    }
  }

  onSelectionChange() {
    if (this.selectedSpecies) {
      this.geneTableService.selection.next({
        species: this.selectedSpecies.name,
        datasets: this.selectedGen.map(x => x.text),
        repSeqs: this.selectedRep.map(x => x.text),
        repDatasetDescriptions: this.repDatasetDescriptions,
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
