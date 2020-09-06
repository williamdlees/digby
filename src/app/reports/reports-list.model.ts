export interface ReportList {
  name: string;
  title: string;
  description: string;
  thumbnail: string;
  params: {
    [index: string]: string
  };
  filter_params: boolean;
  scope: string[];
  format: string[];
}

export interface GlobalReportFilterParams {
  combined: {
    [index: string]: string
  };
  gen: {
    [index: string]: string
  };
  rep: {
    [index: string]: string
  };
}
