import {Component, OnInit, ViewChild, Output, EventEmitter, ViewEncapsulation, input} from '@angular/core';
import { FilterImplementation } from '../filter-implementation';
import { ColumnPredicate } from '../column-predicate';
import { IChoices } from '../ichoices';
import { Observable } from 'rxjs';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';

import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatInput, MatSuffix } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';

/**
 * biPredicate => Will become a (value) => boolean with curryfication --> the operand will disappear in Output
 * triPredicate => Will become a (value) => boolean with curryfication --> the two operand will disappear in
 * Output
 */
class Operator {
  name: string;
  operands: number;
  operator: string;
  operator2?: string;
  prefix?: string;
  postfix?: string;
}


@Component({
    selector: 'app-date-filter',
    templateUrl: './date-filter.component.html',
    styleUrls: ['./date-filter.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling on mat-menu-panel
    ,
    imports: [MatIconButton, MatMenuTrigger, MatIcon, MatMenu, FormsModule, MatButton, MatFormField, MatSelect, MatOption, MatInput, MatDatepickerInput, MatDatepickerToggle, MatSuffix, MatDatepicker, NgMultiSelectDropDownModule]
})
export class DateFilterComponent implements OnInit, FilterImplementation {
  @ViewChild('filterMenu') matMenuTrigger;
  readonly columnName = input<string>(undefined);
  readonly choices$ = input<Observable<IChoices>>(undefined);
  readonly clear$ = input<Observable<null>>(undefined);
  readonly setFilter$ = input<Observable<any>>(undefined);
  readonly showTextFilter = input(true);
  readonly showSort = input(true);
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();

  selectedOperator: Operator;
  operand1Input;
  operand2Input;
  filterCleared = false;
  operatorList: Operator[] = [
    { name: 'Less than',  operands: 2, operator: '<' },
    { name: 'Greater than', operands: 2, operator: '>' },
    { name: 'Equal to', operands: 2, operator: '==' },
    { name: 'Not equal to', operands: 2, operator: '!=' },
    { name: 'Between', operands: 3, operator: '>', operator2: '<' },
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
  }

  onValidation() {
    this.predicateEmitter.emit(this.generatePredicate());

    if (this.matMenuTrigger) {
      this.matMenuTrigger.closed.emit();
    }
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

  onClearFilter() {
    this.selectedOperator = null;
    this.filterCleared = true;
  }

  onClearSelection() {
    this.selectedItems = [];
  }

  generatePredicate(): ColumnPredicate {
    const pred = {
      field: this.columnName(),
      predicates: [],
      sort: { field: this.columnName(), order: this.selectedSort }
    };

    const columnName = this.columnName();
    if (this.selectedOperator && this.selectedOperator.operands === 2) {
      pred.predicates.push ({
        field: columnName,
        op: this.selectedOperator.operator,
        value: this.operand1Input
      });
    } else if (this.selectedOperator && this.selectedOperator.operands === 3) {
      pred.predicates.push({
          field: columnName,
          op: this.selectedOperator.operator,
          value: this.operand1Input < this.operand2Input ? this.operand1Input : this.operand2Input
        });
      pred.predicates.push({
          field: columnName,
          op: this.selectedOperator.operator2,
          value: this.operand1Input < this.operand2Input ? this.operand2Input : this.operand1Input
        });
    }

    if (this.selectedItems.length > 0) {
      pred.predicates.push({ field: columnName, op: 'in', value: this.selectedItems.map((x) => x.text) });
    }

    return pred;
  }
}
