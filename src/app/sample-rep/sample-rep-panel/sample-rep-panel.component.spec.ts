import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleRepPanelComponent } from './sample-rep-panel.component';

describe('SampleRepPanelComponent', () => {
  let component: SampleRepPanelComponent;
  let fixture: ComponentFixture<SampleRepPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SampleRepPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleRepPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
