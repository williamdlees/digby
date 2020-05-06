// from https://medium.com/angular-in-depth/retry-failed-http-requests-in-angular-f5959d486294

import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, retryWhen } from 'rxjs/operators';

const DEFAULT_DELAY = 500;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF = 1000;

export function retryWithBackoff(delayMs = DEFAULT_DELAY, maxRetry = DEFAULT_MAX_RETRIES, backoffMs = DEFAULT_BACKOFF) {
  let retries = maxRetry;

  return (src: Observable<any>) =>
    src.pipe(
      retryWhen((errors: Observable<any>) => errors.pipe(
        mergeMap(error => {
          if (retries-- > 0) {
            const backoffTime = delayMs + (maxRetry - retries) * backoffMs;
            return of(error).pipe(delay(backoffTime));
          }
          return throwError(error.message);
        })
      ))
    );
}
