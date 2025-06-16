import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  input,
  output
} from '@angular/core';
import {FilterImplementation} from '../filter-implementation';
import {ColumnPredicate} from '../column-predicate';
import {IChoices} from '../ichoices';
import {Observable} from 'rxjs';
import { IDropdownSettings, MultiSelectComponent, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';

import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';

/**
 * biPredicate => Will become a (value) => boolean with curryfication --> the operand will disappear in Output
 * triPredicate => Will become a (value) => boolean with curryfication --> the two operand will disappear in
 * Output
 */
class Operator {
  name: string;
  operands: number;
  operator: string;
  prefix?: string;
  postfix?: string;
}

@Component({
    selector: 'app-text-filter',
    templateUrl: './text-filter.component.html',
    styleUrls: ['./text-filter.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling on mat-menu-panel
    ,
    imports: [MatIconButton, MatMenuTrigger, MatIcon, MatMenu, FormsModule, MatButton, MatFormField, MatSelect, MatOption, MatInput, NgMultiSelectDropDownModule]
})
export class TextFilterComponent implements OnInit, FilterImplementation {
  @ViewChild('filterMenu') matMenuTrigger;
  @ViewChild(MultiSelectComponent) ngMultiSelect;
  readonly columnName = input<string>(undefined);
  readonly choices$ = input<Observable<IChoices>>(undefined);
  readonly clear$ = input<Observable<null>>(undefined);
  readonly setFilter$ = input<Observable<any>>(undefined);
  readonly showTextFilter = input(true);
  readonly showSort = input(true);
  readonly predicateEmitter = output<ColumnPredicate>();

  selectedOperator: Operator;
  operand1Input = '';
  operand2Input = '';
  filterCleared = false;
  operatorList: Operator[] = [
    { name: 'Begins with', operands: 2, operator: 'ilike', postfix: '%' },
    { name: 'Ends with', operands: 2, operator: 'ilike', prefix: '%' },
    { name: 'Includes', operands: 2, operator: 'ilike', prefix: '%', postfix: '%' },
    { name: 'Matches', operands: 2, operator: 'ilike' },
  ];
  selectedSort = null;
  choices: { id: number, text: string }[];
  dropdownSettings: IDropdownSettings = {
      itemsShowLimit: 6,
      allowSearchFilter: true,
      defaultOpen: false,
  };
  selectedItems = [];

  constructor() {
  }

  ngOnInit() {
    const choices$ = this.choices$();
    if (choices$) {
      choices$.subscribe((c) => {
        if (typeof c !== 'undefined' && c[this.columnName()]) {
          this.choices = [];
          for (let i = 0; i < c[this.columnName()].length; i++) {
            this.choices.push({ id: i, text: c[this.columnName()][i] });
          }
        }
      });
    }
    const clear$ = this.clear$();
    if (clear$) {
      clear$.subscribe((c) => {
          this.selectedOperator = null;
          this.selectedSort = null;
          this.selectedItems = [];
          this.filterCleared = true;
      });
    }
    const setFilter$ = this.setFilter$();
    if (setFilter$) {
      setFilter$.subscribe((filter) => {
        if (filter) {
          if (filter.op1.length > 0) {
            this.selectedOperator = filter.operator;
            this.operand1Input = filter.op1;
            this.operand2Input = filter.op2;
            this.onValidation();
          } else {
            this.selectedOperator = null;
            this.operand1Input = '';
            this.operand2Input = '';
            this.onValidation();
          }
        }
      });
    }
  }

  onValidation() {
    this.predicateEmitter.emit(this.generatePredicate());

    if (this.matMenuTrigger) {
      this.matMenuTrigger.closed.emit();
    }
  }

  onClearFilter() {
    this.selectedOperator = null;
    this.filterCleared = true;
  }

  onClearSelection() {
    this.selectedItems = [];
  }

  onSortAsc() {
    this.selectedSort = 'asc';
    this.predicateEmitter.emit(this.generatePredicate());

    if (this.matMenuTrigger) {
      this.matMenuTrigger.closed.emit();
    }
  }

  onSortDesc() {
    this.selectedSort = 'desc';
    this.predicateEmitter.emit(this.generatePredicate());

    if (this.matMenuTrigger) {
      this.matMenuTrigger.closed.emit();
    }
  }

  onSortClear() {
    this.selectedSort = null;
    this.predicateEmitter.emit(this.generatePredicate());

    if (this.matMenuTrigger) {
      this.matMenuTrigger.closed.emit();
    }
  }

  generatePredicate(): ColumnPredicate {
    const pred = {
      field: this.columnName(),
      predicates: [],
      sort: { field: this.columnName(), order: this.selectedSort }
    };

    const columnName = this.columnName();
    if (this.selectedOperator && this.selectedOperator.operands === 2) {
      pred.predicates.push({
        field: columnName,
        op: this.selectedOperator.operator,
        value: (this.selectedOperator.prefix ? this.selectedOperator.prefix : '') +
          this.operand1Input +
          (this.selectedOperator.postfix ? this.selectedOperator.postfix : '')
      });
    }

    if (this.selectedItems.length > 0) {
      pred.predicates.push({ field: columnName, op: 'in', value: this.selectedItems.map((x) => x.text) });
    }

    return pred;
  }

  // compare functions to set values in mat-select:  https://github.com/angular/components/issues/10214
  compareFn: ((f1: any, f2: any) => boolean) | null = this.compareByValue;

  compareByValue(f1: any, f2: any) {
    return f1 && f2 && f1.name === f2.name;
  }
}
