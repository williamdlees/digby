// Advertises the current filters applied to GenSamples

import { Injectable} from '@angular/core';
import { RepSampleFilter} from './rep-sample-filter.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class RepSampleFilterService {
  selection = new BehaviorSubject<RepSampleFilter>({filters: []});
  source = this.selection.asObservable();

  constructor() {
  }
}
