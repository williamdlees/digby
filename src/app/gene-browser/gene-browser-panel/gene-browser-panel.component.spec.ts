import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneBrowserPanelComponent } from './gene-browser-panel.component';

describe('GeneBrowserPanelComponent', () => {
  let component: GeneBrowserPanelComponent;
  let fixture: ComponentFixture<GeneBrowserPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneBrowserPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneBrowserPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
