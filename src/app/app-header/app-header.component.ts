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
  public displayProtected = true;

  constructor(private authService: AuthService,
              private router: Router,) {}

  ngOnInit() {
    this.authService.user.subscribe(user => {
        if (!user.appProtected) {
          console.log("app is not protected");
          this.displayLogin = false;
          this.displayLogout = false;
          this.displayProtected = true;
        } else {
          if (!user.accessToken) {
            console.log("protected and no access token");
            this.displayLogin = true;
            this.displayLogout = false;
            this.displayProtected = false;
          } else {
            console.log("protected and we have an access token");
            this.displayLogin = false;
            this.displayLogout = true;
            this.displayProtected = true;
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
