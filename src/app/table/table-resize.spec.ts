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

@Component({
  imports: [ColumnResizeDirective],
  template: `<div appColumnResize></div>`,
})
class ResizeWithoutTableHost {}

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

  it('applies saved widths when rows arrive after the table is initialized', async () => {
    localStorage.setItem('table-params-resize-test', JSON.stringify([['name', '175px']]));
    const fixture = TestBed.createComponent(ResizeHost);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    const row = document.createElement('tr');
    row.className = 'mat-mdc-row';
    const cell = document.createElement('td');
    cell.className = 'mat-column-name';
    row.appendChild(cell);
    table.appendChild(document.createTextNode(' '));
    table.appendChild(row);
    await Promise.resolve();
    vi.advanceTimersByTime(100);
    expect(cell.style.width).toBe('175px');
    expect(cell.style.minWidth).toBe('175px');
    fixture.destroy();
  });

  it('falls back to restoring widths after several non-row mutations', async () => {
    localStorage.setItem('table-params-resize-test', JSON.stringify([['name', '120px']]));
    const fixture = TestBed.createComponent(ResizeHost);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    for (let i = 0; i < 4; i++) {
      table.appendChild(document.createElement('span'));
    }
    await Promise.resolve();
    vi.advanceTimersByTime(200);
    expect(fixture.nativeElement.querySelector('td').style.width).toBe('120px');
    fixture.destroy();
  });

  it('restores saved widths after the delayed fallback when rows are not detected', () => {
    localStorage.setItem('table-params-resize-test', JSON.stringify([['name', '95px']]));
    const fixture = TestBed.createComponent(ResizeHost);
    fixture.detectChanges();
    vi.advanceTimersByTime(2500);
    expect(fixture.nativeElement.querySelector('td').style.width).toBe('95px');
    fixture.destroy();
  });

  it('shows the drag handle at the header edge and hides it after leaving', () => {
    const fixture = TestBed.createComponent(ResizeHost);
    fixture.detectChanges();
    const resizer = fixture.nativeElement.querySelector('.column-resizer') as HTMLElement;
    const handle = fixture.nativeElement.querySelector('.resize-handle') as HTMLElement;
    vi.spyOn(resizer, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 10));
    resizer.dispatchEvent(new MouseEvent('mouseover', { clientX: 20 }));
    expect(handle.style.opacity).not.toBe('1');
    resizer.dispatchEvent(new MouseEvent('mouseover', { clientX: 98 }));
    expect(handle.style.opacity).toBe('1');
    resizer.dispatchEvent(new MouseEvent('mouseout'));
    expect(handle.style.opacity).toBe('0');
    fixture.destroy();
  });

  it('reports an invalid resize target without creating a handle', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const fixture = TestBed.createComponent(ResizeWithoutTableHost);
      fixture.detectChanges();
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Parent table not found'));
      expect(fixture.nativeElement.querySelector('.column-resizer')).toBeNull();
      fixture.destroy();
    } finally {
      log.mockRestore();
    }
  });
});
