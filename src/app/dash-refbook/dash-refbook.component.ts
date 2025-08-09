import { Component, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { SpeciesGeneSelection } from './species-gene-selector/species-gene-selector.model';
import { SpeciesGeneSelectorComponent } from './species-gene-selector/species-gene-selector.component';
import { DashRefbookOverviewComponent } from './dash-refbook-overview/dash-refbook-overview.component';
import { DashRefbookAlignmentComponent } from './dash-refbook-alignment/dash-refbook-alignment.component';
import { RefbookService } from '../../../projects/digby-swagger-client/api/refbook.service';

@Component({
  selector: 'app-dash-refbook',
  templateUrl: './dash-refbook.component.html',
  styleUrls: ['./dash-refbook.component.scss'],
  standalone: true,
  imports: [
    MatTabsModule,
    SpeciesGeneSelectorComponent,
    DashRefbookOverviewComponent,
    DashRefbookAlignmentComponent
  ],
  providers: [
    {
      provide: RefbookService,
      useClass: RefbookService
    }
  ]
})
export class DashRefbookComponent implements OnInit {
  selection: SpeciesGeneSelection = {
    species: '', chain: '', asc: ''
    };

  constructor(  ) {

  }

  ngOnInit(): void {
  }

  ascChange(selection: SpeciesGeneSelection) {
    console.log('ascChange in parent', selection);
    // ngOnChanges will only detect the change if the object reference changes
    this.selection = {species: selection.species, chain: selection.chain, asc: selection.asc};
  }

}
