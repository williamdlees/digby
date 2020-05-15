import { Input, Output, EventEmitter } from '@angular/core';
import { ColumnPredicate } from './column-predicate';
export class FilterImplementation {
  @Input() columnName: string;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();
}
