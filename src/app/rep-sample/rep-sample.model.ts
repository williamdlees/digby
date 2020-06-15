export interface RepSample {
    name: string;
    row_reads: number;
    genotype: string;
    genotype_graph: string;
    date: string;
    samples_group: number;
    tissue: string;
    combined_cell_type: string;
    sequencing_length: string;
    umi: boolean;
    status: string;
}

export interface RepChoice {
    name: string[];
    row_reads: number[];
    genotype: string[];
    genotype_graph: string[];
    date: string[];
    samples_group: number[];
    tissue: string[];
    combined_cell_type: string[];
    sequencing_length: string[];
    umi: boolean[];
    status: string[];
}

