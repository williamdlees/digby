import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-licensing',
    templateUrl: './licensing.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./licensing.component.scss']
})
export class LicensingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
