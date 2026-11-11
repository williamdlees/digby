import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { RefbookService } from '../../../../projects/digby-swagger-client/api/refbook.service';
import { retryWithBackoff } from '../../shared/retry_with_backoff';
import { SpeciesGeneSelection, sourcesParam, allelesParam } from '../../shared/models/species-gene-selection.model';
import { DashDrillService } from '../dash-drill.service';
import { CodonVariability, Region, V_REGIONS, variability } from './alignment-variability';

@Component({
  selector: 'app-dash-refbook-alignment',
  templateUrl: './dash-refbook-alignment.component.html',
  styleUrls: ['./dash-refbook-alignment.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DashRefbookAlignmentComponent implements OnInit, OnChanges {
  @Input() selection: SpeciesGeneSelection;

  isFetching = false;
  error: string | null = null;
  alignment = '';
  segment = '';
  codonWrap = 20;
  legend: { label: string; name: string }[] = [];
  /** The alignment by line; a line that starts with a name gets that name as a link. */
  rows: { name?: string; full?: string; rest: string }[] = [];
  showLegend = false;
  /** Summary drawn above the alignment: how many alleles differ at each codon, and in which IMGT region. */
  profile: { codons: CodonVariability[]; alleles: number } = { codons: [], alleles: 0 };
  regions: (Region & { len: number; nt: number; aa: number })[] = [];
  reference = '';
  readonly barHeight = 40;

  readonly wrapOptions = [10, 15, 20, 30, 40];

  constructor(private refbookService: RefbookService, readonly drill: DashDrillService) {}

  ngOnInit() {
    this.fetchData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selection'] && !changes['selection'].firstChange) {
      this.fetchData();
    }
  }

  onWrapChange() {
    this.fetchData();
  }

  copyToClipboard() {
    navigator.clipboard?.writeText(this.alignment);
  }

  download() {
    const name = `${this.selection.species}_${this.selection.asc}_alignment.txt`.replace(/[^\w.-]/g, '_');
    const url = URL.createObjectURL(new Blob([this.alignment], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  private summarise(segment: string) {
    this.profile = variability(this.alignment);
    this.reference = this.rows.find(r => r.full)?.full ?? '';
    const n = this.profile.codons.length;
    // the regions are IMGT V numbering; D and J alignments get the bars alone
    this.regions = segment === 'V' ? V_REGIONS.filter(r => r.start <= n).map(r => {
      const end = Math.min(r.end, n);
      const inside = this.profile.codons.slice(r.start - 1, end);
      return { ...r, end, len: end - r.start + 1, nt: inside.filter(c => c.nt).length, aa: inside.filter(c => c.aa).length };
    }) : [];
  }

  regionOf(codon: number): string {
    const r = this.regions.find(x => codon >= x.start && codon <= x.end);
    return r ? ` (${r.name})` : '';
  }

  barY(count: number): number {
    return this.barHeight * (1 - count / this.profile.alleles);
  }

  private fetchData() {
    if (!this.selection?.species || !this.selection?.chain || !this.selection?.asc) {
      this.isFetching = false;
      this.alignment = '';
      return;
    }

    this.isFetching = true;
    this.error = null;

    this.refbookService
      .getAscAlignment(this.selection.species, this.selection.chain, this.selection.asc,
                       this.codonWrap, sourcesParam(this.selection),
                       allelesParam(this.selection))
      .pipe(
        retryWithBackoff(),
        catchError(err => {
          this.error = err?.error?.message ?? err?.message ?? 'Could not load the alignment';
          this.isFetching = false;
          this.alignment = '';
          this.rows = [];
          return EMPTY;
        })
      )
      .subscribe((data: { alignment: string; segment: string; legend: Record<string, string> }) => {
        this.isFetching = false;
        this.alignment = data.alignment;
        this.segment = data.segment;
        this.legend = Object.entries(data.legend ?? {}).map(([label, name]) => ({ label, name }));
        // ruler and translation lines start with spaces; allele lines start with the (maybe shortened) name
        this.rows = data.alignment.split('\n').map(line => {
          const m = /^(\S+)(.*)$/.exec(line);
          return m ? { name: m[1], full: data.legend?.[m[1]] ?? m[1], rest: m[2] } : { rest: line };
        });
        this.summarise(data.segment);
      });
  }
}
