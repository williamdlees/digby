// from https://medium.com/javascript-everyday/http-requests-polling-like-a-hero-with-rxjs-474a2e1fa057

import { timer, Observable } from 'rxjs';
import { scan, tap, switchMapTo, first } from 'rxjs/operators';

function checkAttempts(maxAttempts: number) {
  return (attempts: number) => {
    if (attempts > maxAttempts) {
      throw new Error('Error: max attempts');
    }
  };
}

export function pollUntil<T>(
  pollInterval: number,
  maxAttempts: number,
  responsePredicate: (res: any) => boolean
) {
  return (source$: Observable<T>) =>
    timer(0, pollInterval).pipe(
      scan(attempts => ++attempts, 0),
      tap(checkAttempts(maxAttempts)),
      switchMapTo(source$),
      first(responsePredicate)
    );
}
