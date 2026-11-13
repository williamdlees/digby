import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { environment } from '../../../environments/environment';

// The studies of one AIRR-seq dataset, as returned in dataset_info, with links to the per-study download scripts
@Component({
    selector: 'app-study-table',
    templateUrl: './study-table.component.html',
    styleUrls: ['./study-table.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class StudyTableComponent {
  @Input() studies: any[] = [];
  apibasePath = environment.apiBasePath;
}
