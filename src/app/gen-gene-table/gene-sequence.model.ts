export interface GeneSequence {
  sequences: [{
    name: string;
    imgt_name: string;
    type: string;
    novel: boolean;
    deleted: boolean;
    functional: string;
    sequence: string;
    sequence_full: string;
    gapped_sequence: string;
    gapped_sequence_full: string;
  }];
  total_items: number;
  page_size: number;
  pages: number;
}
