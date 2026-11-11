// Landing page content that changes without code changes elsewhere: question cards, entry cards, citation, contribute links.

export interface LinkItem {
  label: string;
  route?: string;                         // in-app route
  queryParams?: Record<string, string>;
  href?: string;                          // external link
}

// shown under the search box; clicking one runs it
export const SEARCH_EXAMPLES = ['IGHV1-69', 'IGHV1-69*02', 'IGKV', 'TRBV'];

export const QUESTIONS: (LinkItem & { kind: string })[] = [
  { kind: 'Sequence', label: 'How do the IGHV1-69 alleles differ in CDR2?', route: '/dash_refbook',
    queryParams: { sources: 'genomic,airrseq', segment: 'V', genes: 'IGHV1-69', panel: 'alignment' } },
  { kind: 'Genotypes', label: 'Which IGHV1-69 alleles occur together?', route: '/dash_refbook',
    queryParams: { sources: 'genomic,airrseq', segment: 'V', genes: 'IGHV1-69', panel: 'zygosity' } },
  { kind: 'Data types', label: 'Which IGHV1-69 alleles are seen by genomic and which by AIRR-seq data?', route: '/dash_refbook',
    queryParams: { sources: 'genomic,airrseq', segment: 'V', genes: 'IGHV1-69', panel: 'overview' } },
  { kind: 'Gene usage QTL', label: 'Which variants change how much IGHV1-69 is used?', route: '/dash_qtl',
    queryParams: { view: 'gene', species: 'Human', locus: 'IGH', asc: 'IGHV1-69' } },
];

export const ENTRY_CARDS: { title: string, text: string, icon: string, source: 'airrseq' | 'genomic' | 'brand', main: LinkItem, links: LinkItem[] }[] = [
  { title: 'AIRR-Seq Data', icon: 'insert_chart', source: 'airrseq',
    text: 'Genotypes and haplotypes inferred from repertoires, with downloadable annotations.',
    main: { label: 'Explore AIRR-Seq Data', route: '/datarep' },
    links: [{ label: 'Samples', route: '/samplerep/null' }, { label: 'Germline genes', route: '/generep' }, { label: 'Downloads', route: '/downloads' }] },
  { title: 'Genomic Data', icon: 'fingerprint', source: 'genomic',
    text: 'Alleles from long-read sequencing of the germline loci.',
    main: { label: 'Explore Genomic Data', route: '/datagen' },
    links: [{ label: 'Samples', route: '/genesample/null' }, { label: 'Genes', route: '/genetable' }, { label: 'Gene browser', route: '/genebrowser/Human/IGH' }] },
  { title: 'Dashboards', icon: 'dashboard', source: 'brand',
    text: 'Interactive views of alleles and gene-usage QTL.',
    main: { label: 'Allele Reference', route: '/dash_refbook' },
    links: [{ label: 'Gene Usage QTL', route: '/dash_qtl' }, { label: 'Reports', route: '/reports' }] },
];

export const CITATION = {
  title: 'The current landscape of adaptive immune receptor genomic and repertoire data: OGRDB and VDJbase.',
  authors: 'Lees WD, Peres A, Klein V, Amos N, Jana U, Engelbrecht E, Vanwinkle Z, Malach Y, Konstantinovsky T, Polak P, Watson CT, Yaari G.',
  journal: 'Nucleic Acids Research 54(D1):D932-D937, 2025.',
  doi: 'https://doi.org/10.1093/nar/gkaf1094',
};

// D6: contribute links go to the collaboration post for now
export const CONTRIBUTE: (LinkItem & { text: string, icon: string })[] = [
  { label: 'Submit AIRR-seq projects', icon: 'cloud_upload', text: 'Share repertoire studies for genotype and haplotype inference.',
    href: 'https://wordpress.vdjbase.org/index.php/vdjbase_news/collaboration-opportunities/' },
  { label: 'Submit genomic data', icon: 'cloud_upload', text: 'Add annotated loci from long-read sequencing.',
    href: 'https://wordpress.vdjbase.org/index.php/vdjbase_news/collaboration-opportunities/' },
  { label: 'Submit novel alleles to OGRDB', icon: 'verified_user', text: 'Germline sequences go through OGRDB review.',
    href: 'https://ogrdb.airr-community.org/' },
];
