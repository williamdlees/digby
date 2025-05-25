import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {GeneTableSelection} from '../../gene-table-selector/gene-table-selector.model';
import {GeneTableSelectorService} from '../../gene-table-selector/gene-table-selector.service';
import { GenomicService } from '../../../../dist/digby-swagger-client';
import {MatTable} from '@angular/material/table';
import {debounceTime} from "rxjs/operators";
import { MatTabsModule } from '@angular/material/tabs';


@Component({
  selector: 'app-dash-refbook-panel',
  templateUrl: './dash-refbook-panel.component.html',
  styleUrls: ['./dash-refbook-panel.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})

export class DashRefbookPanelComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {

  }

}
