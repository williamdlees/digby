export interface GenSample {
  id: string;
  identifier: string;
  name_in_study: string;
  age: number;
  sex: string;
  annotation_path: string;
  annotation_method: string;
  annotation_format: string;
  annotation_reference: string;

  study_name: string;
  study_date: string;
  institute: string;
  study_description: string;
  researcher: string;
  reference: string;
  contact: string;

  dataset: string;
}
