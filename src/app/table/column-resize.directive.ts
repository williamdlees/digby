import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  NgZone,
  input,
  output
} from '@angular/core';
import { Subject, fromEvent, takeUntil } from 'rxjs';

@Directive({ selector: '[appColumnResize]' })
export class ColumnResizeDirective implements OnInit, OnDestroy {
  readonly resizableTable = input<HTMLElement | null>(null);
  readonly onResizeEnd = output<number>();

  private isResizing = false;
  private startX!: number;
  private startWidth!: number;
  private column: HTMLElement;
  private table: HTMLElement | null = null;
  private resizer!: HTMLElement;
  private resizerWrapper!: HTMLElement;
  private destroy$ = new Subject<void>();
  private columnClass: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private zone: NgZone
  ) {
    this.column = this.el.nativeElement;
  }

  ngOnInit() {
    this.table = this.resizableTable() || this.findParentTable(this.column);

    if (!this.table) {
      console.error(
        'Parent table not found. Make sure the directive is applied to a th element within a table.'
      );
      return;
    }

    // Get the column class (e.g., mat-column-name)
    const classes = this.column.className.split(' ');
    this.columnClass = classes.find(c => c.startsWith('mat-column-')) || '';

    this.createResizer();
    this.initializeResizeListener();
  }

  private createResizer() {
    // Create a wrapper div that will contain the resizer
    this.resizerWrapper = this.renderer.createElement('div');
    this.renderer.addClass(this.resizerWrapper, 'resizer-wrapper');

    // Create the actual resizer inside the wrapper
    this.resizer = this.renderer.createElement('div');
    this.renderer.addClass(this.resizer, 'column-resizer');

    // Create a visual handle that appears on hover
    const handle = this.renderer.createElement('div');
    this.renderer.addClass(handle, 'resize-handle');

    // Append handle to resizer, resizer to wrapper, then wrapper to column
    this.renderer.appendChild(this.resizer, handle);
    this.renderer.appendChild(this.resizerWrapper, this.resizer);
    this.renderer.appendChild(this.column, this.resizerWrapper);

    // Set up event delegation
    this.renderer.listen(this.resizer, 'mouseover', (event: MouseEvent) => {
      const rect = this.resizer.getBoundingClientRect();
      const isNearEdge = event.clientX >= rect.right - 6;
      if (isNearEdge) {
        this.renderer.setStyle(handle, 'opacity', '1');
      }
    });

    this.renderer.listen(this.resizer, 'mouseout', () => {
      if (!this.isResizing) {
        this.renderer.setStyle(handle, 'opacity', '0');
      }
    });
  }

  private initializeResizeListener() {
    this.zone.runOutsideAngular(() => {
      fromEvent(this.resizer, 'mousedown')
        .pipe(takeUntil(this.destroy$))
        .subscribe((e: Event) => {
          const mouseEvent = e as MouseEvent;
          this.onMouseDown(mouseEvent);
          mouseEvent.stopImmediatePropagation();
        });

      fromEvent(document, 'mousemove')
        .pipe(takeUntil(this.destroy$))
        .subscribe((e: Event) => this.onMouseMove(e as MouseEvent));

      fromEvent(document, 'mouseup')
        .pipe(takeUntil(this.destroy$))
        .subscribe((e: Event) => this.onMouseUp(e as MouseEvent));
    });
  }

  private onMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = true;
    this.startX = e.pageX;

    // Get the current width from the element's style
    const currentWidth = this.column.style.width;
    this.startWidth = currentWidth ? parseInt(currentWidth, 10) : this.column.offsetWidth;

    console.log('Starting resize:', {
      currentStyleWidth: this.column.style.width,
      offsetWidth: this.column.offsetWidth,
      startWidth: this.startWidth
    });

    this.renderer.addClass(this.column, 'resizing');
    if (this.table) {
      this.renderer.addClass(this.table, 'resizing');
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isResizing) return;
    const diff = e.pageX - this.startX;
    const newWidth = Math.max(50, this.startWidth + diff);
    this.updateColumnWidth(newWidth);
  }

  private onMouseUp(e: MouseEvent) {
    if (!this.isResizing) return;
    this.isResizing = false;
    this.renderer.removeClass(this.column, 'resizing');
    if (this.table) {
      this.renderer.removeClass(this.table, 'resizing');
    }
    const diff = e.pageX - this.startX;
    const newWidth = Math.max(50, this.startWidth + diff);

    // Emit the EventEmitter output for any component listeners
    this.onResizeEnd.emit(newWidth);

    // Also dispatch a custom DOM event for TableResizeDirective
    const columnName = this.columnClass.replace('mat-column-', '');
    const customEvent = new CustomEvent('columnResized', {
      detail: { columnName, width: newWidth },
      bubbles: true
    });
    this.column.dispatchEvent(customEvent);
  }

  private updateColumnWidth(width: number) {
    if (!this.columnClass) return;

    // Update all cells in this column
    const cells = this.table?.getElementsByClassName(this.columnClass);
    if (cells) {
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i] as HTMLElement;
        this.renderer.setStyle(cell, 'width', `${width}px`);
        this.renderer.setStyle(cell, 'min-width', `${width}px`);
        this.renderer.setStyle(cell, 'max-width', `${width}px`);
      }
    }
  }

  private findParentTable(element: HTMLElement): HTMLElement | null {
    while (element && element.tagName !== 'TABLE') {
      element = element.parentElement as HTMLElement;
      if (!element) return null;
    }
    return element;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
