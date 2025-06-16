import {Component, OnInit, ViewChild, Input, Output, EventEmitter, ViewEncapsulation} from '@angular/core';
import { FilterImplementation } from '../filter-implementation';
import { ColumnPredicate } from '../column-predicate';
import { IChoices } from '../ichoices';
import { Observable } from 'rxjs';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { NgIf, NgFor } from '@angular/common';
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
  operator2?: string;
  prefix?: string;
  postfix?: string;
}

@Component({
    selector: 'app-number-filter',
    templateUrl: './number-filter.component.html',
    styleUrls: ['./number-filter.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling on mat-menu-panel
    ,
    imports: [MatIconButton, MatMenuTrigger, NgIf, MatIcon, MatMenu, FormsModule, MatButton, MatFormField, MatSelect, NgFor, MatOption, MatInput, NgMultiSelectDropDownModule]
})
export class NumberFilterComponent implements OnInit, FilterImplementation {
  @ViewChild('filterMenu') matMenuTrigger;
  @Input() columnName: string;
  @Input() choices$: Observable<IChoices>;
  @Input() clear$: Observable<null>;
  @Input() setFilter$: Observable<any>;
  @Input() showTextFilter = true;
  @Input() showSort = true;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();

  selectedOperator: Operator;
  operand1Input = '';
  operand2Input = '';
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

  constructor() { }

  ngOnInit() {
    if (this.choices$) {
      this.choices$.subscribe((c) => {
        if (typeof c !== 'undefined' && c[this.columnName]) {
          this.choices = [];
          for (let i = 0; i < c[this.columnName].length; i++) {
            this.choices.push({ id: i, text: c[this.columnName][i] });
          }
        }
      });
    }
    if (this.clear$) {
      this.clear$.subscribe((c) => {
          this.selectedOperator = null;
          this.selectedSort = null;
          this.selectedItems = [];
          this.filterCleared = true;
      });
    }
    if (this.setFilter$) {
      this.setFilter$.subscribe((filter) => {
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
      field: this.columnName,
      predicates: [],
      sort: { field: this.columnName, order: this.selectedSort }
    };

    if (this.selectedOperator && this.selectedOperator.operands === 2) {
      pred.predicates.push ({
        field: this.columnName,
        op: this.selectedOperator.operator,
        value: this.operand1Input
      });
    } else if (this.selectedOperator && this.selectedOperator.operands === 3) {
      pred.predicates.push({
          field: this.columnName,
          op: this.selectedOperator.operator,
          value: this.operand1Input < this.operand2Input ? this.operand1Input : this.operand2Input
        });
      pred.predicates.push({
          field: this.columnName,
          op: this.selectedOperator.operator2,
          value: this.operand1Input < this.operand2Input ? this.operand2Input : this.operand1Input
        });
    }

    if (this.selectedItems.length > 0) {
      pred.predicates.push({ field: this.columnName, op: 'in', value: this.selectedItems.map((x) => x.text) });
    }

    return pred;
  }
}
