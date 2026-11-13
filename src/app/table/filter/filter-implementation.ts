import {Output, EventEmitter, Component, input, ChangeDetectionStrategy} from '@angular/core';
import { ColumnPredicate } from './column-predicate';
import { IChoices } from './ichoices';
import { Observable } from 'rxjs';

@Component({
    template: '',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})export class FilterImplementation {
  readonly columnName = input<string>(undefined);
  readonly choices$ = input<Observable<IChoices>>(undefined);
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();
}
