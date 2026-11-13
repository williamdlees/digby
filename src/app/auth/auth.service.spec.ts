import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SystemService } from 'projects/digby-swagger-client';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { SysConfig } from './sysconfig.model';

describe('authentication service', () => {
  const api = { getConfigApi: vi.fn(), getLoginApi: vi.fn(), getRefreshApi: vi.fn() };
  const router = { navigate: vi.fn() };
  let service: AuthService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    vi.resetAllMocks();
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [
      AuthService,
      { provide: HttpClient, useValue: {} },
      { provide: Router, useValue: router },
      { provide: SystemService, useValue: api },
    ] });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes an anonymous user for an unprotected site', async () => {
    const config = new SysConfig(false, '', '', '');
    api.getConfigApi.mockReturnValue(of(config));
    await firstValueFrom(service.initialize());
    expect(service.sysConfig.value).toBe(config);
    expect(service.user.value.userName).toBe('Anonymous');
    expect(service.user.value.appProtected).toBe(false);
    expect(api.getRefreshApi).not.toHaveBeenCalled();
  });

  it('stores a persistent login and refreshes the access token on expiry', async () => {
    api.getLoginApi.mockReturnValue(of({
      username: 'alice', access_token: 'access', access_token_lifetime: 60,
      refresh_token: 'refresh', refresh_token_lifetime: 600,
    }));
    api.getRefreshApi.mockReturnValue(of({ access_token: 'renewed', access_token_lifetime: 120 }));
    await firstValueFrom(service.login('alice', 'password', true));
    expect(api.getLoginApi).toHaveBeenCalledWith('alice', 'password');
    expect(service.user.value.accessToken).toBe('access');
    expect(JSON.parse(localStorage.getItem('authData')).userName).toBe('alice');
    vi.advanceTimersByTime(60_000);
    expect(api.getRefreshApi).toHaveBeenCalledOnce();
    expect(service.user.value.accessToken).toBe('renewed');
  });

  it('reports login errors without storing credentials', async () => {
    api.getLoginApi.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    await expect(firstValueFrom(service.login('alice', 'wrong', false)))
      .rejects.toBe('Bad user name or password');
    expect(localStorage.getItem('authData')).toBeNull();
    expect(service.user.value).toBeNull();
  });

  it('restores a valid stored session and refreshes it', () => {
    localStorage.setItem('authData', JSON.stringify({
      userName: 'alice',
      _accessToken: 'old',
      _accessTokenExpirationDate: '2024-12-31T23:59:00Z',
      _refreshToken: 'refresh',
      _refreshTokenExpirationDate: '2025-01-01T00:10:00Z',
    }));
    api.getConfigApi.mockReturnValue(of(new SysConfig(true, '', '', '')));
    api.getRefreshApi.mockReturnValue(of({ access_token: 'renewed', access_token_lifetime: 60 }));
    service.initialize().subscribe();
    expect(api.getRefreshApi).toHaveBeenCalledOnce();
    expect(service.user.value.userName).toBe('alice');
    expect(service.user.value.accessToken).toBe('renewed');
  });

  it('does not restore an expired refresh token', () => {
    localStorage.setItem('authData', JSON.stringify({
      userName: 'alice',
      _accessToken: 'old',
      _accessTokenExpirationDate: '2024-12-31T23:59:00Z',
      _refreshToken: 'expired',
      _refreshTokenExpirationDate: '2024-12-31T23:59:00Z',
    }));
    service.autoLogin();
    expect(service.user.value).toBeNull();
    expect(api.getRefreshApi).not.toHaveBeenCalled();
  });

  it('logs out, clears storage and cancels scheduled access refreshes', async () => {
    api.getLoginApi.mockReturnValue(of({
      username: 'alice', access_token: 'access', access_token_lifetime: 60,
      refresh_token: 'refresh', refresh_token_lifetime: 600,
    }));
    await firstValueFrom(service.login('alice', 'password', true));
    service.logout();
    vi.advanceTimersByTime(60_000);
    expect(localStorage.getItem('authData')).toBeNull();
    expect(service.user.value.accessToken).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(api.getRefreshApi).not.toHaveBeenCalled();
  });

  it('logs out and clears stored credentials when the refresh token expires', async () => {
    api.getLoginApi.mockReturnValue(of({
      username: 'alice', access_token: 'access', access_token_lifetime: 60,
      refresh_token: 'refresh', refresh_token_lifetime: 10,
    }));
    await firstValueFrom(service.login('alice', 'password', true));
    vi.advanceTimersByTime(10_000);
    expect(service.user.value.userName).toBe('');
    expect(service.user.value.accessToken).toBeNull();
    expect(localStorage.getItem('authData')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    vi.advanceTimersByTime(50_000);
    expect(api.getRefreshApi).not.toHaveBeenCalled();
  });

  it('replaces an older logout timer when another login starts a new session', async () => {
    api.getLoginApi.mockReturnValueOnce(of({
      username: 'alice', access_token: 'first', access_token_lifetime: 60,
      refresh_token: 'first-refresh', refresh_token_lifetime: 10,
    })).mockReturnValueOnce(of({
      username: 'bob', access_token: 'second', access_token_lifetime: 60,
      refresh_token: 'second-refresh', refresh_token_lifetime: 30,
    }));
    await firstValueFrom(service.login('alice', 'password', true));
    vi.advanceTimersByTime(1_000);
    await firstValueFrom(service.login('bob', 'password', true));
    vi.advanceTimersByTime(9_000);
    expect(service.user.value.userName).toBe('bob');
    expect(JSON.parse(localStorage.getItem('authData')).userName).toBe('bob');
    expect(router.navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(21_000);
    expect(service.user.value.userName).toBe('');
    expect(localStorage.getItem('authData')).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnce();
  });
});
