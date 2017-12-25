import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';
import Chart from 'frappe-charts/dist/frappe-charts.min.esm';
import { Outing } from '../outing';
import { ActivitiesLineChartData } from './activities-line-chart-data';

@Component({
  selector: 'app-activities-line-chart',
  templateUrl: './activities-line-chart.component.html',
  styleUrls: ['./activities-line-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesLineChartComponent implements OnInit, OnChanges {

  @Input() outings: Outing[];
  @Input() id: string;
  private data: ActivitiesLineChartData;

  constructor(private el: ElementRef) { }

  ngOnInit() {
  }

  ngOnChanges(changes: { [key: string]: SimpleChange }) {
    if (changes['outings'].isFirstChange()) {
      return;
    }
    if (this.outings) {
      this.outingsToData();
      this.updateChart();
    }
  }

  private outingsToData() {
    const activityCountMap = this.outings
      .map(o => o.activities)
      .reduce((map, activities) => {
        activities.forEach(activity => {
          if (map.has(activity)) {
            map.set(activity, map.get(activity) + 1);
          } else {
            map.set(activity, 1);
          }
        });
        return map;
      }, new Map<string, number>());
    const labels: string[] = [];
    const dataSet: number[] = [];
    const activityCount: ActivityCountArray[] = [];
    activityCountMap.forEach((value, key) => {
      activityCount.push({
        activity: key,
        count: value
      });
    });
    activityCount.sort((e1, e2) => e2.count - e1.count);
    this.data = {
      labels: activityCount.map(e => e.activity),
      datasets: [{
        title: 'Activities',
        values: activityCount.map(e => e.count)
      }]
    };
  }

  private updateChart() {
    const chart = new Chart({
      parent: this.el.nativeElement,
      title: 'Activities',
      data: this.data,
      type: 'percentage',
      heigt: 100,
    });
  }
}

interface ActivityCountArray {
  activity: string;
  count: number;
}