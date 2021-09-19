// Collect recent posts from Wordpress

import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EMPTY, Observable, Subject, throwError} from 'rxjs';
import {map, catchError} from "rxjs/operators";
import {retryWithBackoff} from "../shared/retry_with_backoff";

@Injectable({
  providedIn: 'root'
})
export class WordpressService {
  // https://renemorozowich.com/using-wordpress-rest-api-get-blogs/
  private WORDPRESS_ENDPOINT = 'https://wordpress.vdjbase.org/index.php/wp-json/wp/v2/'

  constructor(private httpClient: HttpClient) {
  }

  fetchNews() {
   return this.httpClient.get(`${this.WORDPRESS_ENDPOINT}posts?categories=11&per_page=5`).pipe(
      retryWithBackoff(),
      map(responseData => {
        const postsArray = [];
        for (const item in responseData) {
            postsArray.push([responseData[item].title.rendered, responseData[item].link]);
        }
        return postsArray;
      }),
      catchError(error => {
        console.log('error');
        return throwError(error);
      })
   )
  }

  fetchHelp() {
   return this.httpClient.get(`${this.WORDPRESS_ENDPOINT}posts?categories=12&per_page=5`).pipe(
      retryWithBackoff(),
      map(responseData => {
        const postsArray = [];
        for (const item in responseData) {
            postsArray.push([responseData[item].title.rendered, responseData[item].link]);
        }
        return postsArray;
      }),
      catchError(error => {
        console.log('error');
        return throwError(error);
      })
   )
  }
}


