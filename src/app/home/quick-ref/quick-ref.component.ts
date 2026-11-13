import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-quick-ref',
    templateUrl: './quick-ref.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./quick-ref.component.css']
})
export class QuickRefComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
