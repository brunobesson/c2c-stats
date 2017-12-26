import {
  Component,
  OnChanges,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  SimpleChange,
  ChangeDetectionStrategy,
} from '@angular/core';
import {axisBottom, axisLeft, Axis } from 'd3-axis';
import { scaleLinear, scaleOrdinal, scaleTime, schemeCategory10, ScaleLinear, ScaleTime } from 'd3-scale';
import { select, Selection } from 'd3-selection';
import { line, Line } from 'd3-shape';
import { timeFormat } from 'd3-time-format';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import { ElevationChartData, ElevationCoords } from './elevation-chart-data';
import { Outing } from '../outing';

@Component({
  selector: 'app-elevation-chart',
  templateUrl: './elevation-chart.component.html',
  styleUrls: ['./elevation-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElevationChartComponent implements OnInit, OnChanges {
  private static readonly referenceYear = 2016; // a bissectile one!

  @Input() outings: Outing[];

  private el: HTMLDivElement;
  private data: ElevationChartData[] = [];

  private chart: Selection<SVGGElement, ElevationChartData, HTMLElement, any>;
  private xScale: ScaleTime<number, number>;
  private yScale: ScaleLinear<number, number>;
  private yAxis: Axis<number | { valueOf(): number }>;
  private lineGenerator: Line<ElevationCoords>;
  private colorScale = scaleOrdinal<number, string>(schemeCategory10);
  private height = 400;
  private width = 500;
  private yAxisWidth = 50;
  private xAxisHeight = 20;

  constructor(elementRef: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(250)
      .subscribe(() => this.resizeChart());
    this.el = elementRef.nativeElement as HTMLDivElement;
  }

  ngOnInit() {
    this.createChart();
    if (this.outings) {
      this.outingsToData();
      this.updateChart();
    }
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
    if (!this.outings.length) {
      this.data = [];
    }

    const dateFormat = 'YYYY-MM-DD';

    // first, add per year (TODO and later maybe per season)
    const outingsForYear = this.outings
      .filter(outing => outing.height_diff_up)
      .reduce((acc: Map<number, Outing[]>, outing: Outing) => {
        const startYear = Number(outing.date_start.substr(0, 4));
        const endYear = Number(outing.date_end.substr(0, 4));

        // init arrays if needed
        if (!acc.has(startYear)) {
          acc.set(startYear, []);
        }
        if (startYear !== endYear && !acc.has(endYear)) {
          acc.set(endYear, []);
        }

        // store outing(s) to matching year
        if (startYear === endYear) {
          acc.get(startYear).push(outing);
        } else {
          // we need to split the outing in 2
          // (assume this will never be more than on year long)
          const outing1 = JSON.parse(JSON.stringify(outing)) as Outing;
          const outing2 = JSON.parse(JSON.stringify(outing)) as Outing;

          const startDate = moment(outing.date_start, dateFormat);
          const endDate = moment(outing.date_end, dateFormat);
          const endDate1 = moment(`${startYear}-12-31`, dateFormat);
          const startDate2 = moment(`${endYear}-01-01`, dateFormat);
          const ratio = (startDate.diff(endDate1, 'days') + 1) / (startDate.diff(endDate, 'days') + 1);

          outing1.date_end = endDate1.format(dateFormat);
          outing1.height_diff_up = ratio * outing.height_diff_up;
          outing2.date_start = startDate2.format(dateFormat);
          outing2.height_diff_up = (1 - ratio) * outing.height_diff_up;

          acc.get(startYear).push(outing1);
          acc.get(endYear).push(outing2);
        }
        return acc;
      }, new Map<number, Outing[]>());

    // compute line for each year
    const lines = new Map<number, Array<ElevationCoords>>();
    outingsForYear.forEach((outings, year) => {
      let values: Array<ElevationCoords> = [];

      values = outings
        .sort((o1, o2) => moment(o1.date_start, dateFormat).diff(moment(o2.date_start, dateFormat)))
        .reduce((acc: ElevationCoords[], outing: Outing) => {
            const dateStart = moment(outing.date_start, dateFormat);
            const dateEnd = moment(outing.date_end, dateFormat);
            dateStart.year(ElevationChartComponent.referenceYear);
            dateEnd.year(ElevationChartComponent.referenceYear);
            const elevation = outing.height_diff_up;
            acc.push({
              date: dateStart,
              elevation: acc[acc.length - 1].elevation,
            });
            acc.push({
              date: dateStart,
              elevation: acc[acc.length - 1].elevation + elevation,
            });
            return acc;
          },
          [
            {
              date: moment(ElevationChartComponent.referenceYear + '-01-01', dateFormat),
              elevation: 0,
            },
          ]
        );

      // add final point, except for current year, where the last point is today
      const currentYear = new Date().getFullYear();
      if (year === currentYear) {
        values.push({
          date: moment().year(ElevationChartComponent.referenceYear),
          elevation: values[values.length - 1].elevation,
        });
      } else {
        values.push({
          date: moment(ElevationChartComponent.referenceYear + '-12-31', dateFormat),
          elevation: values[values.length - 1].elevation,
        });
      }

      lines.set(year, values);
    });
    this.data = [];
    lines.forEach((values, year) => {
      this.data.push({
        year,
        values,
      });
    });
  }

  private createChart() {
    const chartContainer = select<HTMLElement, any>(this.el).select<HTMLDivElement>('.elevation-chart-container');
    this.width = chartContainer.node() ? chartContainer.node().getBoundingClientRect().width - this.yAxisWidth : 0;
    if (this.width === 0) {
      return;
    }
    const svg = chartContainer
      .append('svg')
      .attr('width', this.width + this.yAxisWidth)
      .attr('height', this.height + this.xAxisHeight);

    this.chart = svg
      .append<SVGGElement>('g')
      .attr('transform', `translate(${this.yAxisWidth - 5},0)`);

    this.xScale = scaleTime()
      .domain([
        new Date(ElevationChartComponent.referenceYear, 0, 1),
        new Date(ElevationChartComponent.referenceYear, 11, 31),
      ])
      .rangeRound([0, this.width]);
    this.yScale = scaleLinear().range([this.height, 0]);
    this.yAxis = axisLeft(this.yScale);

    this.chart.append('g').attr('class', 'y axis').call(this.yAxis);
    this.chart
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(axisBottom(this.xScale).tickFormat(timeFormat('%B')))
      .selectAll('.tick text')
      .style('text-anchor', 'start')
      .attr('x', 6)
      .attr('y', 6);

    this.chart.append('g').attr('class', 'lines');
  }

  private updateChart() {
    const flatten = (acc: number[], val: number[] | number): number[] =>
      acc.concat(Array.isArray(val) ? val.reduce(flatten, []) : val);
    const ranges = this.data.map(r =>
      r.values
        .map(value => value.elevation)
        .reduce((a, b) => Math.max(a, b), 0)
    );
    this.yScale.domain([0, Math.max(...ranges)]);
    this.chart.selectAll('.y.axis').call(this.yAxis);

    const wrap = this.chart.selectAll('g.lines').data([this.data]);

    const rows = wrap
      .selectAll<SVGPathElement, ElevationChartData>('.line')
      .data<ElevationChartData>(d => d, d => d.year.toString());
    this.lineGenerator = line<ElevationCoords>()
      .x(d => this.xScale(d.date.toDate()))
      .y(d => this.yScale(d.elevation));
    rows
      .enter()
      .append('path')
      .attr('class', 'line')
      .attr('data-year', d => d.year)
      .attr('fill', 'none')
      .attr('stroke', d => this.colorScale(d.year))
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .merge(rows)
      .attr('d', d => this.lineGenerator(d.values));
    rows.exit().remove();
  }

  private resizeChart() {
    const chartContainer = select<HTMLElement, any>(this.el).select<HTMLDivElement>('.elevation-chart-container');
    this.width = chartContainer.node() ? chartContainer.node().getBoundingClientRect().width - this.yAxisWidth : 0;

    chartContainer.select<SVGElement>('svg').attr('width', this.width + this.yAxisWidth);
    this.xScale.rangeRound([0, this.width]);
    this.chart.select('g.x.axis').call(axisBottom(this.xScale).tickFormat(timeFormat('%B')));
    this.lineGenerator.x(d => this.xScale(d.date.toDate()));
    this.chart.selectAll<SVGPathElement, ElevationChartData>('.line').attr('d', d => this.lineGenerator(d.values));
  }
}
