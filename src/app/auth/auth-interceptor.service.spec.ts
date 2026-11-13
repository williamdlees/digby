import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { AuthInterceptorService } from './auth-interceptor.service';
import { AuthService } from './auth.service';
import { User } from './user.model';

describe('authorization interceptor', () => {
  const user = new BehaviorSubject<User>(null);
  const handle = vi.fn((_request: HttpRequest<unknown>) => of(new HttpResponse({ status: 200 })));
  let interceptor: AuthInterceptorService;

  beforeEach(() => {
    user.next(null);
    handle.mockClear();
    TestBed.configureTestingModule({ providers: [
      AuthInterceptorService,
      { provide: AuthService, useValue: { user } },
    ] });
    interceptor = TestBed.inject(AuthInterceptorService);
  });

  async function send(url: string) {
    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', url), { handle }));
    return handle.mock.calls[0][0];
  }

  it('passes anonymous and external requests without a token', async () => {
    expect((await send('http://localhost:5000/api/data')).headers.has('Authorization')).toBe(false);
    handle.mockClear();
    const expires = new Date(Date.now() + 60_000);
    user.next(new User(true, 'test', 'access', expires, 'refresh', expires));
    expect((await send('https://example.org/api/data')).headers.has('Authorization')).toBe(false);
  });

  it('sends the access token to the backend and refresh token to its refresh endpoint', async () => {
    const expires = new Date(Date.now() + 60_000);
    user.next(new User(true, 'test', 'access', expires, 'refresh', expires));
    expect((await send('http://localhost:5000/api/data')).headers.get('Authorization')).toBe('Bearer access');
    handle.mockClear();
    expect((await send('http://localhost:5000/api/refresh')).headers.get('Authorization')).toBe('Bearer refresh');
  });
});
