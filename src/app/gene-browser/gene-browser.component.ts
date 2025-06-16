import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { GeneBrowserPanelComponent } from './gene-browser-panel/gene-browser-panel.component';

@Component({
    selector: 'app-gene-browser',
    templateUrl: './gene-browser.component.html',
    styleUrls: ['./gene-browser.component.scss'],
    imports: [GeneTableSelectorComponent, GeneBrowserPanelComponent]
})
export class GeneBrowserComponent implements OnInit {
  constructor() { }

  ngOnInit() {
  }

}
