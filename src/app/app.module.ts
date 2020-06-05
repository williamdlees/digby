import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GenGeneTableComponent } from './gen-gene-table/gen-gene-table.component';

import { ApiModule, Configuration, ConfigurationParameters } from 'dist/digby-swagger-client';
import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { AppHeaderComponent } from './app-header/app-header.component';
import { environment } from '../environments/environment';
import {GenGeneTablePanelComponent} from './gen-gene-table/gen-gene-table-panel/gen-gene-table-panel.component';
import { GeneTableSelectorComponent } from './gene-table-selector/gene-table-selector.component';
import {DropdownDirective} from './shared/dropdown.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SeqModalComponent } from './seq-modal/seq-modal.component';
import { GeneBrowserComponent } from './gene-browser/gene-browser.component';
import { GeneBrowserPanelComponent } from './gene-browser/gene-browser-panel/gene-browser-panel.component';
import { GeneTruncPipe } from './shared/gene-trunc-pipe';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RequestCache } from './shared/http_cache';
import {CachingInterceptor } from './shared/caching_interceptor';
import { RepSampleComponent } from './rep-sample/rep-sample.component';
import { RepSamplePanelComponent } from './rep-sample/rep-sample-panel/rep-sample-panel.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { DynamicModule } from 'ng-dynamic-component';
import { FilterModule } from './table/filter/filter.module';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule} from '@angular/material/menu';
import {ColumnSorterComponent} from './table/column-sorter/column-sorter.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatCardModule} from '@angular/material/card';
import { RepSampleInfoComponent } from './rep-sample/rep-sample-info/rep-sample-info.component';
import { RepGeneTableComponent } from './rep-gene-table/rep-gene-table.component';
import { RepGeneTablePanelComponent } from './rep-gene-table/rep-gene-table-panel/rep-gene-table-panel.component';

export function apiConfigFactory(): Configuration  {
  const params: ConfigurationParameters = {
    // set configuration parameters here.
    basePath: environment.apiBasePath,
  };
  return new Configuration(params);
}

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'genetable', component: GenGeneTableComponent },
  { path: 'genebrowser/:speciesName/:refName', component: GeneBrowserComponent },
  { path: 'samplerep', component: RepSampleComponent },
  { path: 'generep', component: RepGeneTableComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    HomeComponent,
    GenGeneTableComponent,
    GenGeneTablePanelComponent,
    GeneTableSelectorComponent,
    DropdownDirective,
    SeqModalComponent,
    GeneBrowserComponent,
    GeneBrowserPanelComponent,
    GeneTruncPipe,
    RepSampleComponent,
    RepSamplePanelComponent,
    ColumnSorterComponent,
    RepSampleInfoComponent,
    RepGeneTableComponent,
    RepGeneTablePanelComponent,
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
    NgMultiSelectDropDownModule.forRoot(),
    FilterModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    DragDropModule,
    MatCardModule,
  ],
  providers: [
    RequestCache,
    { provide: HTTP_INTERCEPTORS, useClass: CachingInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
  entryComponents: [SeqModalComponent, RepSampleInfoComponent],
})
export class AppModule {
}

