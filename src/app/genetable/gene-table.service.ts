import { Injectable} from '@angular/core';
import {GeneTableSelection} from './gene-table.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneTableService {
  selectionUpdated = new Subject<GeneTableSelection>();

  constructor() { }
}
