// Landing page search: allele and gene names through the existing sequences endpoints, or a pasted sequence
// handed to the sequence search report. See "Search" in docs/site-revision-plan.md.

import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { GenomicService, RefbookService, RepseqService } from 'projects/digby-swagger-client';

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
  private ascs: Record<string, Observable<string[]>> = {};

  constructor(private repseqService: RepseqService, private genomicService: GenomicService,
              private refbookService: RefbookService) { }

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
          ...pick(sets.repseq).map(d => this.names(this.repseqService.getSequencesApi(species, d, 0, PAGE_SIZE, nameFilter(query), undefined, COLS), 'AIRR-seq', species, d)),
          ...pick(sets.genomic).map(d => this.names(this.genomicService.getSequencesApi(species, d, 0, PAGE_SIZE, nameFilter(query), undefined, COLS), 'Genomic', species, d)),
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

  // the genes the dashboard can open: pseudogenes and orphons have sequences but no ASC
  private locusAscs(species: string, locus: string) {
    this.ascs[`${species}/${locus}`] ??= this.refbookService.getAscsInLocusApi(species, locus).pipe(
      map((r: { ascs: string[] }) => r.ascs ?? []), catchError(() => of([])), shareReplay(1));
    return this.ascs[`${species}/${locus}`];
  }

  private names(call: Observable<any>, source: 'AIRR-seq' | 'Genomic', species: string, dataset: string) {
    // the AIRR-seq endpoint returns its rows as samples, the genomic one as sequences
    return forkJoin([call, this.locusAscs(species, dataset)]).pipe(
      map(([resp, ascs]) => (resp.samples ?? resp.sequences ?? [])
        .map(r => ({ name: r.name, gene: r.gene_name, source, dataset, asc: ascs.includes(r.gene_name) }))),
      catchError(() => of([]))
    );
  }
}

const COLS = JSON.stringify(['name', 'gene_name']);

function nameFilter(query: string): string {
  return JSON.stringify([{ field: 'name', op: 'ilike', value: `%${query}%` }]);
}

// with an allele, opens that allele's card; gene_name is the ASC name, the dashboard's own key
function dashboardLink(gene: string, allele?: string): Pick<SearchResult, 'route' | 'queryParams'> {
  const queryParams = { sources: 'genomic,airrseq', segment: gene.charAt(3).toUpperCase(), genes: gene };
  return { route: ['/dash_refbook'], queryParams: allele ? { ...queryParams, panel: 'allele', alleles: allele } : queryParams };
}

// genes first, then alleles, then a download row when the locus is known
function group(rows: { name: string, gene: string, source: 'AIRR-seq' | 'Genomic', dataset: string, asc: boolean }[], species: string, downloadDataset: string): SearchResult[] {
  const genes = [...new Set(rows.map(r => r.gene).filter(Boolean))];
  const results: SearchResult[] = genes.map(gene => ({ type: 'Gene', label: gene, detail: 'Allele Reference dashboard', ...dashboardLink(gene) }));

  for (const r of rows) {
    const detail = `${species} ${r.dataset} ${r.source === 'AIRR-seq' ? '' : 'genomic '}allele`;
    if (r.asc) {
      results.push({ type: r.source, label: r.name, detail, ...dashboardLink(r.gene, r.name) });
    } else if (r.source === 'AIRR-seq') {
      // no card for a pseudogene or orphon allele, so it keeps its AIRR-seq table entry
      results.push({ type: r.source, label: r.name, detail, route: ['/generep', species, r.dataset, r.name] });
    } else {
      results.push({ type: r.source, label: r.name, detail, ...dashboardLink(r.gene || r.name) });
    }
  }

  if (downloadDataset) {
    results.push({ type: 'Download', label: `Download curated data for ${species} ${downloadDataset}`, detail: 'Genotypes, haplotypes and repertoires',
      route: ['/downloads'], queryParams: { species, dataset: downloadDataset } });
  }
  return results;
}
