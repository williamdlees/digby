import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {catchError, map, tap} from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { SystemService } from '../../../dist/digby-swagger-client';

import { User } from './user.model';
import {SysConfig} from "./sysconfig.model";

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable()
export class AuthService {
  user = new BehaviorSubject<User>(null);
  sysConfig = new BehaviorSubject<SysConfig>(new SysConfig(true, '', '', ''));
  private accessTokenExpirationTimer: any;
  private refreshTokenExpirationTimer: any;
  private userData: User = null;

  constructor(private http: HttpClient, private router: Router, private systemService: SystemService) {}

  // Check if this site uses authentication and set up the user object appropriately
  // Should be run as an initializer so that the app gets blocked until we know which
  // way we're heading
  initialize() {
    return this.systemService.getConfigApi()
      .pipe(
        catchError(err => {
          console.log("error in getconfigapi call");
          console.log(err);
          return throwError(err);
        }),
        tap((sysConfig: SysConfig) => {
          //console.log('auth: calling config api')
          this.sysConfig.next(sysConfig)
          this.userData = new User( sysConfig.app_protected,'Anonymous', '', null, '', null);
          this.user.next(this.userData);
          if (this.userData.appProtected) {
            console.log('app is protected');
            this.autoLogin();
          }
        })
      );
  }

  login(userName: string, password: string, stay: boolean) {
    return this.systemService.getLoginApi(
      userName,
      password
      )
      .pipe(
        catchError(this.handleError),
        tap((resData: any) => {
          this.handleAuthentication(
            resData.username,
            resData.access_token,
            resData.access_token_lifetime,
            resData.refresh_token,
            resData.refresh_token_lifetime,
            stay,
          );
        })
      );
  }

  autoLogin() {
    //console.log('in auth.autoLogin: checking for stored token');

    const authData: {
      userName: string;
      _accessToken: string;
      _accessTokenExpirationDate: string;
      _refreshToken: string;
      _refreshTokenExpirationDate: string;
    } = JSON.parse(localStorage.getItem('authData'));
    if (!authData) {
      //console.log("stored token not found");
      return;
    }

    const loadedUser = new User(
      true,
      authData.userName,
      authData._accessToken,
      new Date(authData._accessTokenExpirationDate),
      authData._refreshToken,
      new Date(authData._refreshTokenExpirationDate),
    );

    if (loadedUser.refreshToken) {
      //console.log("Loaded valid refresh token from store: refreshing access")
      this.user.next(loadedUser);
      this.userData = loadedUser;
      const refreshTokenExpirationDuration =
        new Date(authData._refreshTokenExpirationDate).getTime() -
        new Date().getTime();
      this.refresh();
      this.autoLogout(refreshTokenExpirationDuration);
    }

    //console.log('auth.autoLogin succeeded');
  }

  // called when the refresh token expires or user logs out
  logout() {
    //console.log('in auth.logout: refresh token expired');
    this.userData = new User(true, '', '',null, '', null);
    this.user.next(this.userData);
    this.router.navigate(['/']);
    localStorage.removeItem('authData');

    if (this.accessTokenExpirationTimer) {
      clearTimeout(this.accessTokenExpirationTimer);
    }

    if (this.refreshTokenExpirationTimer) {
      clearTimeout(this.refreshTokenExpirationTimer);
    }

    this.refreshTokenExpirationTimer = null;
  }

  // set up the timer for refresh token expiry
  autoLogout(refreshTokenExpirationDuration: number) {
    //console.log('in auth.autologout');
    this.refreshTokenExpirationTimer = setTimeout(() => {
      this.logout;
    }, refreshTokenExpirationDuration);
  }

  // called when the access token expires
  refresh() {
    //console.log('in auth.refresh: refreshing access token');
    this.systemService.getRefreshApi()
      .pipe(
        catchError(err => {
          //console.log("error refreshing access token");
          this.logout();
          return throwError(err);
        }),
      ).subscribe((resData: any) => {
          //console.log("refreshed access token");
          this.handleRefresh(
            resData.access_token,
            resData.access_token_lifetime,
          );
        });
  }

  // set up the timer for access token expiry
  autoRefresh(accessTokenExpirationDuration: number) {
    //console.log('in auth.autorefresh');

    if (this.accessTokenExpirationTimer) {
      clearTimeout(this.accessTokenExpirationTimer);
    }

    //console.log("setting access token timer");

    this.accessTokenExpirationTimer = setTimeout(() => {
      this.refresh();
    }, accessTokenExpirationDuration);
  }

  private handleAuthentication(
    userName: string,
    accessToken: string,
    accessTokenExpiresIn: number,
    refreshToken: string,
    refreshTokenExpiresIn: number,
    stay: boolean,
  ) {
    //console.log('in auth.handleauthentication');
    const accessTokenExpirationDate = new Date(new Date().getTime() + accessTokenExpiresIn * 1000);
    const refreshTokenExpirationDate = new Date(new Date().getTime() + refreshTokenExpiresIn * 1000);
    const user = new User(true, userName, accessToken, accessTokenExpirationDate, refreshToken, refreshTokenExpirationDate);
    this.user.next(user);
    this.userData = user;
    this.autoLogout(refreshTokenExpiresIn * 1000);
    this.autoRefresh(accessTokenExpiresIn * 1000);

    if (stay) {
      localStorage.setItem('authData', JSON.stringify(user));
    }
  }

  private handleRefresh(
    accessToken: string,
    accessTokenExpiresIn: number,
  ) {
    //console.log('in handlerefresh');
    this.userData.accessToken = accessToken;
    this.userData.accessTokenExpirationDate = new Date(new Date().getTime() + accessTokenExpiresIn * 1000);

    this.autoRefresh(accessTokenExpiresIn * 1000);
    this.user.next(this.userData);
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'Bad user name or password';
    return throwError(errorMessage);
  }
}
