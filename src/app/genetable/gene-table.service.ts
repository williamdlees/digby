import { Injectable} from '@angular/core';
import {GeneTableSelection} from './gene-table.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class GeneTableService {
  selection = new BehaviorSubject<GeneTableSelection>({species: 'Human', refSeqs: ['Human_IGH'], repSeqs: ['Human_IGH'], imgt: true, novel: true, full: true, filter: ''});
  source = this.selection.asObservable();

  constructor() {
  }
}
