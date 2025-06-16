import {Component, OnInit} from '@angular/core';
import { GeneTableSelectorComponent } from '../gene-table-selector/gene-table-selector.component';
import { GenGeneTablePanelComponent } from './gen-gene-table-panel/gen-gene-table-panel.component';

@Component({
    selector: 'app-genetable',
    templateUrl: './gen-gene-table.component.html',
    styleUrls: ['./gen-gene-table.component.scss'],
    imports: [GeneTableSelectorComponent, GenGeneTablePanelComponent]
})
export class GenGeneTableComponent implements OnInit {

  ngOnInit() {
  }
}
