export interface GenSample {
  id: string;
  sample_identifier: string;
  name_in_study: string;
  mother_in_study: string;
  father_in_study: string;
  age: number;
  sex: string;
  annotation_path: string;
  annotation_method: string;
  annotation_format: string;
  annotation_reference: string;
  self_ethnicity: string;
  grouped_ethnicity: string;
  population: string;
  population_abbr: string;
  super_population: string;
  locus_coverage: number;
  sequencing_platform: string;
  assembly_method: string;
  DNA_source: string;

  study_name: string;
  study_date: string;
  institute: string;
  study_description: string;
  researcher: string;
  reference: string;
  contact: string;

  dataset: string;
}
