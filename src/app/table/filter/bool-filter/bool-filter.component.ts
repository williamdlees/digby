import {
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
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatMenuModule, MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatIconButton, MatButton } from '@angular/material/button';

import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

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
    selector: 'app-bool-filter',
    templateUrl: './bool-filter.component.html',
    styleUrls: ['./bool-filter.component.css'],
    encapsulation: ViewEncapsulation.None // needed for css styling on mat-menu-panel
    ,
    imports: [MatIconButton, MatMenuTrigger, MatIcon, MatMenu, FormsModule, MatButton, NgMultiSelectDropDownModule]
})
export class BoolFilterComponent implements OnInit, FilterImplementation {
  @ViewChild('filterMenu') matMenuTrigger;
  @Input() columnName: string;
  @Input() choices$: Observable<IChoices>;
  @Input() clear$: Observable<null>;
  @Input() setFilter$: Observable<any>;
  @Input() showTextFilter = true;
  @Input() showSort = true;
  @Output() predicateEmitter = new EventEmitter<ColumnPredicate>();

  filterCleared = false;
  selectedSort = null;
  choices: { id: number, text: string }[];
  dropdownSettings: IDropdownSettings = {
      itemsShowLimit: 2,
      allowSearchFilter: true,
      defaultOpen: false,
  };
  selectedItems = [];

  constructor() {
  }

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
          this.selectedSort = null;
          this.selectedItems = [];
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

  onClearSelection() {
    this.selectedItems = [];
  }

  generatePredicate(): ColumnPredicate {
    const pred = {
      field: this.columnName,
      predicates: [],
      sort: { field: this.columnName, order: this.selectedSort }
    };

    if (this.selectedItems.length > 0) {
      pred.predicates.push({ field: this.columnName, op: 'in', value: this.selectedItems.map((x) => (typeof(x.text) === 'boolean' ? (x.text ? '1' : '0') : x.text)) });
    }

    return pred;
  }
}
