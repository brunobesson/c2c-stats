import { Injectable } from '@angular/core';
import { PieChartData } from './pie-chart/pie-chart-data';

@Injectable()
export class C2cDataService {
  DATA: PieChartData[] = [
    {
      id: 1,
      name: 'test1',
      data: [
        ['a', 1],
        ['b', 3],
        ['c', 5]
      ]
    },
    {
      id: 2,
      name: 'test2',
      data: [
        ['c', 1],
        ['d', 5],
        ['e', 5]
      ]
    }
  ];

  getData(): Promise<PieChartData[]> {
    return Promise.resolve(this.DATA);
  }
}