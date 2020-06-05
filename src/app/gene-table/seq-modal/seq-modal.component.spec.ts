import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SeqModalComponent } from './seq-modal.component';

describe('SeqModalComponent', () => {
  let component: SeqModalComponent;
  let fixture: ComponentFixture<SeqModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SeqModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SeqModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
