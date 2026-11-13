import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { GeneTableSelectorService } from '../gene-table-selector/gene-table-selector.service';
import { AppHeaderComponent } from './app-header.component';

describe('application header', () => {
  it('updates authentication controls and assembly navigation', () => {
    vi.useFakeTimers();
    const user = new BehaviorSubject({ appProtected: false, accessToken: '' });
    const selection = new BehaviorSubject({ assemblies: [] as string[] });
    const auth = { user, logout: vi.fn() };
    const router = { navigate: vi.fn() };
    try {
      TestBed.configureTestingModule({ providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: GeneTableSelectorService, useValue: { source: selection } },
      ] });
      const component = new AppHeaderComponent(
        TestBed.inject(AuthService), TestBed.inject(Router), TestBed.inject(GeneTableSelectorService),
      );
      component.ngOnInit();
      expect([component.displayLogin, component.displayLogout, component.displayProtected]).toEqual([false, false, true]);
      user.next({ appProtected: true, accessToken: '' });
      expect([component.displayLogin, component.displayLogout, component.displayProtected]).toEqual([true, false, false]);
      user.next({ appProtected: true, accessToken: 'token' });
      expect([component.displayLogin, component.displayLogout, component.displayProtected]).toEqual([false, true, true]);
      vi.advanceTimersByTime(1000);
      expect(component.assemblies_present).toBe(false);
      selection.next({ assemblies: ['assembly'] });
      vi.advanceTimersByTime(1000);
      expect(component.assemblies_present).toBe(true);
      selection.next(null);
      vi.advanceTimersByTime(1000);
      expect(component.assemblies_present).toBe(true);
      component.onLogout();
      expect(auth.logout).toHaveBeenCalledOnce();
      expect(router.navigate).toHaveBeenCalledWith(['/auth']);
      component.geneTableServiceSubscription.unsubscribe();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
