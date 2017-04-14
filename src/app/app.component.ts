import { Component, OnInit } from '@angular/core';
import { PieChartData } from './pie-chart/pie-chart-data';
import { C2cDataService } from './c2c-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  providers: [ C2cDataService ]
})
export class AppComponent implements OnInit {
  data: PieChartData[];
  selectedData: PieChartData;

  constructor(private c2cDataService: C2cDataService) { }

  ngOnInit(): void {
    this.getC2cData();
  }

  getC2cData(): void {
    this.c2cDataService.getData().then(data => this.data = data);
  }

  onSelect(data: PieChartData): void {
    this.selectedData = data;
  }
}
