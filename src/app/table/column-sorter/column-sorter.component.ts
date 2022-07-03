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
  @Input()
  columns: string[];
  @Input()
  saveName?: string;
  @Input()
  columnInfo: ColumnInfo[];
  selectedColumnInfo: ColumnInfo[];
  classifiedColumnInfo: { [section: string] : ColumnInfo[]};
  sections: string[];

  private initialColumnInfo: ColumnInfo[];

  constructor(private elementRef: ElementRef, private columnSorterService: ColumnSorterService) {}

  ngOnInit() {
    const savedInfo = this.columnSorterService.loadSavedColumnInfo(this.columnInfo, this.saveName);
    const iNew = new Set(this.columnInfo.map((x) => x.id));
    const iSaved = new Set(savedInfo.map((x) => x.id));
    const sNew = new Set(this.columnInfo.map((x) => x.name));
    const sSaved = new Set(savedInfo.map((x) => x.name));
    this.initialColumnInfo = this.columnInfo.map(a => {return {...a}});

    if (!symmetricDifference(sNew, sSaved).size && !symmetricDifference(iNew, iSaved).size) {
      this.columnInfo = savedInfo;
    }

    this.selectedColumnInfo = this.columnInfo.filter(el => !el.hidden);
    this.reorderColumns();
    this.emitColumns(false);
  }

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.classList += 'va-mat-button-no-input';
  }

  // put selected columns at the front
  reorderColumns(): void {
    let newColumnInfo = this.selectedColumnInfo;
    newColumnInfo = newColumnInfo.concat(this.columnInfo.filter(el => el.hidden));

    this.classifiedColumnInfo = {};
    if ('section' in this.columnInfo[0]) {
     for (const el of this.columnInfo) {
       if (el.hidden) {
         if (!(el.section in this.classifiedColumnInfo)) {
           this.classifiedColumnInfo[el.section] = [];
         }
         this.classifiedColumnInfo[el.section].push(el)
       }
     }
    } else {
      this.classifiedColumnInfo['Selection'] = this.columnInfo.filter(el => el.hidden);
    }

    this.sections = Object.keys(this.classifiedColumnInfo)
    this.columnInfo = newColumnInfo;
  }

  columnMenuDropped(event: CdkDragDrop<any>): void {
    moveItemInArray(this.selectedColumnInfo, event.item.data.columnIndex, event.currentIndex);
    this.reorderColumns();
    this.emitColumns(true);
  }

  toggleSelectedColumn(columnId: string) {
    const colFound = this.columnInfo.find(col => col.id === columnId);
    colFound.hidden = !colFound.hidden;
    this.selectedColumnInfo = this.columnInfo.filter(el => !el.hidden);
    this.reorderColumns();
    this.emitColumns(true);
  }

  onResetColumns() {
    this.columnInfo = this.initialColumnInfo.map(a => {return {...a}});
    this.selectedColumnInfo = this.columnInfo.filter(el => !el.hidden);
    this.reorderColumns();
    this.emitColumns(true);
  }

  private emitColumns(saveColumns: boolean) {
    // Only emit the columns on the next animation frame available
    window.requestAnimationFrame(() => {
      const foo = this.columnInfo.filter(colInfo => !colInfo.hidden).map(colInfo => colInfo.id);
      this.columnsChange.emit(this.columnInfo.filter(colInfo => !colInfo.hidden).map(colInfo => colInfo.id));
      if (saveColumns) {
        this.columnSorterService.saveColumnInfo(this.columnInfo, this.saveName);
      }
    });
  }
}
