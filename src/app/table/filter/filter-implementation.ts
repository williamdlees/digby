import {Input, Output, EventEmitter, Component} from '@angular/core';
import { ColumnPredicate } from './column-predicate';
import { IChoices } from './ichoices';
import { Observable } from 'rxjs';

@Component({
    template: '',
    standalone: false
})export class FilterImplementation {
  @Input() columnName: string;
  @Input() choices$: Observable<IChoices>;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();
}
