// Landing page search: allele and gene names through the existing sequences endpoints, or a pasted sequence
// handed to the sequence search report. See "Search" in docs/site-revision-plan.md.

import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { GenomicService, RepseqService } from 'projects/digby-swagger-client';

export interface SearchResult {
  type: 'Gene' | 'AIRR-seq' | 'Genomic' | 'Download' | 'Sequence';
  label: string;
  detail: string;
  route: string[];
  queryParams?: Record<string, string>;
}

const LOCUS = /^(IG[HKL]|TR[ABDG])/i;
const SEQUENCE = /^[ACGTN.\-]{30,}$/i;
const PAGE_SIZE = 8;

@Injectable({ providedIn: 'root' })
export class SiteSearchService {
  private datasets: Record<string, Observable<{ repseq: string[], genomic: string[] }>> = {};

  constructor(private repseqService: RepseqService, private genomicService: GenomicService) { }

  search(text: string, species: string): Observable<SearchResult[]> {
    const query = text.replace(/\s+/g, '');
    if (SEQUENCE.test(query)) {
      return of([{ type: 'Sequence', label: 'Search this sequence', detail: `${query.length} nt, sequence search report`,
        route: ['/reports'], queryParams: { report: 'sequence_search', sequence: query.toUpperCase() } }]);
    }
    if (query.length < 3) {
      return of([]);
    }

    const locus = query.match(LOCUS)?.[1].toUpperCase();
    return this.speciesDatasets(species).pipe(
      switchMap(sets => {
        const pick = (names: string[]) => names.filter(d => !locus || d.toUpperCase() === locus);
        const calls = [
          ...pick(sets.repseq).map(d => this.names(this.repseqService.getSequencesApi(species, d, 0, PAGE_SIZE, nameFilter(query), undefined, COLS), 'AIRR-seq', d)),
          ...pick(sets.genomic).map(d => this.names(this.genomicService.getSequencesApi(species, d, 0, PAGE_SIZE, nameFilter(query), undefined, COLS), 'Genomic', d)),
        ];
        return (calls.length ? forkJoin(calls) : of([])).pipe(
          map(lists => group(lists.flat(), species, locus && sets.repseq.find(d => d.toUpperCase() === locus)))
        );
      })
    );
  }

  private speciesDatasets(species: string) {
    const names = (obs: Observable<any>) => obs.pipe(map((r: { dataset: string }[]) => r.map(d => d.dataset)), catchError(() => of([])));
    this.datasets[species] ??= forkJoin({
      repseq: names(this.repseqService.getDataSetApi(species)),
      genomic: names(this.genomicService.getDataSetApi(species)),
    }).pipe(shareReplay(1));
    return this.datasets[species];
  }

  private names(call: Observable<any>, source: 'AIRR-seq' | 'Genomic', dataset: string) {
    // the AIRR-seq endpoint returns its rows as samples, the genomic one as sequences
    return call.pipe(
      map(resp => (resp.samples ?? resp.sequences ?? []).map(r => ({ name: r.name, gene: r.gene_name, source, dataset }))),
      catchError(() => of([]))
    );
  }
}

const COLS = JSON.stringify(['name', 'gene_name']);

function nameFilter(query: string): string {
  return JSON.stringify([{ field: 'name', op: 'ilike', value: `%${query}%` }]);
}

function dashboardLink(gene: string): Pick<SearchResult, 'route' | 'queryParams'> {
  return { route: ['/dash_refbook'], queryParams: { sources: 'genomic,airrseq', segment: gene.charAt(3).toUpperCase(), genes: gene } };
}

// genes first, then alleles, then a download row when the locus is known
function group(rows: { name: string, gene: string, source: 'AIRR-seq' | 'Genomic', dataset: string }[], species: string, downloadDataset: string): SearchResult[] {
  const genes = [...new Set(rows.map(r => r.gene).filter(Boolean))];
  const results: SearchResult[] = genes.map(gene => ({ type: 'Gene', label: gene, detail: 'Allele Reference dashboard', ...dashboardLink(gene) }));

  for (const r of rows) {
    if (r.source === 'AIRR-seq') {
      results.push({ type: 'AIRR-seq', label: r.name, detail: `${species} ${r.dataset} allele`, route: ['/generep', species, r.dataset, r.name] });
    } else {
      // shortcut: the genomic gene table takes no URL filter, so a genomic allele opens its gene in the dashboard
      results.push({ type: 'Genomic', label: r.name, detail: `${species} ${r.dataset} genomic allele`, ...dashboardLink(r.gene || r.name) });
    }
  }

  if (downloadDataset) {
    results.push({ type: 'Download', label: `Download curated data for ${species} ${downloadDataset}`, detail: 'Genotypes, haplotypes and repertoires',
      route: ['/downloads'], queryParams: { species, dataset: downloadDataset } });
  }
  return results;
}
