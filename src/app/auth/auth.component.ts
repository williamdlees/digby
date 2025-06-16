import {AfterViewInit, Component, OnInit} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService, AuthResponseData } from './auth.service';
import {take} from "rxjs/operators";
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    imports: [NgIf, FormsModule]
})
export class AuthComponent implements OnInit{
  isLoading = false;
  error: string = null;
  stay_logged = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.user
      .pipe(take(1))
      .subscribe(user => {
      if (user.accessToken) {
        this.router.navigate(['/']);
      }
    })
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const userName = form.value.userName;
    const password = form.value.password;

    let authObs: Observable<AuthResponseData>;

    this.isLoading = true;
    authObs = this.authService.login(userName, password, this.stay_logged);

    authObs.subscribe(
      resData => {
        console.log(resData);
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      errorMessage => {
        console.log(errorMessage);
        this.error = errorMessage;
        this.isLoading = false;
      }
    );

    form.reset();
  }
}
