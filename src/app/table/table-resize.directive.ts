import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { TableParamsStorageService } from './table-params-storage-service';

@Directive({
    selector: '[appTableResize]',
    providers: [TableParamsStorageService]
})
export class TableResizeDirective implements OnInit, OnDestroy {
  @Input('appTableResize') storageKey: string = '';

  private resizeEvents = new Map<string, string>();
  private resizeObserver: MutationObserver;
  private isInitialized = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private tableParamsStorageService: TableParamsStorageService
  ) {}

  ngOnInit() {
    if (this.storageKey) {
      this.resizeEvents = this.tableParamsStorageService.loadSavedInfo(this.resizeEvents, this.storageKey);
      this.setupResizeHandling();
      this.setupMutationObserver();
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeHandling() {
    // Listen for columnResized custom events from appColumnResize directives
    this.renderer.listen(this.el.nativeElement, 'columnResized', (event: CustomEvent) => {
      const { columnName, width } = event.detail;
      this.onResizeEnd(columnName, width);
    });
  }

  private setupMutationObserver() {
    // Observe changes to the table to apply saved sizes when data loads
    this.resizeObserver = new MutationObserver((mutations) => {
      const hasNewRows = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          ((node as Element).classList.contains('mat-row') ||
           (node as Element).classList.contains('mat-mdc-row') ||
           (node as Element).tagName === 'MAT-ROW')
        )
      );

      // Apply widths when new rows are detected
      if (hasNewRows) {
        setTimeout(() => this.applyResizes(), 100);
        if (!this.isInitialized) {
          this.isInitialized = true;
        }
      }

      // Fallback: If we've detected several mutations but no rows, try applying anyway
      if (!this.isInitialized && mutations.length > 3) {
        setTimeout(() => this.applyResizes(), 200);
        this.isInitialized = true;
      }
    });

    this.resizeObserver.observe(this.el.nativeElement, {
      childList: true,
      subtree: true
    });

    // Also apply immediately if table already has content
    setTimeout(() => {
      const existingRows = this.el.nativeElement.querySelector('.mat-row, .mat-mdc-row, mat-row');
      if (existingRows) {
        this.applyResizes();
        this.isInitialized = true;
      } else {
        // Extended fallback - try again after 2 seconds
        setTimeout(() => {
          if (!this.isInitialized) {
            this.applyResizes();
            this.isInitialized = true;
          }
        }, 2000);
      }
    }, 500);
  }

  private onResizeEnd(columnName: string, width: number): void {
    const cssValue = width + 'px';
    this.updateColumnWidth(columnName, cssValue);
    this.resizeEvents.set(columnName, cssValue);
    this.tableParamsStorageService.saveInfo(this.resizeEvents, this.storageKey);
  }

  private applyResizes(): void {
    for (const [columnName, cssValue] of this.resizeEvents) {
      this.updateColumnWidth(columnName, cssValue);
    }
  }

  private updateColumnWidth(columnName: string, cssValue: string): void {
    const columnElts = this.el.nativeElement.getElementsByClassName('mat-column-' + columnName);

    for (let i = 0; i < columnElts.length; i++) {
      const currentEl = columnElts[i] as HTMLDivElement;
      this.renderer.setStyle(currentEl, 'width', cssValue);
      this.renderer.setStyle(currentEl, 'min-width', cssValue);
      this.renderer.setStyle(currentEl, 'max-width', cssValue);
    }
  }
}
