import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { NumberFilterComponent } from './number-filter/number-filter.component';
import { TextFilterComponent } from './text-filter/text-filter.component';
import { IChoices } from './ichoices';
import { BoolFilterComponent } from './bool-filter/bool-filter.component';
import { DateFilterComponent } from './date-filter/date-filter.component';
import { FilterComponent } from './filter.component';
import { FilterMode } from './filter-mode.enum';

describe('table filters', () => {
  it('passes inputs and outputs through the dynamically created filter', () => {
    const fixture = TestBed.createComponent(FilterComponent);
    fixture.componentRef.setInput('columnName', 'gene');
    fixture.componentRef.setInput('filterMode', FilterMode.TEXT_MODE);
    const emitted = vi.fn();
    fixture.componentInstance.predicateEmitter.subscribe(emitted);
    fixture.detectChanges();

    const filter = fixture.debugElement.query(By.directive(TextFilterComponent)).componentInstance as TextFilterComponent;
    expect(filter.columnName()).toBe('gene');
    filter.onSortAsc();
    expect(emitted).toHaveBeenCalledWith({ field: 'gene', predicates: [], sort: { field: 'gene', order: 'asc' } });
  });

  it('generates text predicates for matching, choices and sort order', () => {
    const fixture = TestBed.createComponent(TextFilterComponent);
    fixture.componentRef.setInput('columnName', 'gene');
    const component = fixture.componentInstance;
    component.selectedOperator = component.operatorList[2];
    component.operand1Input = 'IGH';
    component.selectedItems = [{ id: 0, text: 'IGHV1' }];
    const emitted = vi.fn();
    component.predicateEmitter.subscribe(emitted);

    component.onSortDesc();
    expect(emitted).toHaveBeenCalledWith({
      field: 'gene',
      predicates: [
        { field: 'gene', op: 'ilike', value: '%IGH%' },
        { field: 'gene', op: 'in', value: ['IGHV1'] },
      ],
      sort: { field: 'gene', order: 'desc' },
    });
    component.onClearFilter();
    component.onClearSelection();
    component.onSortClear();
    expect(emitted).toHaveBeenLastCalledWith({
      field: 'gene', predicates: [], sort: { field: 'gene', order: null },
    });
    expect(component.filterCleared).toBe(true);
  });

  it('generates ordered range and inclusion predicates for numeric filters', () => {
    const fixture = TestBed.createComponent(NumberFilterComponent);
    fixture.componentRef.setInput('columnName', 'count');
    const component = fixture.componentInstance;
    component.selectedOperator = component.operatorList[4];
    component.operand1Input = '8';
    component.operand2Input = '2';
    component.selectedItems = [{ id: 0, text: '4' }];
    const emitted = vi.fn();
    component.predicateEmitter.subscribe(emitted);
    component.onSortAsc();
    expect(emitted).toHaveBeenCalledWith({
      field: 'count',
      predicates: [
        { field: 'count', op: '>', value: '2' },
        { field: 'count', op: '<', value: '8' },
        { field: 'count', op: 'in', value: ['4'] },
      ],
      sort: { field: 'count', order: 'asc' },
    });
  });

  it.each([
    ['2', '10', '2', '10'],
    ['10', '2', '2', '10'],
    ['-2', '-10', '-10', '-2'],
    ['0.3', '0.12', '0.12', '0.3'],
    ['1e2', '9', '9', '1e2'],
  ])('orders numeric range %s and %s numerically', (first, second, lower, upper) => {
    const fixture = TestBed.createComponent(NumberFilterComponent);
    fixture.componentRef.setInput('columnName', 'count');
    const component = fixture.componentInstance;
    component.selectedOperator = component.operatorList[4];
    component.operand1Input = first;
    component.operand2Input = second;
    expect(component.generatePredicate().predicates).toEqual([
      { field: 'count', op: '>', value: lower },
      { field: 'count', op: '<', value: upper },
    ]);
  });

  it.each([TextFilterComponent, NumberFilterComponent])(
    'responds to choices, restored filters and reset events for %s',
    (componentType) => {
      const fixture = TestBed.createComponent<TextFilterComponent | NumberFilterComponent>(componentType);
      const choices = new Subject<IChoices>();
      const clear = new Subject<null>();
      const setFilter = new Subject<{ operator: { name: string; operands: number; operator: string }; op1: string; op2: string }>();
      fixture.componentRef.setInput('columnName', 'field');
      fixture.componentRef.setInput('choices$', choices);
      fixture.componentRef.setInput('clear$', clear);
      fixture.componentRef.setInput('setFilter$', setFilter);
      const component = fixture.componentInstance;
      const emitted = vi.fn();
      component.predicateEmitter.subscribe(emitted);
      component.ngOnInit();
      choices.next({ other: ['ignored'], field: ['first', 'second'] });
      expect(component.choices).toEqual([{ id: 0, text: 'first' }, { id: 1, text: 'second' }]);
      setFilter.next({ operator: component.operatorList[0], op1: '3', op2: '' });
      expect(emitted).toHaveBeenCalledOnce();
      expect(component.operand1Input).toBe('3');
      component.selectedItems = [{ id: 0, text: 'first' }];
      component.selectedSort = 'asc';
      clear.next(null);
      expect(component.selectedOperator).toBeNull();
      expect(component.selectedItems).toEqual([]);
      expect(component.selectedSort).toBeNull();
      expect(component.filterCleared).toBe(true);
    },
  );

  it('orders date ranges and combines them with selected values', () => {
    const fixture = TestBed.createComponent(DateFilterComponent);
    fixture.componentRef.setInput('columnName', 'date');
    const component = fixture.componentInstance;
    component.selectedOperator = component.operatorList[4];
    component.operand1Input = new Date('2025-02-01');
    component.operand2Input = new Date('2025-01-01');
    component.selectedItems = [{ id: 0, text: '2025-01-15' }];
    const emitted = vi.fn();
    component.predicateEmitter.subscribe(emitted);
    component.onSortAsc();
    expect(emitted).toHaveBeenCalledWith({
      field: 'date',
      predicates: [
        { field: 'date', op: '>', value: new Date('2025-01-01') },
        { field: 'date', op: '<', value: new Date('2025-02-01') },
        { field: 'date', op: 'in', value: ['2025-01-15'] },
      ],
      sort: { field: 'date', order: 'asc' },
    });
    component.onClearFilter();
    component.onClearSelection();
    component.onSortClear();
    expect(emitted).toHaveBeenLastCalledWith({ field: 'date', predicates: [], sort: { field: 'date', order: null } });
  });

  it('converts boolean selections to server values and responds to reset', () => {
    const fixture = TestBed.createComponent(BoolFilterComponent);
    const clear = new Subject<null>();
    fixture.componentRef.setInput('columnName', 'active');
    fixture.componentRef.setInput('clear$', clear);
    const component = fixture.componentInstance;
    component.ngOnInit();
    component.selectedItems = [{ id: 0, text: true }, { id: 1, text: false }];
    const emitted = vi.fn();
    component.predicateEmitter.subscribe(emitted);
    component.onSortDesc();
    expect(emitted).toHaveBeenCalledWith({
      field: 'active', predicates: [{ field: 'active', op: 'in', value: ['1', '0'] }],
      sort: { field: 'active', order: 'desc' },
    });
    clear.next(null);
    expect(component.selectedItems).toEqual([]);
    expect(component.selectedSort).toBeNull();
  });
});
