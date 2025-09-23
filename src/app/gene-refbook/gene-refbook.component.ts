import { Component, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { SpeciesGeneSelection } from '../dash-refbook/species-gene-selector/species-gene-selector.model';
import { SpeciesGeneSelectorComponent } from '../dash-refbook/species-gene-selector/species-gene-selector.component';
import { GeneRefbookOverviewComponent } from './gene-refbook-overview/gene-refbook-overview.component';
import { RefbookService } from '../../../projects/digby-swagger-client/api/refbook.service';

@Component({
  selector: 'app-dash-refbook',
  templateUrl: './gene-refbook.component.html',
  styleUrls: ['./gene-refbook.component.scss'],
  standalone: true,
  imports: [
    MatTabsModule,
    SpeciesGeneSelectorComponent,
    GeneRefbookOverviewComponent,
  ],
  providers: [
    {
      provide: RefbookService,
      useClass: RefbookService
    }
  ]
})
export class GeneRefbookComponent implements OnInit {
  selection: SpeciesGeneSelection = {
    species: '', chain: '', asc: ''
    };

  constructor(  ) {

  }

  ngOnInit(): void {

  }

  ascChange(selection: SpeciesGeneSelection) {
    this.selection = {species: selection.species, chain: selection.chain, asc: selection.asc};
  }

}
