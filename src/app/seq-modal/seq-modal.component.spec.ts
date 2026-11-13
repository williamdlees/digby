import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SeqModalComponent } from './seq-modal.component';

describe('sequence modal', () => {
  it('formats numbered, FASTA and gapped sequences', () => {
    TestBed.configureTestingModule({ providers: [NgbActiveModal] });
    const component = new SeqModalComponent(TestBed.inject(NgbActiveModal));
    component.name = 'allele';
    component.content = { ungapped: 'ACGTAC', gapped: 'AC.GTAC' };
    component.width = 4;
    component.ngOnInit();
    expect(component.gappedAvailable).toBe(true);
    expect(component.displayContent).toBe('1    <br>ACGT<br><br>5    <br>AC<br><br>');
    const fasta = document.createElement('button');
    component.onFastaClick(fasta);
    expect(fasta.textContent).toBe('Numbered');
    expect(component.displayContent).toBe('>allele<br>ACGT<br>AC<br>');
    const gapped = document.createElement('button');
    component.onGappedClick(gapped);
    expect(gapped.textContent).toBe('Ungapped');
    expect(component.displayContent).toBe('>allele<br>AC.G<br>TAC<br>');
  });
});
