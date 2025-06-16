import { Component, OnInit } from '@angular/core';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { RepExploreDataPanelComponent } from './rep-explore-data-panel/rep-explore-data-panel.component';


@Component({
    selector: 'app-rep-explore-data',
    templateUrl: './rep-explore-data.component.html',
    styleUrls: ['./rep-explore-data.component.scss'],
    imports: [GeneTableSelectorComponent, RepExploreDataPanelComponent]
})
export class RepExploreDataComponent implements OnInit {

  constructor(
  ) { }

  ngOnInit(): void {
  }

}
