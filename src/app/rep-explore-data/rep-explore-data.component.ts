import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { RepExploreDataPanelComponent } from './rep-explore-data-panel/rep-explore-data-panel.component';
import { ActivatedRoute } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RepseqService } from 'projects/digby-swagger-client';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';


@Component({
    selector: 'app-rep-explore-data',
    templateUrl: './rep-explore-data.component.html',
    styleUrls: ['./rep-explore-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [GeneTableSelectorComponent, RepExploreDataPanelComponent]
})
export class RepExploreDataComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private repseqService: RepseqService,
    private geneTableService: GeneTableSelectorService,
  ) { }

  ngOnInit(): void {
    // optional preselection, e.g. /datarep?species=Human&dataset=IGK (used by the landing page download link)
    this.route.queryParamMap.subscribe(params => {
      const species = params.get('species');
      const dataset = params.get('dataset');
      if (!species || !dataset) {
        return;
      }

      // only apply a species/dataset pair the API offers; otherwise leave the current selection alone
      this.repseqService.getDataSetApi(species)
        .pipe(catchError(() => EMPTY))
        .subscribe((resp: { dataset: string, description: string }[]) => {
          if (!resp.some(d => d.dataset === dataset)) {
            console.warn(`datarep: unknown AIRR-seq dataset ${species}/${dataset}, keeping current selection`);
            return;
          }
          this.geneTableService.selection.next({
            ...this.geneTableService.selection.value,
            species,
            repSeqs: [dataset],
            repDatasetDescriptions: resp,
          });
        });
    });
  }

}
