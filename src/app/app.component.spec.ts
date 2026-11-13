import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AppHeaderComponent } from './app-header/app-header.component';

@Component({ selector: 'app-header', template: '' })
class StubHeaderComponent {}

describe('AppComponent', () => {
  it('renders the header and the router outlet', async () => {
    await TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter([])] })
      .overrideComponent(AppComponent, {
        remove: { imports: [AppHeaderComponent] },
        add: { imports: [StubHeaderComponent] },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
