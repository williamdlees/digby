import { Injectable} from '@angular/core';
import { RepSampleSelected } from './rep-sample-selected.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RepSampleSelectedService {
  selection = new BehaviorSubject<RepSampleSelected>({ids: []});
  source = this.selection.asObservable();

  constructor() {
  }
}
