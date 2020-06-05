import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepSampleComponent } from './rep-sample.component';

describe('SampleRepComponent', () => {
  let component: RepSampleComponent;
  let fixture: ComponentFixture<RepSampleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepSampleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepSampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
