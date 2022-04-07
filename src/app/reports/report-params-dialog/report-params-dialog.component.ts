import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';
import {IDropdownSettings} from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-report-params-dialog',
  templateUrl: './report-params-dialog.component.html',
  styleUrls: ['./report-params-dialog.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling
})
export class ReportParamsDialogComponent implements OnInit {
  @Input() report;
  @Input() filterParams;
  myFormGroup: FormGroup;
  params = [];

  repDropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'id',
    textField: 'text',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 3,
    allowSearchFilter: true
  };

  constructor(public activeModal: NgbActiveModal,
              private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    const group = {};

    this.report.params.forEach(t => {
      this.add_fields(t, group);
    });

    if (this.report.filter_params) {
      for (let key in this.filterParams) {
        this.add_fields(this.filterParams[key], group);
      }
    }

    this.myFormGroup = new FormGroup(group);
  }

  private add_fields(t, group) {
    if (t.type === 'select' && t.options.length > 0) {
      group[t.id] = new FormControl(t.options[0]);
    } else {
      group[t.id] = new FormControl('');
    }

    this.params.push(t);
  }

  onSubmit() {
    this.activeModal.close(this.myFormGroup.value);
  }
}
