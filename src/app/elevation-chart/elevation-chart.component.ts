import { Component, OnChanges, OnInit, Input, ViewChild, ElementRef, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import * as d3 from 'd3';
import { ElevationChartData, ElevationCoords } from './elevation-chart-data';
import { Outing } from '../outing';
import { Area } from '../area';
import * as moment from 'moment';

@Component({
  selector: 'app-elevation-chart',
  templateUrl: './elevation-chart.component.html',
  styleUrls: ['./elevation-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElevationChartComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() outings: Outing[];
  private data: ElevationChartData[] = [{
    year: 1,
    values: [
      {
        date: new Date(),
        elevation: 2
      },
      {
        date: new Date(),
        elevation: 5
      }
    ]
  }];
  private chart: any;
  private xScale: any;
  private yScale: any;
  private yAxis: any;
  private colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  private height = 400;
  private width = 400;

  constructor() { }

  ngOnInit() {
    this.createChart();
    if (this.outings) {
      this.outingsToData();
      this.updateChart();
    }
  }

  ngOnChanges(changes: {[key: string]: SimpleChange}) {
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
      return;
    }

    const outingsForYear = this.outings.filter(outing => outing.height_diff_up)
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
        const date = parseTime(outing.date_start);
        const elevation = outing.height_diff_up;
        values.push({
          date,
          elevation
        });
      });
      values =
      values.sort((v1, v2) => v1.date.getTime() - v2.date.getTime())
            .reduce((acc: ElevationCoords[], val: ElevationCoords) => {
              acc.push({
                date: val.date,
                elevation: acc[acc.length - 1].elevation + val.elevation
              });
              return acc;
            }, [{
              date: moment('1970-01-01').toDate(), // FIXME
              elevation: 0
            }]);

      lines.set(year, values);
    });
    this.data = [];
    lines.forEach((values, year) => {
      this.data.push({
        year,
        values
      });
    });
  }

  private createChart() {
    const element = this.chartContainer.nativeElement;
    const svg = d3.select(element).append('svg')
      .attr('width', this.width + 60)
      .attr('height', this.height + 60);

    this.chart = svg.append('g')
      .attr('transform', 'translate(40,40)');

    this.xScale = d3.scaleLinear().domain([0, 366]).rangeRound([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    this.yAxis = d3.axisLeft(this.yScale);

    this.chart.append('g')
              .attr('class', 'y axis')
              .call(this.yAxis);
    this.chart.append('g')
              .attr('class', 'x axis')
              .attr('transform', `translate(0,${this.height})`)
              .call(d3.axisBottom(this.xScale));
  }

  private updateChart() {
    const flatten = (acc: number[], val: number[] | number) => acc.concat(
      Array.isArray(val) ? val.reduce(flatten, []) : val
    );
    const ranges = this.data.map(line => line.values.map(value => value.elevation)
                                                    .reduce((a, b) => Math.max(a, b), 0));
    this.yScale.domain([0, Math.max(...ranges)]);
    this.chart.selectAll('.y.axis').call(this.yAxis);
    console.log(this.yScale.domain());

    const lines = this.chart.selectAll('.line').data(this.data);

    const line = d3.line<ElevationCoords>()
      .x(d => this.xScale(moment(d.date).dayOfYear()))
      .y(d => this.yScale(d.elevation));
    lines.enter().append('path')
      .attr('class', 'line')
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
