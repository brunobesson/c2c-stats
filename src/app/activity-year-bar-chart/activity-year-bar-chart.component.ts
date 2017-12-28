import { Component, OnChanges, Input, ElementRef, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import { select as d3select } from 'd3-selection';
import * as barChart from 'britecharts/dist/umd/bar.min';
import * as miniTooltip from 'britecharts/dist/umd/miniTooltip.min';
import * as moment from 'moment';
import { Activity, Outing } from '../outing';
import { BarChartDataItem } from '../bar-chart/bar-chart-data-item';

@Component({
  selector: 'app-activity-year-bar-chart',
  templateUrl: './activity-year-bar-chart.component.html',
  styleUrls: ['./activity-year-bar-chart.component.css']
})
export class ActivityYearBarChartComponent implements OnChanges {

  @Input() outings: Outing[];
  @Input() activity?: Activity;

  private data: BarChartDataItem[];

  private el: HTMLElement;

  constructor(elementRef: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(250)
      .subscribe(() => this.redrawChart());
    this.el = elementRef.nativeElement;
  }

  ngOnChanges(changes: { [key: string]: SimpleChange }) {
    if (this.outings) {
      this.outingsToData();
      this.drawChart();
    }
  }

  private outingsToData() {
    // TODO handle seasons depending on activity
    const firstYear = this.outings
      .map(outing => moment(outing.date_start).year())
      .sort()[0];
    const lastYear = moment().year();
    const outingsPerYear = new Map<string, number>();
    for (let y = firstYear; y <= lastYear; y++) {
      outingsPerYear.set(y.toString(), 0);
    }
    this.outings
      .filter(outing => outing.activities.includes(this.activity))
      .reduce((map, outing) => {
        const year = moment(outing.date_start).year().toString();
        map.set(year, map.get(year) + 1);
        return map;
      }, outingsPerYear);
    this.data = [];
    outingsPerYear.forEach((count, year) => {
      this.data.push({
        name: year,
        value: count
      });
    });
  }

  private drawChart() {
    const bar = barChart();
    const tooltip = miniTooltip();

    const barContainer = d3select<HTMLElement, any>(this.el)
      .select<HTMLDivElement>('.activity-year-bar-chart-container');
    const containerWidth = barContainer.node() ? barContainer.node().getBoundingClientRect().width : false;

    if (containerWidth) {
      const margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
      };
      bar.margin(margin);
      // TODO ensure a width based on the number of bars -- all bars same height
      bar.width(containerWidth);
      bar.height(400);

      bar.on('customMouseOver', tooltip.show);
      bar.on('customMouseMove', tooltip.update);
      bar.on('customMouseOut', tooltip.hide);

      barContainer.datum(this.data).call(bar);

      const tooltipContainer = d3select(this.el).select('.activity-year-bar-chart-container .metadata-group');
      tooltipContainer.datum(this.data).call(tooltip);
    }
  }

  public redrawChart() {
    d3select(this.el).selectAll('.bar-chart').remove();
    this.drawChart();
  }
}
