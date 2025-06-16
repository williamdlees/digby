import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { GeneTableSelection } from '../../gene-table-selector/gene-table-selector.model';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';


@Component({
    selector: 'app-refbook-panel',
    templateUrl: './refbook-panel.component.html',
    styleUrls: ['./refbook-panel.component.css']
})

export class RefbookPanelComponent implements OnInit, AfterViewInit {
  public params = null;
  geneTableServiceSubscription = null;
  paramState = "pre selection";
  selection = null;

  constructor(
    private geneTableService: GeneTableSelectorService,
    private route: ActivatedRoute,
    ) {
    this.route.params.subscribe((params) => (this.params = params));
  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    // see this note on 'expression changed after it was checked' https://blog.angular-university.io/angular-debugging/
    console.log("ngAfterViewInit");
    setTimeout(() => {
      this.geneTableServiceSubscription = this.geneTableService.source
        .pipe(debounceTime(500))
        .subscribe((sel: GeneTableSelection) => {
          if (sel.species) {
            console.log("geneTableService event: " + sel.species);
            this.setSelection(sel);
          }
        });
    }, 1000);
  }

  setSelection(sel) {
    if (typeof sel !== "undefined") {
      if (this.selection == null) {
        this.selection = sel;
      }

      // on first load, set the selection from the URL, if a valid selection is provided
      // this will fire a fresh geneTableService event so that the selector is updated
      if (this.paramState == "pre selection"&& typeof this.params.species !== "undefined" && this.params.species != 'null') {
          console.log("pre-selection from valid URL: " + this.params.species);
          this.paramState = "post selection";
          sel.species = this.params.species;
          //this.geneTableService.selection.next(sel);
      } else {
        console.log("setSelection post-selection: " + sel.species);
        if (typeof this.selection === "undefined") {
          this.selection == sel
        }
        this.selection.species = sel.species
      }
    } else {
      console.log("undefined selection object: " + typeof sel);
    }
  }
}
