import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';
import { take, exhaustMap } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return this.authService.user.pipe(
      take(1),
      exhaustMap(user => {
        // check for a refresh first, because the access token may have expired
        if(req.url.indexOf(location.hostname) >= 0 && req.url.indexOf('/refresh') >= 0 && user && user.appProtected) {
          const modifiedReq = req.clone(
            {headers: req.headers.set('Authorization', 'Bearer ' + user.refreshToken)}
          );
          return next.handle(modifiedReq);
        }

        if (!user || !user.appProtected || req.url.indexOf(location.hostname) < 0) {
          return next.handle(req);
        }

        const modifiedReq = req.clone(
          {headers: req.headers.set('Authorization', 'Bearer ' + user.accessToken)}
        );
        return next.handle(modifiedReq);
      })
    );
  }
}
