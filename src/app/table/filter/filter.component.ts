import { Component, OnInit, ViewChild, Input, Type, Output, EventEmitter } from '@angular/core';
import { TextFilterComponent } from './text-filter/text-filter.component';
import { NumberFilterComponent } from './number-filter/number-filter.component';
import { DateFilterComponent } from './date-filter/date-filter.component';
import { BoolFilterComponent } from './bool-filter/bool-filter.component';

import { FilterImplementation } from './filter-implementation';
import { FilterMode } from './filter-mode.enum';
import { ColumnPredicate } from './column-predicate';
import { IChoices } from './ichoices';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css'],
  exportAs: 'menuInOtherComponent',
})
export class FilterComponent implements OnInit {
  @Input() columnName: string;
  @Input() choices$: Observable<IChoices>;
  @Input() filterMode: FilterMode;
  @Input() showTextFilter = true;
  @Input() showSort = true;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();
  filterImplementationComponent: Type<FilterImplementation>;
  inputs = null;
  outputs = {
    predicateEmitter: columnPredicate => this.predicateEmitter.emit(columnPredicate),
  };

  constructor() { };

  ngOnInit() {
    this.inputs = {
      columnName: this.columnName,
      choices$: this.choices$,
      showTextFilter: this.showTextFilter,
      showSort: this.showSort,
    };

    switch (this.filterMode) {
      case FilterMode.TEXT_MODE:
        this.filterImplementationComponent = TextFilterComponent;
        break;
      case FilterMode.NUMBER_MODE:
        this.filterImplementationComponent = NumberFilterComponent;
        break;
      case FilterMode.DATE_MODE:
        this.filterImplementationComponent = DateFilterComponent;
        break;
      case FilterMode.BOOL_MODE:
        this.filterImplementationComponent = BoolFilterComponent;
        break;
    }
  }

}
