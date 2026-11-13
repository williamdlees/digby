import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-user-guide',
    templateUrl: './user-guide.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./user-guide.component.scss']
})
export class UserGuideComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
