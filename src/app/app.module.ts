import { Configuration, ConfigurationParameters } from 'projects/digby-swagger-client';
import { environment } from '../environments/environment';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';


PlotlyModule.plotlyjs = PlotlyJS;

export function apiConfigFactory(): Configuration  {
  const params: ConfigurationParameters = {
    // set configuration parameters here.
    basePath: environment.apiBasePath,
  };

  return new Configuration(params);
}

