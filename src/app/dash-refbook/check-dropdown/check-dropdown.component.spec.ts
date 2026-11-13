import { ElementRef } from '@angular/core';
import { CheckDropdownComponent } from './check-dropdown.component';

describe('check dropdown', () => {
  it('summarizes and toggles grouped selections in original option order', () => {
    const component = new CheckDropdownComponent(new ElementRef(document.createElement('div')));
    component.options = [
      { value: 'a', label: 'Alpha', group: 'Group' },
      { value: 'b', label: 'Beta', group: 'Group' },
    ];
    const events: string[][] = [];
    component.selectedChange.subscribe(value => events.push(value));
    expect(component.summary).toBe('All (2)');
    component.selected = ['b'];
    expect(component.summary).toBe('Beta');
    expect(component.groupState(component.groups[0])).toBe('some');
    component.toggle('a');
    expect(events).toEqual([['a', 'b']]);
    component.selected = ['a', 'b'];
    component.selectGroup(component.groups[0]);
    expect(events[1]).toEqual([]);
    expect(component.allSelected).toBe(true);
  });

  it('closes for escape and outside clicks but not inside clicks', () => {
    const element = document.createElement('div');
    const child = document.createElement('span');
    element.appendChild(child);
    const component = new CheckDropdownComponent(new ElementRef(element));
    component.open = true;
    const inside = new MouseEvent('click');
    child.dispatchEvent(inside);
    component.onDocumentClick(inside);
    expect(component.open).toBe(true);
    component.onDocumentClick(new MouseEvent('click'));
    expect(component.open).toBe(false);
    component.open = true;
    component.onEscape();
    expect(component.open).toBe(false);
  });
});
