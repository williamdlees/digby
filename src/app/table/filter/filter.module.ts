import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatMenuModule} from '@angular/material/menu';
import {MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatSortModule} from '@angular/material/sort';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatToolbarModule} from '@angular/material/toolbar';

import { FilterComponent } from './filter.component';
import { TextFilterComponent } from './text-filter/text-filter.component';
import { BoolFilterComponent } from './bool-filter/bool-filter.component';
import { NumberFilterComponent } from './number-filter/number-filter.component';
import { DateFilterComponent } from './date-filter/date-filter.component';
import { DynamicModule } from 'ng-dynamic-component';
import { NgMultiSelectDropDownModule} from 'ng-multiselect-dropdown';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatTableModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgMultiSelectDropDownModule,
    DynamicModule,
  ],
  declarations: [TextFilterComponent, BoolFilterComponent, NumberFilterComponent, DateFilterComponent, FilterComponent, ],
  providers: [MatNativeDateModule,
  {provide: MAT_DATE_LOCALE, useValue: 'fr-FR'},
  ],
  exports: [
    FilterComponent
  ]
})
export class FilterModule { }
