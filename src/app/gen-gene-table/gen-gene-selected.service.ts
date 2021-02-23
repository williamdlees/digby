import { Injectable} from '@angular/core';
import { GenGeneSelected } from './gen-gene-selected.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GenGeneSelectedService {
  selection = new BehaviorSubject<GenGeneSelected>({names: [], onlySelected: false});
  source = this.selection.asObservable();

  constructor() {
  }
}
