import {Component, OnInit, ViewEncapsulation, Input} from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';


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
    encapsulation: ViewEncapsulation.None // needed for css styling
    ,
    imports: [FormsModule, ReactiveFormsModule, NgMultiSelectDropDownModule]
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

    const report = this.report;
    if (report.filter_params) {
      for (let key in this.filterParams) {
        this.add_fields(this.filterParams[key], group);
      }
    }

    this.myFormGroup = new FormGroup(group);

    this.scopeText = 'The report will be run on ';
    const sampleCoverage = this.sampleCoverage;
    if (report.scope.includes("gen_sample")) {
      if (this.sampleCoverage.genomic.length > 1) {
        this.scopeText += this.sampleCoverage.genomicScope + ' samples from ' + this.sampleCoverage.genomic.join(', ') + ' genomic datasets';
      } else if (sampleCoverage.genomic.length === 1) {
        this.scopeText += sampleCoverage.genomicScope + ' samples from the ' + sampleCoverage.genomic[0] + ' genomic dataset';
      }
    }

    if (report.scope.includes("gen_sample") &&
      report.scope.includes("rep_sample") &&
      sampleCoverage.genomic.length > 0 && sampleCoverage.AIRRSeq.length > 0) {
      this.scopeText += ' and ';
    }

    if (report.scope.includes("rep_sample")) {
      if (sampleCoverage.AIRRSeq.length > 1) {
        this.scopeText += sampleCoverage.AIRRSeqScope + ' samples from ' + sampleCoverage.AIRRSeq.join(', ') + ' AIRR-Seq datasets';
      } else if (sampleCoverage.AIRRSeq.length === 1) {
        this.scopeText += sampleCoverage.AIRRSeqScope + ' samples from the ' + sampleCoverage.AIRRSeq[0] + ' AIRR-Seq dataset';
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
