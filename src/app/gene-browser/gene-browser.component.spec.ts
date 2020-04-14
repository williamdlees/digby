import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneBrowserComponent } from './gene-browser.component';

describe('GeneBrowserComponent', () => {
  let component: GeneBrowserComponent;
  let fixture: ComponentFixture<GeneBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneBrowserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
