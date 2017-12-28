import { Component, OnChanges, Input, Output, EventEmitter, ElementRef, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import { select as d3select } from 'd3-selection';
import { BarChartDataItem } from './bar-chart-data-item';
import * as barChart from 'britecharts/dist/umd/bar.min';
import * as miniTooltip from 'britecharts/dist/umd/miniTooltip.min';
import { Outing, Activity } from '../outing';
import { ratingsValues } from '../shared/ratings';

type Property = 'rock_free_rating' | 'ski_rating' | 'global_rating' | 'ice_rating' | 'via_ferrata_rating' |
  'hiking_rating' | 'snowshoe_rating' | 'mtb_up_rating'| 'mtb_down_rating';

/**
 * Inspired from https://github.com/colapdev/ngx-britecharts
 */
@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnChanges {

  @Input() outings: Outing[];
  @Input() property: Property;
  @Input() activity?: Activity;
  @Output() ready: EventEmitter<boolean> = new EventEmitter<boolean>();

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
    const orderedValues = ratingsValues[this.property] as string[];
    let propertyMap = new Map<string, number>();
    orderedValues.forEach(value => propertyMap.set(value, 0));
    propertyMap = this.outings
      .filter(outing => this.activity == null || outing.activities.includes(this.activity))
      .filter(outing => outing[this.property] !== undefined && outing[this.property] !== null)
      .map(outing => outing[this.property] as string)
      .reduce((map, value) => {
        if (map.has(value)) {
          map.set(value, map.get(value) + 1);
        } else {
          map.set(value, 1);
        }
        return map;
      }, propertyMap);

    // fill map with missing values
    this.data = [];
    propertyMap.forEach((value, name) => this.data.push({ name, value }));
    this.data.sort((a, b) => orderedValues.indexOf(b.name) - orderedValues.indexOf(a.name));
  }

  private drawChart() {
    const bar = barChart();
    const tooltip = miniTooltip();

    const barContainer = d3select<HTMLElement, any>(this.el).select<HTMLDivElement>('.bar-chart-container');
    const containerWidth = barContainer.node() ? barContainer.node().getBoundingClientRect().width : false;

    if (containerWidth) {
      const margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
      };
      bar.margin(margin);
      bar.width(containerWidth);
      // ensure an height based on the number of bars -- all bars same height
      bar.height(margin.top + margin.bottom + this.data.length * 20);
      bar.isHorizontal(true);

      bar.on('customMouseOver', tooltip.show);
      bar.on('customMouseMove', tooltip.update);
      bar.on('customMouseOut', tooltip.hide);

      barContainer.datum(this.data).call(bar);

      const tooltipContainer = d3select(this.el).select('.bar-chart-container .metadata-group');
      tooltipContainer.datum(this.data).call(tooltip);

      this.ready.emit(true);
    }
  }

  public redrawChart() {
    d3select(this.el).selectAll('.bar-chart').remove();
    this.drawChart();
  }
}
