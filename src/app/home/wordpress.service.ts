// Collect recent posts from Wordpress

import {Injectable, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, EMPTY, Observable, Subject, throwError} from 'rxjs';
import {map, catchError} from "rxjs/operators";
import {retryWithBackoff} from "../shared/retry_with_backoff";
import { SystemService } from '../../../dist/digby-swagger-client';
import {SysConfig} from "../auth/sysconfig.model";
import {AuthService} from "../auth/auth.service";



@Injectable({
  providedIn: 'root'
})
export class WordpressService {
  private config = null;
  sysConfig = new BehaviorSubject<SysConfig>(new SysConfig(true, '', '', ''));

  constructor(private httpClient: HttpClient,
              private systemService: SystemService,
              private authService: AuthService) {

    this.init();
  }

  init() {
    console.log("wordpress init started");
    this.authService.sysConfig
      .subscribe( sysConfig => {
        console.log("wordpress init got config update");
      this.config = sysConfig;
      this.sysConfig.next(sysConfig);
    });
  }

  fetchNews() {
    return this.httpClient.get(`${this.config.vdjbase_news}&per_page=5`).pipe(
      retryWithBackoff(),
      map(responseData => {
        const postsArray = [];
        for (const item in responseData) {
            postsArray.push([responseData[item].title.rendered, responseData[item].link]);
        }
        return postsArray;
      }),
      catchError(error => {
        return throwError(error);
      })
    )
  }

  fetchHelp() {
   return this.httpClient.get(`${this.config.vdjbase_help}&per_page=5`).pipe(
      retryWithBackoff(),
      map(responseData => {
        const postsArray = [];
        for (const item in responseData) {
            postsArray.push([responseData[item].title.rendered, responseData[item].link]);
        }
        return postsArray;
      }),
      catchError(error => {
        return throwError(error);
      })
   )
  }
}


