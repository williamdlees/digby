// Adapted from https://medium.com/vendasta/wrapping-angular-material-table-styling-it-once-drag-drop-sorting-b1765c995b40

import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  EventEmitter,
  Output,
  ViewEncapsulation,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ColumnSorterService, ColumnInfo } from './column-sorter.service';
import {areListsEqual} from '../../shared/struct_utils';

function symmetricDifference(setA, setB) {
    const _difference = new Set(setA);
    for (const elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem);
        } else {
            _difference.add(elem);
        }
    }
    return _difference;
}

@Component({
  selector: 'digby-table-column-sorter, button[digby-table-column-sorter]',
  templateUrl: './column-sorter.component.html',
  styleUrls: ['./column-sorter.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ColumnSorterService],
})
export class ColumnSorterComponent implements OnInit, AfterViewInit {
  @Output()
  columnsChange: EventEmitter<string[]> = new EventEmitter<string[]>();
  //@Input()
  //columns: string[];
  @Input()
  saveName?: string;
  //@Input()
  //columnInfo: ColumnInfo[];

  private _columns: string[];

  @Input() set columns(value: string[]) {

     this._columns = value;
  }

  get columns(): string[] {

      return this._columns;
  }

  private _columnInfo: ColumnInfo[];

  @Input() set columnInfo(value: ColumnInfo[]) {
     console.log('set columnInfo');
     this._columnInfo = value;
     setTimeout(() => {
      this.onResetColumns();
     }, 0);
  }

  get columnInfo(): ColumnInfo[] {

      return this._columnInfo;
  }

  selectedColumnInfo: ColumnInfo[];
  classifiedColumnInfo: { [section: string] : ColumnInfo[]};
  sections: string[];
  private internalColumnInfo: ColumnInfo[];

  constructor(private elementRef: ElementRef, private columnSorterService: ColumnSorterService) {}

  ngOnInit() {
    const savedInfo = this.columnSorterService.loadSavedColumnInfo(this.columnInfo, this.saveName);
    const iNew = new Set(this.columnInfo.map((x) => x.id));
    const iSaved = new Set(savedInfo.map((x) => x.id));
    const sNew = new Set(this.columnInfo.map((x) => x.name));
    const sSaved = new Set(savedInfo.map((x) => x.name));
    this.internalColumnInfo = this.columnInfo.map(a => {return {...a}});

    if (!symmetricDifference(sNew, sSaved).size && !symmetricDifference(iNew, iSaved).size) {
      this.internalColumnInfo = savedInfo;
    }

    this.selectedColumnInfo = this.internalColumnInfo.filter(el => !el.hidden);
    this.reorderColumns();
    this.emitColumns(false);
  }

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.classList += 'va-mat-button-no-input';
  }

  // put selected columns at the front
  reorderColumns(): void {
    let newColumnInfo = this.selectedColumnInfo;
    newColumnInfo = newColumnInfo.concat(this.internalColumnInfo.filter(el => el.hidden));

    this.classifiedColumnInfo = {};
    if ('section' in this.internalColumnInfo[0]) {
     for (const el of this.internalColumnInfo) {
       if (el.hidden) {
         if (!(el.section in this.classifiedColumnInfo)) {
           this.classifiedColumnInfo[el.section] = [];
         }
         this.classifiedColumnInfo[el.section].push(el)
       }
     }
    } else {
      this.classifiedColumnInfo['Selection'] = this.internalColumnInfo.filter(el => el.hidden);
    }

    this.sections = Object.keys(this.classifiedColumnInfo)
    this.internalColumnInfo = newColumnInfo;
  }

  columnMenuDropped(event: CdkDragDrop<any>): void {
    moveItemInArray(this.selectedColumnInfo, event.item.data.columnIndex, event.currentIndex);
    this.reorderColumns();
    this.emitColumns(true);
  }

  toggleSelectedColumn(columnId: string) {
    const colFound = this.internalColumnInfo.find(col => col.id === columnId);
    colFound.hidden = !colFound.hidden;
    this.selectedColumnInfo = this.internalColumnInfo.filter(el => !el.hidden);
    this.reorderColumns();
    this.emitColumns(true);
  }

  onResetColumns() {
    const currentColumnIds = this.internalColumnInfo.map(col => col.id);
    const newColumnIds = this.columnInfo.map(col => col.id);

    if (!areListsEqual(currentColumnIds, newColumnIds)) {
      this.internalColumnInfo = this.columnInfo.map(a => {return {...a}});
      this.selectedColumnInfo = this.columnInfo.filter(el => !el.hidden);
    }

    this.reorderColumns();
    this.emitColumns(true);
  }

  private emitColumns(saveColumns: boolean) {
    // Only emit the columns on the next animation frame available
    //setTimeout(() => {
      const foo = this.internalColumnInfo.filter(colInfo => !colInfo.hidden).map(colInfo => colInfo.id);
      console.log('emit');
      this.columnsChange.emit(this.internalColumnInfo.filter(colInfo => !colInfo.hidden).map(colInfo => colInfo.id));
      if (saveColumns) {
        this.columnSorterService.saveColumnInfo(this.internalColumnInfo, this.saveName);
      }
    //}, 0);
  }
}
