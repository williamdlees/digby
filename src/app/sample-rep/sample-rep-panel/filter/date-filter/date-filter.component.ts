import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { FilterImplementation } from '../filter-implementation';
import { ColumnPredicate } from '../column-predicate';
import { IChoices } from '../ichoices';
import { Observable } from 'rxjs';

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
  styleUrls: ['./date-filter.component.css']
})
export class DateFilterComponent implements OnInit, FilterImplementation {
  @ViewChild('filterMenu') matMenuTrigger;
  @Input() columnName: string;
  @Input() choices$: Observable<IChoices>;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();
  selectedOperator: Operator;

  operand1Input;
  operand2Input;
  filterCleared = false;
  prevInput = { selectedInput: null, operand1Input: '', operand2Input: '' };
  operatorList: Operator[] = [
    { name: 'Less than',  operands: 2, operator: '<' },
    { name: 'Greater than', operands: 2, operator: '>' },
    { name: 'Equal to', operands: 2, operator: '==' },
    { name: 'Not equal to', operands: 2, operator: '!=' },
    { name: 'Between', operands: 3, operator: '>', operator2: '<' },
  ];
  selectedSort = null;

  constructor() { }

  ngOnInit() {
  }

  onCancel() {
    this.selectedOperator = this.prevInput.selectedInput;
    this.operand1Input = this.prevInput.operand1Input;
    this.operand2Input = this.prevInput.operand2Input;
    this.matMenuTrigger.closed.emit();
  }

  onValidation() {
    this.predicateEmitter.emit(this.generatePredicate());
    this.matMenuTrigger.closed.emit();
  }

  onSortAsc() {
    this.selectedSort = 'asc';
    this.predicateEmitter.emit(this.generatePredicate());
    this.matMenuTrigger.closed.emit();
  }

  onSortDesc() {
    this.selectedSort = 'desc';
    this.predicateEmitter.emit(this.generatePredicate());
    this.matMenuTrigger.closed.emit();
  }

  onSortClear() {
    this.selectedSort = null;
    this.predicateEmitter.emit(this.generatePredicate());
    this.matMenuTrigger.closed.emit();
  }

  onClearFilter() {
    this.selectedOperator = null;
    this.filterCleared = true;
  }

  isDisabled(): boolean {
    if (!this.selectedOperator) {
      return !this.filterCleared;
    }
    if (this.selectedOperator.operands === 2) {
      if (!this.operand1Input) {
        return true;
      }
      return false;
    }
    if (this.selectedOperator.operands === 2) {
      if (!(this.operand1Input && this.operand2Input)) {
        return true;
      }
      return false;
    }
  }

  generatePredicate(): ColumnPredicate {
    this.prevInput.selectedInput = this.selectedOperator;
    this.prevInput.operand1Input = this.operand1Input;
    this.prevInput.operand2Input = this.operand2Input;

    const pred = {
      field: this.columnName,
      predicates: [],
      sort: { field: this.columnName, order: this.selectedSort }
    };

    if (this.selectedOperator && this.selectedOperator.operands === 2) {
      pred.predicates = [{
        field: this.columnName,
        op: this.selectedOperator.operator,
        value: this.operand1Input
      }];
    } else if (this.selectedOperator && this.selectedOperator.operands === 3) {
      pred.predicates = [
        {
          field: this.columnName,
          op: this.selectedOperator.operator,
          value: this.operand1Input
        },
        {
          field: this.columnName,
          op: this.selectedOperator.operator2,
          value: this.operand2Input
        },
      ];
    }

    return pred;
  }
}
