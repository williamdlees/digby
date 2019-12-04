import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HeaderComponent} from './header/header.component';
import { SubmittedAllelesComponent } from './submitted-alleles/submitted-alleles.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SubmittedAllelesComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
