import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneTableComponent } from './gene-table.component';

describe('GenetableComponent', () => {
  let component: GeneTableComponent;
  let fixture: ComponentFixture<GeneTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
