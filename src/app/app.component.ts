import { Component } from '@angular/core';
import {ReportRunService} from './reports/report-run.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ReportRunService],
})
export class AppComponent {
  title = 'digby';
}
