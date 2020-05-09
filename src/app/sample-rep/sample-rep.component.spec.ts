import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleRepComponent } from './sample-rep.component';

describe('SampleRepComponent', () => {
  let component: SampleRepComponent;
  let fixture: ComponentFixture<SampleRepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SampleRepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleRepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
