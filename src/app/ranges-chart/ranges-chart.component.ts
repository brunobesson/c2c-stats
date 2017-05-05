import { Component, OnChanges, OnInit, Input, ViewChild, ElementRef, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import * as d3 from 'd3';
import { RangesChartData } from './ranges-chart-data';
import { Outing } from '../outing';
import { Area } from '../area';

@Component({
  selector: 'app-ranges-chart',
  templateUrl: './ranges-chart.component.html',
  styleUrls: ['./ranges-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangesChartComponent implements OnInit, OnChanges {
  private static readonly minBlockPercent = 0.01;

  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() outings: Outing[];
  private data: RangesChartData = {
    id: 1,
    name: 'toto',
    data: [
      ['a', 1],
      ['b', 2],
      ['c', 3]
    ]
  };
  private chart: any;
  private xScale: any;
  private yScale: any;
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
    const flatten = (acc: Area[], val: Area[] | Area): Array<Area> => acc.concat(
        Array.isArray(val) ? val.reduce(flatten, []) : val
      );
    const countInMap = (acc: Map<string, number>, val: string) => {
      if (acc.has(val)) {
        acc.set(val, acc.get(val) + 1);
      } else {
        acc.set(val, 1);
      }
      return acc;
    };
    const other: Area = {
      document_id: 0,
      area_type: 'range',
      locales: [{
        lang: 'fr',
        title: 'Autres'
      }]
    };
    const areasMap: Map<string, number> = this.outings.map(outing => outing.areas)
                              // keep only ranges, or put into 'others'
                              .map(areas => {
                                const ranges = areas.filter(area => area.area_type === 'range');
                                return ranges.length ? ranges : [other];
                              })
                              .reduce(flatten, [])
                              // FIXME keep only title
                              .map(area => <string> area.locales.find(locale => locale.lang === 'fr').title)
                              // create count map
                              .reduce(countInMap, new Map<string, number>());
    const total = Array.from(areasMap).map(entry => entry[1]).reduce((acc, val) => acc + val, 0);

    // keep only those big enough, otherwise put in others
    const filteredAreasMap = new Map<string, number>();
    areasMap.forEach((value, key) => {
      if (value / total > RangesChartComponent.minBlockPercent) {
        filteredAreasMap.set(key, value);
      } else {
        if (filteredAreasMap.has('Autres')) {// FIXME
          filteredAreasMap.set('Autres', filteredAreasMap.get('Autres') + value);
        } else {
          filteredAreasMap.set('Autres', value);
        }
      }
    });

    this.data = {
      id: 1, // FIXME
      name: 'toto',
      data: Array.from(filteredAreasMap)
    };
  }

  private createChart() {
    const element = this.chartContainer.nativeElement;
    const svg = d3.select(element).append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.chart = svg.append('g')
      .attr('class', 'bars');

    this.xScale = d3.scaleBand().padding(0.1).domain(this.data.data.map(d => d[0].toString())).rangeRound([0, this.height]);
    this.yScale = d3.scaleLinear().domain([0, d3.max(this.data.data, d => Number(d[1]))]).range([this.width, 0]);
  }

  private updateChart() {
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
      .attr('x', (d: (string | number)[]) => this.xScale(d[0]))
      .attr('y', (d: (string | number)[]) => this.yScale(d[1]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', (d: (string | number)[]) => this.height - this.yScale(d[1]));

    bars.exit().remove();
  }
}
