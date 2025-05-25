import { Component, OnInit } from '@angular/core';
import { SpeciesGeneSelection } from './species-gene-selector/species-gene-selector.model';


@Component({
  selector: 'app-dash-refbook',
  templateUrl: './dash-refbook.component.html',
  styleUrls: ['./dash-refbook.component.scss'],
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
