import { Injectable} from '@angular/core';
import { GenSampleSelected } from './gen-sample-selected.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class GenSampleSelectedService {
  selection = new BehaviorSubject<GenSampleSelected>({ids: []});
  source = this.selection.asObservable();

  constructor() {
  }
}
