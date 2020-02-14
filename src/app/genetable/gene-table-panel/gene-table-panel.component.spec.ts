import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneTablePanelComponent } from './gene-table-panel.component';

describe('GeneTablePanelComponent', () => {
  let component: GeneTablePanelComponent;
  let fixture: ComponentFixture<GeneTablePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneTablePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneTablePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
