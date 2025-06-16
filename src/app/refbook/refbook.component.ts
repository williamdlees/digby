import { Component, OnInit } from '@angular/core';
import { RefbookPanelComponent } from './refbook-panel/refbook-panel.component';

@Component({
    selector: 'app-refbook',
    templateUrl: './refbook.component.html',
    styleUrls: ['./refbook.component.scss'],
    imports: [RefbookPanelComponent]
})
export class RefbookComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
