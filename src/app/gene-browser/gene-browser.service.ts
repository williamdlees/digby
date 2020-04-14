import { Injectable} from '@angular/core';
import {GeneBrowserSelection} from './gene-browser.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneBrowserService {
  selectionUpdated = new Subject<GeneBrowserSelection>();

  constructor() { }
}
