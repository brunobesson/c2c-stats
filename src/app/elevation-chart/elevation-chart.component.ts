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
import * as d3 from 'd3';
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
  private chart: d3.Selection<
    SVGGElement,
    ElevationChartData,
    HTMLElement,
    any
  >;
  private xScale: d3.ScaleTime<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private yAxis: d3.Axis<number | { valueOf(): number }>;
  private colorScale = d3.scaleOrdinal<number, string>(d3.schemeCategory10);
  private height = 400;
  private width = 800;

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

    const outingsForYear = this.outings
      .filter(outing => outing.height_diff_up)
      .reduce((acc: Map<number, Outing[]>, outing: Outing) => {
        // FIXME handle year overlap on multiday outing > interpolate
        const year = Number(outing.date_start.substr(0, 4));
        if (!acc.has(year)) {
          acc.set(year, []);
        }
        acc.get(year).push(outing);
        return acc;
      }, new Map<number, Outing[]>());
    const parseTime = d3.timeParse('%Y-%m-%d');
    const lines = new Map<number, Array<ElevationCoords>>();
    outingsForYear.forEach((outings, year) => {
      let values: Array<ElevationCoords> = [];
      outings.forEach(outing => {
        // FIXME handle multi day
        const dateStart = parseTime(outing.date_start);
        const dateEnd = parseTime(outing.date_end);
        dateStart.setFullYear(ElevationChartComponent.referenceYear);
        dateEnd.setFullYear(ElevationChartComponent.referenceYear);
        const elevation = outing.height_diff_up;
        values.push({
          date: dateStart,
          elevation,
        });
      });
      values = outings
        .sort(
          (o1, v2) =>
            parseTime(o1.date_start).getTime() -
            parseTime(v2.date_start).getTime()
        )
        .reduce(
          (acc: ElevationCoords[], outing: Outing) => {
            const dateStart = parseTime(outing.date_start);
            const dateEnd = parseTime(outing.date_end);
            dateStart.setFullYear(ElevationChartComponent.referenceYear);
            dateEnd.setFullYear(ElevationChartComponent.referenceYear);
            const elevation = outing.height_diff_up;
            acc.push({
              date: dateStart,
              elevation: acc[acc.length - 1].elevation,
            });
            acc.push({
              date: dateEnd,
              elevation: acc[acc.length - 1].elevation + elevation,
            });
            return acc;
          },
          [
            {
              date: parseTime(ElevationChartComponent.referenceYear + '-01-01'),
              elevation: 0,
            },
          ]
        );

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
      .attr('width', this.width + 60)
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
    const ranges = this.data.map(line =>
      line.values
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
      .x(d => this.xScale(d.date))
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