import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, NgModule, inject, provideAppInitializer } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GenGeneTableComponent } from './gen-gene-table/gen-gene-table.component';

import { ApiModule, Configuration, ConfigurationParameters, BASE_PATH } from 'projects/digby-swagger-client';
import { HomeComponent } from './home/home.component';
import {Router, RouteReuseStrategy, RouterModule, Routes} from '@angular/router';
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
import { GenSampleComponent } from './gen-sample/gen-sample.component';
import { GenSamplePanelComponent } from './gen-sample/gen-sample-panel/gen-sample-panel.component';
import {ObserversModule} from '@angular/cdk/observers';
import {CustomReuseStrategy} from './shared/route-reuse-strategy';
import { GenSampleInfoComponent } from './gen-sample/gen-sample-info/gen-sample-info.component';
import { ReportsComponent } from './reports/reports.component';
import { ReportParamsDialogComponent } from './reports/report-params-dialog/report-params-dialog.component';
import { RepGeneNotesComponent } from './rep-gene-table/rep-gene-notes/rep-gene-notes.component';
import { SafePipe } from './safe.pipe';
import { ResizableModule } from 'angular-resizable-element';
import {MatRippleModule} from '@angular/material/core';
import { ReportErrorDialogComponent } from './reports/report-error-dialog/report-error-dialog.component';
import { QuickRefComponent } from './home/quick-ref/quick-ref.component';
import { UserGuideComponent } from './home/user-guide/user-guide.component';
import {GoogleChartsModule} from 'angular-google-charts';
import { RepExploreDataComponent } from './rep-explore-data/rep-explore-data.component';
import { RepExploreDataPanelComponent } from './rep-explore-data/rep-explore-data-panel/rep-explore-data-panel.component';
import { LicensingComponent } from './home/licensing/licensing.component';
import { ReportRunDialogComponent } from './reports/report-run-dialog/report-run-dialog.component';
import { AuthComponent } from './auth/auth.component';
import { AuthInterceptorService } from './auth/auth-interceptor.service';
import {appInitializer} from "./auth/auth.initializer";
import {AuthService} from "./auth/auth.service";
import {AuthGuard} from "./auth/auth.guard";
import {MatTooltipModule} from "@angular/material/tooltip";
import { GenExploreDataComponent } from './gen-explore-data/gen-explore-data.component';
import { GenExploreDataPanelComponent } from './gen-explore-data/gen-explore-data-panel/gen-explore-data-panel.component';
import { RefbookComponent } from './refbook/refbook.component';
import { RefbookPanelComponent } from './refbook/refbook-panel/refbook-panel.component';
import { ReportsService, GenomicService, RepseqService, SystemService } from 'projects/digby-swagger-client';
import { ReportRunService } from './reports/report-run.service';
import { ColumnResizeDirective } from './table/column-resize.directive';

export function apiConfigFactory(): Configuration  {
  const params: ConfigurationParameters = {
    // set configuration parameters here.
    basePath: environment.apiBasePath,
  };

  return new Configuration(params);
}

const appRoutes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  // AIRR-seq menu
  { path: 'datarep', component: RepExploreDataComponent, canActivate: [AuthGuard] },
  { path: 'samplerep/:onlySelectedSamples', component: RepSampleComponent, canActivate: [AuthGuard] },
  { path: 'generep', component: RepGeneTableComponent, canActivate: [AuthGuard] },
  { path: 'generep/:species/:dataset/:alleleName', component: RepGeneTableComponent, canActivate: [AuthGuard] },
  // Genomics menu
  { path: 'datagen', component: GenExploreDataComponent, canActivate: [AuthGuard] },
  { path: 'genesample/:onlySelectedSamples', component: GenSampleComponent, canActivate: [AuthGuard] },
  { path: 'genetable', component: GenGeneTableComponent, canActivate: [AuthGuard] },
  { path: 'genebrowser/:speciesName/:refName', component: GeneBrowserComponent, canActivate: [AuthGuard] },
  // Analysis menu
  { path: 'reference_book/:species', component: RefbookComponent, canActivate: [AuthGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard] },
  // Help menu
  { path: 'quick-ref', component: QuickRefComponent, canActivate: [AuthGuard] },
  { path: 'user-guide', component: UserGuideComponent, canActivate: [AuthGuard] },
  { path: 'licensing', component: LicensingComponent, canActivate: [AuthGuard] },
  { path: 'auth', component: AuthComponent },
  { path: '**', component: HomeComponent, canActivate: [AuthGuard] },
];

@NgModule({ declarations: [
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
        GenSampleComponent,
        GenSamplePanelComponent,
        GenSampleInfoComponent,
        ReportsComponent,
        ReportParamsDialogComponent,
        RepGeneNotesComponent,
        SafePipe,
        ReportErrorDialogComponent,
        QuickRefComponent,
        UserGuideComponent,
        RepExploreDataComponent,
        RepExploreDataPanelComponent,
        LicensingComponent,
        ReportRunDialogComponent,
        AuthComponent,
        GenExploreDataComponent,
        GenExploreDataPanelComponent,
        RefbookComponent,
        RefbookPanelComponent,
        ColumnResizeDirective,
    ],
    bootstrap: [AppComponent],
    schemas: [
        // Add CUSTOM_ELEMENTS_SCHEMA to suppress errors about unknown elements in templates
        // This is needed for the ResizableModule directives to work with material components
        // We would need to refactor the code to use the proper directives, but this is a workaround for now
        // during the Angular upgrade
        CUSTOM_ELEMENTS_SCHEMA
    ], imports: [BrowserModule,
        BrowserAnimationsModule,
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
        ObserversModule,
        ResizableModule,
        GoogleChartsModule,
        MatTooltipModule], providers: [
        RequestCache,
        AuthService,
        ReportsService,
        GenomicService,
        RepseqService,
        SystemService,
        ReportRunService,
        { provide: BASE_PATH, useValue: environment.apiBasePath },
        { provide: HTTP_INTERCEPTORS, useClass: CachingInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true },
        { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
        provideAppInitializer(() => {
        const initializerFn = (appInitializer)(inject(AuthService));
        return initializerFn();
      }),
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {
}
