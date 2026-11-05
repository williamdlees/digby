import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RepseqService } from 'projects/digby-swagger-client';
import { StudyTableComponent } from '../shared/study-table/study-table.component';

// Download scripts for every study in an AIRR-seq dataset. The species and dataset come from the URL,
// e.g. /downloads?species=Human&dataset=IGK, so the landing page can link straight to a dataset.
@Component({
    selector: 'app-downloads',
    templateUrl: './downloads.component.html',
    imports: [StudyTableComponent]
})
export class DownloadsComponent implements OnInit {
  speciesList: string[] = [];
  datasets: { dataset: string, description: string }[] = [];
  species = '';
  dataset = '';
  studies = null;
  loading = false;
  error = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repseqService: RepseqService,
  ) { }

  ngOnInit(): void {
    this.repseqService.getSpeciesApi()
      .pipe(catchError(err => { this.error = err.message; return EMPTY; }))
      .subscribe((resp: string[]) => {
        this.speciesList = resp;
        this.route.queryParamMap.subscribe(params => this.show(params.get('species'), params.get('dataset')));
      });
  }

  select(species: string, dataset: string): void {
    this.router.navigate([], { queryParams: { species, dataset: dataset || null } });
  }

  private show(species: string, dataset: string): void {
    this.species = this.speciesList.includes(species) ? species : this.speciesList[0] || '';
    this.studies = null;
    this.error = null;
    if (!this.species) {
      return;
    }

    this.loading = true;
    this.repseqService.getDataSetApi(this.species)
      .pipe(catchError(err => { this.loading = false; this.error = err.message; return EMPTY; }))
      .subscribe((resp: { dataset: string, description: string }[]) => {
        this.datasets = resp;
        this.dataset = resp.some(d => d.dataset === dataset) ? dataset : resp[0]?.dataset || '';
        if (!this.dataset) {
          this.loading = false;
          return;
        }
        this.repseqService.getDataSetInfoApi(this.species, this.dataset)
          .pipe(catchError(err => { this.loading = false; this.error = err.message; return EMPTY; }))
          .subscribe(info => {
            this.loading = false;
            this.studies = info['studies'];
          });
      });
  }
}
