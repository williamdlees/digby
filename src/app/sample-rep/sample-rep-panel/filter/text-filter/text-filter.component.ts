import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {FilterImplementation} from '../filter-implementation';
import {ColumnPredicate} from '../column-predicate';
import {IChoices} from '../ichoices';
import {Observable} from 'rxjs';
import {IDropdownSettings} from 'ng-multiselect-dropdown';

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
  encapsulation: ViewEncapsulation.None   // needed for css styling on mat-menu-panel
})
export class TextFilterComponent implements OnInit, AfterViewInit, FilterImplementation {
  @ViewChild('filterMenu') matMenuTrigger;
  @Input() columnName: string;
  @Input() choices$: Observable<IChoices>;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();
  selectedOperator: Operator;
  operand1Input = '';
  operand2Input = '';
  filterCleared = false;
  prevInput = { selectedInput: null, operand1Input: '', operand2Input: '' };
  operatorList: Operator[] = [
    { name: 'Begins with', operands: 2, operator: 'like', postfix: '%' },
    { name: 'Ends with', operands: 2, operator: 'like', prefix: '%' },
    { name: 'Includes', operands: 2, operator: 'like', prefix: '%', postfix: '%' },
    { name: 'Matches', operands: 2, operator: 'like' },
  ];
  selectedSort = null;
  choices: { id: number, text: string }[];
  dropdownSettings: IDropdownSettings = {
      itemsShowLimit: 1,
      allowSearchFilter: true,
      defaultOpen: false,
  };
  selectedItems = [];

  constructor() {

  }

  ngOnInit() {
    console.log('onInit: ' + this.columnName);

    if (this.choices$) {
      this.choices$.subscribe((c) => {
        if (c[this.columnName]) {
          this.choices = [];
          for (let i = 0; i < c[this.columnName].length; i++) {
            this.choices.push({ id: i, text: c[this.columnName][i] })
          }
        }
      });
    }
  }

  ngAfterViewInit() {
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

  onClearFilter() {
    this.selectedOperator = null;
    this.filterCleared = true;
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

  isDisabled(): boolean {
    if (!this.selectedOperator) {
      return !this.filterCleared;
    }
    if (this.selectedOperator.operands === 2) {
      return this.operand1Input.trim() === '';
    }
    if (this.selectedOperator.operands === 3) {
      return this.operand1Input.trim() === '' || this.operand2Input.trim() === '';
    }
  }

  generatePredicate(): ColumnPredicate {
    console.log('choices: ' + this.choices);
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
        value: (this.selectedOperator.prefix ? this.selectedOperator.prefix : '') +
          this.operand1Input +
          (this.selectedOperator.postfix ? this.selectedOperator.postfix : '')
      }];
    }

    return pred;
  }
}
