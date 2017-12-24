import {
  Component,
  OnChanges,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  SimpleChange,
  ChangeDetectionStrategy
} from '@angular/core';
import { select } from 'd3-selection';
import { scaleOrdinal, schemeCategory20 } from 'd3-scale';
import { arc, pie, PieArcDatum } from 'd3-shape';
import { AreasChartData } from './areas-chart-data';
import { Outing } from '../outing';
import { Locale } from '../locale';

@Component({
  selector: 'app-areas-chart',
  templateUrl: './areas-chart.component.html',
  styleUrls: ['./areas-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreasChartComponent implements OnInit, OnChanges {

  @ViewChild('areasChart') private chartContainer: ElementRef;
  @Input() outings: Outing[];
  private data: AreasChartData[] = [];

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

  private inc(data: AreasChartData[], key: string): void {
    let index = data.findIndex(element => element.area === key);
    if (index === -1) {
      data.push({
        area: key,
        count: 0
      });
      index = data.length - 1;
    }
    data[index].count += 1;
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
        if (slide.area === 'Others' || slide.count / this.outings.length < 0.02) {
          acc.set('Others', (acc.get('Others') || 0) + slide.count);
        } else {
          acc.set(slide.area, slide.count);
        }
        return acc;
      }, new Map<string, number>())
      .forEach((value, key) => this.data.push({
        area: key,
        count: value
      }));
  }

  private createChart() {
    const width = 960;
    const height = 450;
    const radius = Math.min(width, height) / 2;

    const element: string = this.chartContainer.nativeElement;
    const svg = select<HTMLDivElement, AreasChartData>(element)
      .append('svg')
        .attr('width', width)
        .attr('height', height)
      .append('g');


    const pieGenerator = pie<AreasChartData>()
      .sort(null) // FIXME?
      .value(d => d.count);

    const arcGenerator = arc<PieArcDatum<AreasChartData>>()
      .outerRadius(radius * 0.8)
      .innerRadius(radius * 0.4);

    svg.attr('transform', `translate(${width / 2},${height / 2})`);

    const color = scaleOrdinal<string, string>(schemeCategory20);

    const g = svg.selectAll<SVGGElement, PieArcDatum<AreasChartData>>('.arc')
      .data<PieArcDatum<AreasChartData>>(pieGenerator(this.data))
      .enter().append<SVGGElement>('g')
      .attr('class', 'arc');

    g.append<SVGPathElement>('path')
      .attr('d', arcGenerator)
      .style('fill', d => color(d.data.area));

    g.append<SVGTextElement>('text')
      .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
      .attr('dy', '.35em')
      .text(d => d.data.area + '>' + d.data.count);
  }

  private updateChart() {
    // TODO
    const element: string = this.chartContainer.nativeElement;
    select(element).select('svg').remove();
    this.createChart();
  }
}
