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
import * as d3 from 'd3'; // FIXME
import * as moment from 'moment';
import { ElevationChartData, ElevationCoords } from './elevation-chart-data';
import { Outing } from '../outing';

@Component({
  selector: 'app-elevation-chart',
  templateUrl: './elevation-chart.component.html',
  styleUrls: ['./elevation-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElevationChartComponent implements OnInit, OnChanges {
  private static readonly referenceYear = 2017;

  @ViewChild('elevationChart') private chartContainer: ElementRef;
  @Input() outings: Outing[];
  private data: ElevationChartData[] = [];
  private chart: d3.Selection<SVGGElement, ElevationChartData, HTMLElement, any>;
  private xScale: d3.ScaleTime<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private yAxis: d3.Axis<number | { valueOf(): number }>;
  private colorScale = d3.scaleOrdinal<number, string>(d3.schemeCategory10);
  private height = 400;
  private width = 500;

  constructor() {}

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
          date: moment(),
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
    const element: any = this.chartContainer.nativeElement;
    const svg = d3
      .select<HTMLDivElement, ElevationChartData>(element)
      .append('svg')
      .attr('width', this.width + 70)
      .attr('height', this.height + 60);

    this.chart = svg
      .append<SVGGElement>('g')
      .attr('transform', 'translate(40,40)');

    this.xScale = d3
      .scaleTime()
      .domain([
        new Date(ElevationChartComponent.referenceYear, 0, 1),
        new Date(ElevationChartComponent.referenceYear, 11, 31),
      ])
      .rangeRound([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    this.yAxis = d3.axisLeft(this.yScale);

    this.chart.append('g').attr('class', 'y axis').call(this.yAxis);
    this.chart
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat('%B')))
      .selectAll('.tick text')
      .style('text-anchor', 'start')
      .attr('x', 6)
      .attr('y', 6);

    this.chart.append('g').attr('class', 'lines');
  }

  private updateChart() {
    const flatten = (acc: number[], val: number[] | number): number[] =>
      acc.concat(Array.isArray(val) ? val.reduce(flatten, []) : val);
    const ranges = this.data.map(row =>
      row.values
        .map(value => value.elevation)
        .reduce((a, b) => Math.max(a, b), 0)
    );
    this.yScale.domain([0, Math.max(...ranges)]);
    this.chart.selectAll('.y.axis').call(this.yAxis);

    const wrap = this.chart.selectAll('g.lines').data([this.data]);

    const lines = wrap
      .selectAll<SVGPathElement, ElevationChartData>('.line')
      .data<ElevationChartData>(d => d, d => d.year.toString());
    const line = d3
      .line<ElevationCoords>()
      .x(d => this.xScale(d.date.toDate()))
      .y(d => this.yScale(d.elevation));
    lines
      .enter()
      .append('path')
      .attr('class', 'line')
      .attr('data-year', d => d.year)
      .attr('fill', 'none')
      .attr('stroke', d => this.colorScale(d.year))
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .merge(lines)
      .attr('d', d => line(d.values));
    lines.exit().remove();
  }
}
