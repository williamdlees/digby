import { Injectable} from '@angular/core';
import { GenGeneSelected } from './gen-gene-selected.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class GenGeneSelectedService {
  selection = new BehaviorSubject<GenGeneSelected>({names: []});
  source = this.selection.asObservable();

  constructor() {
  }
}
