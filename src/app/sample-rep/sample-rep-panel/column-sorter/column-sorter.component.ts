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

@Component({
  selector: 'va-mat-table-column-sorter, button[va-mat-table-column-sorter]',
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
  columnNames: string[];
  @Input()
  saveName?: string;

  columnInfo: ColumnInfo[];

  constructor(private elementRef: ElementRef, private columnSorterService: ColumnSorterService) {}

  ngOnInit() {
    this.columnInfo = this.columns.map((currElement, index) => {
      return {
        id: currElement,
        name: this.columnNames[index],
        hidden: false,
      };
    });
    this.columnInfo = this.columnSorterService.loadSavedColumnInfo(this.columnInfo, this.saveName);
    this.emitColumns(false);
  }

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.classList += 'va-mat-button-no-input';
  }

  columnMenuDropped(event: CdkDragDrop<any>): void {
    moveItemInArray(this.columnInfo, event.item.data.columnIndex, event.currentIndex);
    this.emitColumns(true);
  }

  toggleSelectedColumn(columnId: string) {
    const colFound = this.columnInfo.find(col => col.id === columnId);
    colFound.hidden = !colFound.hidden;
    this.emitColumns(true);
  }

  private emitColumns(saveColumns: boolean) {
    // Only emit the columns on the next animation frame available
    window.requestAnimationFrame(() => {
      this.columnsChange.emit(this.columnInfo.filter(colInfo => !colInfo.hidden).map(colInfo => colInfo.id));
      if (saveColumns) {
        this.columnSorterService.saveColumnInfo(this.columnInfo, this.saveName);
      }
    });
  }
}
