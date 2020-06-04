export interface RepSequence {
  sequences: [{
    name: string;
    seq: string;
    seq_len: number;
    similar: string;
    appears: number;
    is_single_allele: boolean;
    low_confidence: boolean;
    novel: boolean;
    max_kdiff: number;
  }];
  total_items: number;
  page_size: number;
  pages: number;
}
