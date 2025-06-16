import { Component, OnInit } from '@angular/core';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { GenSamplePanelComponent } from './gen-sample-panel/gen-sample-panel.component';

@Component({
    selector: 'app-gen-sample',
    templateUrl: './gen-sample.component.html',
    styleUrls: ['./gen-sample.component.scss'],
    imports: [GeneTableSelectorComponent, GenSamplePanelComponent]
})
export class GenSampleComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
