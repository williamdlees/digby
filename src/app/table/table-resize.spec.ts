import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ColumnResizeDirective } from './column-resize.directive';
import { TableResizeDirective } from './table-resize.directive';
import { TableParamsStorageService } from './table-params-storage-service';

@Component({
  imports: [ColumnResizeDirective, TableResizeDirective],
  template: `<table appTableResize="resize-test"><tr>
    <th appColumnResize class="mat-column-name" style="width: 100px"></th>
    <td class="mat-column-name"></td>
  </tr></table>`,
})
class ResizeHost {}

describe('table column resizing', () => {
  beforeEach(() => {
    localStorage.removeItem('table-params-resize-test');
    vi.useFakeTimers();
  });
  afterEach(() => {
    localStorage.removeItem('table-params-resize-test');
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('resizes all matching cells, enforces minimum width and saves it', () => {
    const fixture = TestBed.createComponent(ResizeHost);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('th') as HTMLElement;
    const cell = fixture.nativeElement.querySelector('td') as HTMLElement;
    const resizer = header.querySelector('.column-resizer');
    resizer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 20 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 20 }));
    expect(header.style.width).toBe('50px');
    expect(cell.style.width).toBe('50px');
    expect(JSON.parse(localStorage.getItem('table-params-resize-test'))).toEqual([['name', '50px']]);
    fixture.destroy();
  });

  it('restores persisted sizes for rows already present', () => {
    localStorage.setItem('table-params-resize-test', JSON.stringify([['name', '175px']]));
    const fixture = TestBed.createComponent(ResizeHost);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('tr').classList.add('mat-row');
    vi.advanceTimersByTime(500);
    expect(fixture.nativeElement.querySelector('td').style.width).toBe('175px');
    fixture.destroy();
  });

  it('recovers from invalid stored settings using the supplied defaults', () => {
    const storage = new TableParamsStorageService();
    localStorage.setItem('table-params-resize-test', 'invalid');
    const defaults = new Map([['name', '90px']]);
    expect(storage.loadSavedInfo(defaults, 'resize-test')).toEqual(defaults);
    expect(storage.mapToObj(storage.loadSavedInfo(new Map(), 'resize-test'))).toEqual({ name: '90px' });
  });
});
