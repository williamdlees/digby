import { Component, OnInit } from '@angular/core';
import {GeneTableSelection} from '../../gene-table-selector/gene-table-selector.model';
import {GeneTableSelectorService} from '../../gene-table-selector/gene-table-selector.service';
import { RepseqService } from '../../../../dist/digby-swagger-client';

@Component({
  selector: 'app-rep-explore-data-panel',
  templateUrl: './rep-explore-data-panel.component.html',
  styleUrls: ['./rep-explore-data-panel.component.scss']
})
export class RepExploreDataPanelComponent implements OnInit {
  geneTableServiceSubscription = null;
  species = null;
  dataset = null;
  datasetInfo = null;
  loading = false;
  error = null;

  constructor(
    private geneTableService: GeneTableSelectorService,
    private repseqService: RepseqService,
  ) { }

  ngOnInit(): void {

    // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .subscribe(
          (sel: GeneTableSelection) => {
            this.species = sel.species;
            this.dataset = sel.repSeqs;
            this.datasetInfo = null;

            if (this.dataset.length > 0) {
            this.error = null;
              this.loading = true;
              this.repseqService.getDataSetInfoApi(this.species, this.dataset[0]).subscribe( (info) => {
                this.loading = false;
                this.datasetInfo = info;
              });
            }
          },
          error => {
            this.error = error;
          }
        );
    });
  }

}
