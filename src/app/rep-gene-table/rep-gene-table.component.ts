import { Component, OnInit } from '@angular/core';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { RepGeneTablePanelComponent } from './rep-gene-table-panel/rep-gene-table-panel.component';

@Component({
    selector: 'app-rep-gene-table',
    templateUrl: './rep-gene-table.component.html',
    styleUrls: ['./rep-gene-table.component.scss'],
    imports: [GeneTableSelectorComponent, RepGeneTablePanelComponent]
})
export class RepGeneTableComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
