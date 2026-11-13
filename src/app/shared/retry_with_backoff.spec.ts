import { defer, firstValueFrom, of, throwError } from 'rxjs';
import { retryWithBackoff } from './retry_with_backoff';

describe('retry with backoff', () => {
  it('retries server errors up to success', async () => {
    let attempts = 0;
    const source = defer(() => ++attempts < 3 ? throwError(() => ({ status: 503 })) : of('ok'));
    await expect(firstValueFrom(source.pipe(retryWithBackoff(1, 3, 1)))).resolves.toBe('ok');
    expect(attempts).toBe(3);
  });

  it('does not retry client errors', async () => {
    let attempts = 0;
    const error = { status: 400 };
    const source = defer(() => { attempts++; return throwError(() => error); });
    await expect(firstValueFrom(source.pipe(retryWithBackoff(1, 3, 1)))).rejects.toEqual(error);
    expect(attempts).toBe(1);
  });
});
