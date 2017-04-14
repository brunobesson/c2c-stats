import { Component, OnChanges, OnInit, Input, ViewChild, ElementRef, SimpleChange } from '@angular/core';
import { PieChartData } from './pie-chart-data';
import * as d3 from 'd3';

@Component({
  selector: 'pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() data: PieChartData;
  private chart: any;
  private xScale: any;
  private yScale: any;
  private height: number = 400;
  private width: number = 400;

  constructor() { }

  ngOnInit() {
    this.createChart();
    if (this.data) {
      this.updateChart();
    }
  }

  ngOnChanges(changes:{[key: string]: SimpleChange}) {
    if (changes['data'].isFirstChange()) {
      return;
    }
    if (this.data) {
      this.updateChart();
    }
  }

  createChart() {
    const element = this.chartContainer.nativeElement;
    const svg = d3.select(element).append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.chart = svg.append('g')
      .attr('class', 'bars');

    this.xScale = d3.scaleBand().padding(0.1).domain(this.data.data.map(d => d[0].toString())).rangeRound([0, this.height]);
    this.yScale = d3.scaleLinear().domain([0, d3.max(this.data.data, d => Number(d[1]))]).range([this.width, 0]);
  }

  updateChart() {
    const bars = this.chart.selectAll('.bar')
      .data(this.data.data);

    // update scales & axis
    this.xScale.domain(this.data.data.map(d => d[0]));
    this.yScale.domain([0, d3.max(this.data.data, d => Number(d[1]))]);

    bars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .style('fill', 'red')

      .merge(bars)
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(d[1]));

    bars.exit().remove();
  }
}
