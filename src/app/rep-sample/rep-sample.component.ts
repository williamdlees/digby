import { Component, OnInit } from '@angular/core';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { RepSamplePanelComponent } from './rep-sample-panel/rep-sample-panel.component';

@Component({
    selector: 'app-sample-rep',
    templateUrl: './rep-sample.component.html',
    styleUrls: ['./rep-sample.component.scss'],
    imports: [GeneTableSelectorComponent, RepSamplePanelComponent]
})
export class RepSampleComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
