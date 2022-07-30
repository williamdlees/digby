export interface GeneSequence {
  sequences: [{
    name: string;
    imgt_name: string;
    type: string;
    novel: boolean;
    deleted: boolean;
    functional: string;
    notes: string,
    sequence: string;
    gapped_sequence: string;
    appearances: string;
    subject_id: string;
    dataset: string;
    gene_name: string;
  }];
  total_items: number;
  page_size: number;
  pages: number;
}
