import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { SubmittedAllelesComponent } from './submitted-alleles/submitted-alleles.component';
import { GeneTableComponent } from './genetable/gene-table.component';

import { ApiModule, Configuration, ConfigurationParameters } from 'dist/digby-swagger-client';
import { AgGridModule } from 'ag-grid-angular';
import { HomeComponent } from './home/home.component';
import { SequencesComponent } from './sequences/sequences.component';
import { RouterModule, Routes } from '@angular/router';
import { AppHeaderComponent } from './app-header/app-header.component';
import { LongReadsubmittedSequencesService } from 'dist/digby-swagger-client';
import { environment } from '../environments/environment';

export function apiConfigFactory(): Configuration  {
  const params: ConfigurationParameters = {
    // set configuration parameters here.
    basePath: environment.apiBasePath,
  };
  return new Configuration(params);
}

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'sequences', component: SequencesComponent },
  { path: 'submitted', component: SubmittedAllelesComponent },
  { path: 'genetable', component: GeneTableComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    HomeComponent,
    SequencesComponent,
    SubmittedAllelesComponent,
    GeneTableComponent
  ],
  imports: [
    BrowserModule,
    AgGridModule.withComponents([]),
    HttpClientModule,
    ApiModule.forRoot(apiConfigFactory),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [LongReadsubmittedSequencesService,],
  bootstrap: [AppComponent]
})
export class AppModule { }
