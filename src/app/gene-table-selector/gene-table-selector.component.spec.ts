import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneTableSelectorComponent } from './gene-table-selector.component';

describe('GeneTableSelectorComponent', () => {
  let component: GeneTableSelectorComponent;
  let fixture: ComponentFixture<GeneTableSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneTableSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneTableSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
