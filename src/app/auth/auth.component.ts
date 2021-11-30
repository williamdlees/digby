import {AfterViewInit, Component, OnInit} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService, AuthResponseData } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html'
})
export class AuthComponent implements OnInit{
  isLoading = false;
  error: string = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.user.subscribe(user => {
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
    authObs = this.authService.login(userName, password);

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
