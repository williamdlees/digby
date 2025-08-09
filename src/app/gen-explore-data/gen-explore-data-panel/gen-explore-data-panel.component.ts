import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {GeneTableSelection} from '../../gene-table-selector/gene-table-selector.model';
import {GeneTableSelectorService} from '../../gene-table-selector/gene-table-selector.service';
import { GenomicService } from 'projects/digby-swagger-client';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import {debounceTime} from "rxjs/operators";



@Component({
    selector: 'app-gen-explore-data-panel',
    templateUrl: './gen-explore-data-panel.component.html',
    styleUrls: ['./gen-explore-data-panel.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling on mat-menu-panel
    ,
    imports: [MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, GoogleChartsModule]
})

export class GenExploreDataPanelComponent implements OnInit {
  geneTableServiceSubscription = null;
  species = null;
  dataset = null;
  datasetDescriptions = null;
  datasetInfo = null;
  loading = false;
  error = null;
  barChartType = ChartType.BarChart;
  pieChartType = ChartType.PieChart;
  @ViewChild('datasetInfoTable') datasetInfoTable: MatTable<any>;

  constructor(
    private geneTableService: GeneTableSelectorService,
    private genomicService: GenomicService,
  ) { }

  ngOnInit(): void {

    // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .pipe(debounceTime(500)).subscribe(
          (sel: GeneTableSelection) => {
            this.species = sel.species;
            this.dataset = sel.datasets;
            this.datasetDescriptions = sel.genDatasetDescriptions;

            if(typeof this.datasetInfoTable !== 'undefined') {
              this.datasetInfoTable.renderRows();
            }
            this.datasetInfo = null;

            if (this.dataset.length === 1) {
              this.error = null;
              this.loading = true;
              this.genomicService.getDataSetInfoApi(this.species, this.dataset[0]).subscribe( (info) => {
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
