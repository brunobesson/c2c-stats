import * as moment from 'Moment';

export class ElevationCoords {
  date: moment.Moment;
  elevation: number;
}

export class ElevationChartData {
  year: number;
  values: ElevationCoords[];
}
