import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';
import {IDropdownSettings} from 'ng-multiselect-dropdown';

export interface SampleCoverage {
  genomic: string[];
  genomicScope: string;
  AIRRSeq: string[];
  AIRRSeqScope: string;
}

@Component({
  selector: 'app-report-params-dialog',
  templateUrl: './report-params-dialog.component.html',
  styleUrls: ['./report-params-dialog.component.css'],
  encapsulation: ViewEncapsulation.None   // needed for css styling
})
export class ReportParamsDialogComponent implements OnInit {
  @Input() report;
  @Input() filterParams;
  @Input() sampleCoverage: SampleCoverage;
  myFormGroup: FormGroup;
  params = [];
  scopeText : string

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

    this.scopeText = 'The report will be run on ';
    if (this.report.scope.includes("gen_sample")) {
      if (this.sampleCoverage.genomic.length > 1) {
        this.scopeText += this.sampleCoverage.genomicScope + ' samples from ' + this.sampleCoverage.genomic.join(', ') + ' genomic datasets';
      } else if (this.sampleCoverage.genomic.length === 1) {
        this.scopeText += this.sampleCoverage.genomicScope + ' samples from the ' + this.sampleCoverage.genomic[0] + ' genomic dataset';
      }
    }

    if (this.report.scope.includes("gen_sample") &&
      this.report.scope.includes("rep_sample") &&
      this.sampleCoverage.genomic.length > 0 && this.sampleCoverage.AIRRSeq.length > 0) {
      this.scopeText += ' and ';
    }

    if (this.report.scope.includes("rep_sample")) {
      if (this.sampleCoverage.AIRRSeq.length > 1) {
        this.scopeText += this.sampleCoverage.AIRRSeqScope + ' samples from ' + this.sampleCoverage.AIRRSeq.join(', ') + ' AIRR-Seq datasets';
      } else if (this.sampleCoverage.AIRRSeq.length === 1) {
        this.scopeText += this.sampleCoverage.AIRRSeqScope + ' samples from the ' + this.sampleCoverage.AIRRSeq[0] + ' AIRR-Seq dataset';
      }
    }
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
