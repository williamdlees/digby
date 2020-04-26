import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GeneTableComponent } from './genetable/gene-table.component';

import { ApiModule, Configuration, ConfigurationParameters } from 'dist/digby-swagger-client';
import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { AppHeaderComponent } from './app-header/app-header.component';
import { LongReadsubmittedSequencesService } from 'dist/digby-swagger-client';
import { environment } from '../environments/environment';
import {GeneTablePanelComponent} from './genetable/gene-table-panel/gene-table-panel.component';
import { GeneTableSelectorComponent } from './genetable/gene-table-selector/gene-table-selector.component';
import {DropdownDirective} from './shared/dropdown.directive';
import {DataTablesModule} from 'angular-datatables';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SeqModalComponent } from './genetable/seq-modal/seq-modal.component';
import { GeneBrowserComponent } from './gene-browser/gene-browser.component';
import { GeneBrowserSelectorComponent } from './gene-browser/gene-browser-selector/gene-browser-selector.component';
import { GeneBrowserPanelComponent } from './gene-browser/gene-browser-panel/gene-browser-panel.component';

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
    GeneBrowserSelectorComponent,
    GeneBrowserPanelComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ApiModule.forRoot(apiConfigFactory),
    RouterModule.forRoot(appRoutes),
    FormsModule,
    ReactiveFormsModule,
    DataTablesModule,
    NgbModule,
  ],
  providers: [LongReadsubmittedSequencesService,],
  bootstrap: [AppComponent],
  entryComponents: [SeqModalComponent],
})
export class AppModule { }
