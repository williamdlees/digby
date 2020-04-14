import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneBrowserSelectorComponent } from './gene-browser-selector.component';

describe('GeneBrowserSelectorComponent', () => {
  let component: GeneBrowserSelectorComponent;
  let fixture: ComponentFixture<GeneBrowserSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneBrowserSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneBrowserSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
