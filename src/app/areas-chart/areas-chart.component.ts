import {
  Component,
  OnChanges,
  Input,
  ElementRef,
  SimpleChange,
  ChangeDetectionStrategy
} from '@angular/core';
import { select } from 'd3-selection';
import { Observable } from 'rxjs/Observable';
import * as barChart from 'britecharts/dist/umd/bar.min';
import * as miniTooltip from 'britecharts/dist/umd/miniTooltip.min';
import { AreasChartData } from './areas-chart-data';
import { Outing } from '../outing';
import { Locale } from '../locale';

@Component({
  selector: 'app-areas-chart',
  templateUrl: './areas-chart.component.html',
  styleUrls: ['./areas-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreasChartComponent implements OnChanges {

  @Input() outings: Outing[];
  private data: AreasChartData[] = [];
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

  private inc(data: AreasChartData[], key: string): void {
    let index = data.findIndex(element => element.name === key);
    if (index === -1) {
      data.push({
        name: key,
        value: 0
      });
      index = data.length - 1;
    }
    data[index].value += 1;
  }

  private bestName(locales: Locale[]): string {
    return locales[0].title; // TODO choose best language
  }

  private outingsToData() {
    if (!this.outings.length) {
      this.data = [];
    }

    this.data = [];
    this.outings.filter(outing => outing.areas)
      .reduce((acc: AreasChartData[], outing: Outing) => {
        if (outing.areas) {
          const areas = outing.areas.filter(area => area.area_type === 'range');
          if (areas) {
            areas.forEach(area => this.inc(acc, this.bestName(area.locales)));
          } else {
            this.inc(acc, 'Others');
          }
        } else {
          this.inc(acc, 'Others');
        }
        return acc;
      }, new Array<AreasChartData>())
      .reduce((acc: Map<string, number>, slide: AreasChartData) => {
        if (slide.name === 'Others' || slide.value / this.outings.length < 0.02) {
          acc.set('Others', (acc.get('Others') || 0) + slide.value);
        } else {
          acc.set(slide.name, slide.value);
        }
        return acc;
      }, new Map<string, number>())
      .forEach((value, key) => this.data.push({
        name: key,
        value
      }));
      this.data.sort((a, b) => {
        if (a.name === 'Others') {
          return -1;
        }
        if (b.name === 'Others') {
          return 1;
        }
        return a.value - b.value;
      });
  }

  private drawChart() {
    const bar = barChart();
    const tooltip = miniTooltip();

    const barContainer = select<HTMLElement, any>(this.el).select<HTMLDivElement>('.areas-chart-container');
    const containerWidth = barContainer.node() ? barContainer.node().getBoundingClientRect().width : false;

    if (containerWidth) {
      const margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 200
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

      const tooltipContainer = select(this.el).select('.areas-chart-container .metadata-group');
      tooltipContainer.datum(this.data).call(tooltip);
    }
  }

  private redrawChart() {
    select(this.el).selectAll('.bar-chart').remove();
    this.drawChart();
  }
}
