import { Component, OnInit } from '@angular/core';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { GenExploreDataPanelComponent } from './gen-explore-data-panel/gen-explore-data-panel.component';

@Component({
    selector: 'app-gen-explore-data',
    templateUrl: './gen-explore-data.component.html',
    styleUrls: ['./gen-explore-data.component.scss'],
    imports: [GeneTableSelectorComponent, GenExploreDataPanelComponent]
})
export class GenExploreDataComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
