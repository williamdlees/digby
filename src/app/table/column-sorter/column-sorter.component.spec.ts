import { TestBed } from '@angular/core/testing';
import { ColumnSorterComponent } from './column-sorter.component';
import { ColumnInfo } from './column-sorter.service';

describe('column selection', () => {
  const columns: ColumnInfo[] = [
    { id: 'name', name: 'Name', hidden: false, section: 'Basics' },
    { id: 'age', name: 'Age', hidden: true, section: 'Details' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('emits selected columns, groups hidden columns and persists changes', () => {
    const fixture = TestBed.createComponent(ColumnSorterComponent);
    fixture.componentRef.setInput('saveName', 'table-test');
    const component = fixture.componentInstance;
    component.columnInfo = columns;
    const emitted = vi.fn();
    component.columnsChange.subscribe(emitted);
    component.ngOnInit();
    vi.runAllTimers();
    expect(emitted).toHaveBeenLastCalledWith(['name']);
    expect(component.classifiedColumnInfo.Details.map(column => column.id)).toEqual(['age']);
    component.toggleSelectedColumn('age');
    vi.runAllTimers();
    expect(emitted).toHaveBeenLastCalledWith(['name', 'age']);
    expect(JSON.parse(localStorage.getItem('table-test-columns'))).toEqual([
      expect.objectContaining({ id: 'name', hidden: false }),
      expect.objectContaining({ id: 'age', hidden: false }),
    ]);
    component.onResetColumns();
    vi.runAllTimers();
    expect(emitted).toHaveBeenLastCalledWith(['name']);
  });
});
