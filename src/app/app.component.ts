import { Component } from '@angular/core';
import {ReportRunService} from './reports/report-run.service';
import { AppHeaderComponent } from './app-header/app-header.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [AppHeaderComponent, RouterOutlet]
})
export class AppComponent {
  title = 'digby';
}
