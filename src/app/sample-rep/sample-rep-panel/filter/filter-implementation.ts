import { Input, Output, EventEmitter } from '@angular/core';
import { ColumnPredicate } from './column-predicate';
import { IChoices } from './ichoices';
import { Observable } from 'rxjs';

export class FilterImplementation {
  @Input() columnName: string;
  @Input() choices$: Observable<IChoices>;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();
}
