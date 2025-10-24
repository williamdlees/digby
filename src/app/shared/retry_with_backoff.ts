import { Observable, timer, throwError } from 'rxjs';
import { retry } from 'rxjs/operators';

export function retryWithBackoff(delayMs = 1000, maxRetry = 3, backoffMs = 1000) {
  return (src: Observable<any>) =>
    src.pipe(
      retry({
        count: maxRetry,
        delay: (error, retryCount) => {
          const backoffTime = delayMs + (retryCount - 1) * backoffMs;
          return timer(backoffTime);
        }
      })
    );
}
