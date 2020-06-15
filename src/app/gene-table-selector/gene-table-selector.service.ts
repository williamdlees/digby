import { Injectable} from '@angular/core';
import {GeneTableSelection} from './gene-table-selector.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class GeneTableSelectorService {
  selection = new BehaviorSubject<GeneTableSelection>({species: 'Human', refSeqs: ['Human_IGH'], repSeqs: ['Human_IGH']});
  source = this.selection.asObservable();

  constructor() {
  }
}
