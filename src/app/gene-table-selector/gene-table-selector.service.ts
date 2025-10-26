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
    genDatasetDescriptions: [{ dataset: 'IGH', description: ''}],
    assemblies: ['igh'],
    repSeqs: ['IGH'],
    repDatasetDescriptions: [{ dataset: 'IGH', description: ''}],
    commonDatasets: []
  });
  source = this.selection.asObservable();

  constructor() {
  }
}
