// Advertises the current filters applied to GenSamples

import { Injectable} from '@angular/core';
import { GenSampleFilter} from './gen-sample-filter.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GenSampleFilterService {
  selection = new BehaviorSubject<GenSampleFilter>({filters: []});
  source = this.selection.asObservable();

  constructor() {
  }
}
