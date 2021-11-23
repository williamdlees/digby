// Collect recent posts from Wordpress

import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EMPTY, Observable, Subject, throwError} from 'rxjs';
import {map, catchError} from "rxjs/operators";
import {retryWithBackoff} from "../shared/retry_with_backoff";
import { SystemService } from '../../../dist/digby-swagger-client';


@Injectable({
  providedIn: 'root'
})
export class WordpressService {
  private config = null;

  constructor(private httpClient: HttpClient, private systemService: SystemService) {

  }

  init() {
    if (this.config) {
      return new Observable(this.config)
    } else {
      return this.systemService.getConfigApi().pipe(
        retryWithBackoff(),
        map(resp => {
          this.config = resp;
          return resp;
        }),
        catchError(error => {
          return throwError(error);
        })
      )
    }
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


