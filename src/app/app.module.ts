import { GenGeneTableComponent } from './gen-gene-table/gen-gene-table.component';

import { Configuration, ConfigurationParameters } from 'projects/digby-swagger-client';
import { HomeComponent } from './home/home.component';
import { Routes} from '@angular/router';
import { environment } from '../environments/environment';
import { GeneBrowserComponent } from './gene-browser/gene-browser.component';
import { RepSampleComponent } from './rep-sample/rep-sample.component';
import { RepGeneTableComponent } from './rep-gene-table/rep-gene-table.component';
import { GenSampleComponent } from './gen-sample/gen-sample.component';
import { ReportsComponent } from './reports/reports.component';
import { QuickRefComponent } from './home/quick-ref/quick-ref.component';
import { UserGuideComponent } from './home/user-guide/user-guide.component';
import { RepExploreDataComponent } from './rep-explore-data/rep-explore-data.component';
import { LicensingComponent } from './home/licensing/licensing.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from "./auth/auth.guard";
import { GenExploreDataComponent } from './gen-explore-data/gen-explore-data.component';
import { RefbookComponent } from './refbook/refbook.component';

export function apiConfigFactory(): Configuration  {
  const params: ConfigurationParameters = {
    // set configuration parameters here.
    basePath: environment.apiBasePath,
  };

  return new Configuration(params);
}

const appRoutes: Routes = [
  { path: '', loadComponent: () => HomeComponent, canActivate: [AuthGuard] },
  // AIRR-seq menu
  { path: 'datarep', loadComponent: () => RepExploreDataComponent, canActivate: [AuthGuard] },
  { path: 'samplerep/:onlySelectedSamples', loadComponent: () => RepSampleComponent, canActivate: [AuthGuard] },
  { path: 'generep', loadComponent: () => RepGeneTableComponent, canActivate: [AuthGuard] },
  { path: 'generep/:species/:dataset/:alleleName', loadComponent: () => RepGeneTableComponent, canActivate: [AuthGuard] },
  // Genomics menu
  { path: 'datagen', loadComponent: () => GenExploreDataComponent, canActivate: [AuthGuard] },
  { path: 'genesample/:onlySelectedSamples', loadComponent: () => GenSampleComponent, canActivate: [AuthGuard] },
  { path: 'genetable', loadComponent: () => GenGeneTableComponent, canActivate: [AuthGuard] },
  { path: 'genebrowser/:speciesName/:refName', loadComponent: () => GeneBrowserComponent, canActivate: [AuthGuard] },
  // Analysis menu
  { path: 'reference_book/:species', loadComponent: () => RefbookComponent, canActivate: [AuthGuard] },
  { path: 'reports', loadComponent: () => ReportsComponent, canActivate: [AuthGuard] },
  // Help menu
  { path: 'quick-ref', loadComponent: () => QuickRefComponent, canActivate: [AuthGuard] },
  { path: 'user-guide', loadComponent: () => UserGuideComponent, canActivate: [AuthGuard] },
  { path: 'licensing', loadComponent: () => LicensingComponent, canActivate: [AuthGuard] },
  { path: 'auth', loadComponent: () => AuthComponent },
  { path: '**', loadComponent: () => HomeComponent, canActivate: [AuthGuard] },
];


