import { Injectable} from '@angular/core';
import { RepGeneSelected } from './rep-gene-selected.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RepGeneSelectedService {
  selection = new BehaviorSubject<RepGeneSelected>({names: []});
  source = this.selection.asObservable();

  constructor() {
  }
}
