import { defer, firstValueFrom, of } from 'rxjs';
import { pollUntil } from './poll-until-rxjs';

describe('pollUntil', () => {
  it('polls until the predicate succeeds', async () => {
    let attempts = 0;
    const result = await firstValueFrom(defer(() => of(++attempts)).pipe(pollUntil(1, 3, n => n === 3)));
    expect(result).toBe(3);
    expect(attempts).toBe(3);
  });

  it('reports when the maximum attempts are exceeded', async () => {
    let attempts = 0;
    const result = firstValueFrom(defer(() => of(++attempts)).pipe(pollUntil(1, 2, n => n === 3)));
    await expect(result).rejects.toThrow('max attempts');
    expect(attempts).toBe(2);
  });
});
