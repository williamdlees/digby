import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenSampleInfoComponent } from './gen-sample-info.component';

describe('GenSampleInfoComponent', () => {
  let component: GenSampleInfoComponent;
  let fixture: ComponentFixture<GenSampleInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GenSampleInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenSampleInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
