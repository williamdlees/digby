import { Injectable} from '@angular/core';
import {GeneTableSelection} from './gene-table-selector.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneTableSelectorService {
  selection = new BehaviorSubject<GeneTableSelection>({
    species: 'Human',
    datasets: [],
    assemblies: [],
    repSeqs: ['IGH'],
    repDatasetDescriptions: [{ dataset: 'IGH', description: ''}],
  });
  source = this.selection.asObservable();

  constructor() {
  }
}
