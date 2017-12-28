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
    const isFullYear = this.isFullYear();
    const firstOutingMoment = this.outings
      .map(outing => moment(outing.date_start))
      .sort((a, b) => a.valueOf() - b.valueOf())[0];
    // ensure at least 8 years to avoid empty graphs
    if (moment().year() - firstOutingMoment.year() < 8) {
      firstOutingMoment.year(moment().year() - 8);
    }
    const firstYear = isFullYear ?
      firstOutingMoment.year() :
      (firstOutingMoment.month() > 8 ? firstOutingMoment.year() : firstOutingMoment.year() - 1);
    const lastYear = isFullYear ? moment().year() : (moment().month() > 8 ? moment().year() : moment().year() - 1);
    const outingsPerSeason = new Map<string, number>();
    for (let y = firstYear; y <= lastYear; y++) {
      outingsPerSeason.set(isFullYear ? y.toString() : `${y.toString()}/${(y + 1).toString()}`, 0);
    }
    this.outings
      .filter(outing => outing.activities.includes(this.activity))
      .reduce((map, outing) => {
        const season = this.season(outing.date_start);
        map.set(season, map.get(season) + 1);
        return map;
      }, outingsPerSeason);
    this.data = [];
    outingsPerSeason.forEach((count, season) => {
      this.data.push({
        name: season,
        value: count
      });
    });
  }

  private isFullYear() {
    switch (this.activity) {
      case 'skitouring':
      case 'ice_climbing':
      case 'snowshoeing':
        return false;
      default:
        return true;
    }
  }

  private season(date: string) {
    const m = moment(date);
    switch (this.activity) {
      case 'skitouring':
      case 'ice_climbing':
      case 'snowshoeing':
        return m.month() > 8 ? `${m.year()}/${m.year() + 1}` : `${m.year() - 1}/${m.year()}`;
      default:
        return m.year().toString();
    }
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
