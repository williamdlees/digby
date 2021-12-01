import { Component, OnInit } from '@angular/core';
import {AuthService} from "../auth/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css']
})

export class AppHeaderComponent implements OnInit {
  public isMenuCollapsed = true;
  public displayLogin = false;
  public displayLogout = false

  constructor(private authService: AuthService,
              private router: Router,) {}

  ngOnInit() {
    this.authService.user.subscribe(user => {
        if (!user.appProtected) {
          this.displayLogin = false;
          this.displayLogout = false;
        } else {
          if (!user.accessToken) {
            this.displayLogin = true;
            this.displayLogout = false;
          } else {
            this.displayLogin = false;
            this.displayLogout = true;
          }
        }
      }
    )
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
