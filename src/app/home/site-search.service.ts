// Landing page search: allele and gene names through the existing sequences endpoints, or a pasted sequence
// handed to the sequence search report. See "Search" in docs/site-revision-plan.md.

import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { GenomicService, RefbookService, RepseqService } from 'projects/digby-swagger-client';

export interface SearchAction {
  label: string;
  route?: string[];
  queryParams?: Record<string, string>;
  href?: string;
}

export interface SearchResult {
  type: 'Gene' | 'Family' | 'Allele' | 'Download' | 'Sequence';
  label: string;
  detail: string;
  actions: SearchAction[];
}

const LOCUS = /^(IG[HKL]|TR[ABDG])/i;
const FAMILY = /^(IG[HKL]|TR[ABDG])[VDJ]\d+$/i;
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
      const seq = query.toUpperCase();
      return of([{ type: 'Sequence', label: 'Pasted sequence', detail: `${seq.length} nt`, actions: [
        { label: 'Closest alleles (alignment report)', route: ['/reports'], queryParams: { report: 'sequence_search', sequence: seq } },
        // auto mode: an exact match lands on the allele's page, otherwise AIRBabel shows what it found
        { label: 'Look up in AIRBabel', href: `https://airbabel.org/?q=${seq}&mode=auto&species=${encodeURIComponent(species.toLowerCase())}` },
      ] }]);
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
          map(lists => [...familyResult(query, species, lists.flat()),
                        ...group(lists.flat(), species, locus && sets.repseq.find(d => d.toUpperCase() === locus))])
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
        .map((r): Row => ({ name: r.name, gene: r.gene_name, source, dataset, asc: ascs.includes(r.gene_name) }))),
      catchError(() => of([]))
    );
  }
}

const COLS = JSON.stringify(['name', 'gene_name']);

function nameFilter(query: string): string {
  return JSON.stringify([{ field: 'name', op: 'ilike', value: `%${query}%` }]);
}

// a gene opens its overview, an allele its card; gene_name is the ASC name, the dashboard's own key
function dashboardLink(gene: string, allele?: string): Pick<SearchAction, 'route' | 'queryParams'> {
  const queryParams = { sources: 'genomic,airrseq', segment: gene.charAt(3).toUpperCase(), genes: gene };
  return { route: ['/dash_refbook'], queryParams: allele ? { ...queryParams, panel: 'allele', alleles: allele } : { ...queryParams, panel: 'overview' } };
}

// a subgroup such as IGHV1 opens the locus map zoomed into it, when the dashboard has genes in it
function familyResult(query: string, species: string, rows: Row[]): SearchResult[] {
  const family = query.toUpperCase();
  if (!FAMILY.test(family) || !rows.some(r => r.asc && r.gene?.toUpperCase().startsWith(family + '-'))) {
    return [];
  }
  return [{ type: 'Family', label: family, detail: `${species} ${family.slice(0, 3)} subgroup`, actions: [
    { label: 'Locus map', route: ['/dash_refbook'], queryParams: { panel: 'sunburst', family } },
  ] }];
}

type Row = { name: string, gene: string, source: 'AIRR-seq' | 'Genomic', dataset: string, asc: boolean };

// one button per data type the name was found in; the table opens with its quick search set to the name
function tableActions(rows: Row[], species: string, name: string): SearchAction[] {
  const sources = [...new Map(rows.map(r => [r.source, r])).values()];
  return sources.map(r => r.source === 'AIRR-seq'
    ? { label: 'AIRR-seq table', route: ['/generep', species, r.dataset, name] }
    : { label: 'Genomic table', route: ['/genetable'], queryParams: { dataset: r.dataset, allele: name } });
}

function by(rows: Row[], key: (r: Row) => string): Map<string, Row[]> {
  const out = new Map<string, Row[]>();
  for (const r of rows) {
    if (key(r)) {
      out.set(key(r), [...(out.get(key(r)) ?? []), r]);
    }
  }
  return out;
}

// genes first, then alleles, then a download row when the locus is known. Pseudogenes and orphons have no
// dashboard entry, so they offer only the tables.
function group(rows: Row[], species: string, downloadDataset: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const [gene, rs] of by(rows, r => r.gene)) {
    results.push({ type: 'Gene', label: gene, detail: `${species} ${rs[0].dataset} gene`, actions: [
      ...(rs.some(r => r.asc) ? [{ label: 'Gene overview', ...dashboardLink(gene) }] : []),
      ...tableActions(rs, species, gene),
    ] });
  }
  for (const [name, rs] of by(rows, r => r.name)) {
    results.push({ type: 'Allele', label: name, detail: `${species} ${rs[0].dataset} allele`, actions: [
      ...(rs[0].asc ? [{ label: 'Allele card', ...dashboardLink(rs[0].gene, name) }] : []),
      ...tableActions(rs, species, name),
    ] });
  }

  if (downloadDataset) {
    results.push({ type: 'Download', label: `Curated data for ${species} ${downloadDataset}`, detail: 'Genotypes, haplotypes and repertoires',
      actions: [{ label: 'Downloads', route: ['/downloads'], queryParams: { species, dataset: downloadDataset } }] });
  }
  return results;
}
