import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GeneTableComponent } from './genetable/gene-table.component';

import { ApiModule, Configuration, ConfigurationParameters } from 'dist/digby-swagger-client';
import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { AppHeaderComponent } from './app-header/app-header.component';
import { environment } from '../environments/environment';
import {GeneTablePanelComponent} from './genetable/gene-table-panel/gene-table-panel.component';
import { GeneTableSelectorComponent } from './genetable/gene-table-selector/gene-table-selector.component';
import {DropdownDirective} from './shared/dropdown.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SeqModalComponent } from './genetable/seq-modal/seq-modal.component';
import { GeneBrowserComponent } from './gene-browser/gene-browser.component';
import { GeneBrowserPanelComponent } from './gene-browser/gene-browser-panel/gene-browser-panel.component';
import { GeneTruncPipe } from './genetable/gene-trunc-pipe';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RequestCache } from './shared/http_cache';
import {CachingInterceptor } from './shared/caching_interceptor';
import { SampleRepComponent } from './sample-rep/sample-rep.component';
import { SampleRepPanelComponent } from './sample-rep/sample-rep-panel/sample-rep-panel.component';


export function apiConfigFactory(): Configuration  {
  const params: ConfigurationParameters = {
    // set configuration parameters here.
    basePath: environment.apiBasePath,
  };
  return new Configuration(params);
}

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'genetable', component: GeneTableComponent },
  { path: 'genebrowser/:speciesName/:refName', component: GeneBrowserComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    HomeComponent,
    GeneTableComponent,
    GeneTablePanelComponent,
    GeneTableSelectorComponent,
    DropdownDirective,
    SeqModalComponent,
    GeneBrowserComponent,
    GeneBrowserPanelComponent,
    GeneTruncPipe,
    SampleRepComponent,
    SampleRepPanelComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    RouterModule.forRoot(appRoutes),
    ApiModule.forRoot(apiConfigFactory),
  ],
  providers: [
    RequestCache,
    { provide: HTTP_INTERCEPTORS, useClass: CachingInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
  entryComponents: [SeqModalComponent],
})
export class AppModule { }
