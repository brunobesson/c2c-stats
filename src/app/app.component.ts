import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PieChartData } from './pie-chart/pie-chart-data';
import { C2cDataService } from './c2c-data.service';
import { Outing } from './outing';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  providers: [ C2cDataService ]
})
export class AppComponent implements OnInit {
  pieChartData: PieChartData[] = [
    {
      id: 1,
      name: 'test1',
      data: [
        ['a', 1],
        ['b', 3],
        ['c', 5]
      ]
    },
    {
      id: 2,
      name: 'test2',
      data: [
        ['c', 1],
        ['d', 5],
        ['e', 5]
      ]
    }
  ];
  selectedPieChartData: PieChartData;
  userId: number;
  userIdControl = new FormControl();
  data: Outing[];
  selectedData: Outing;

  constructor(private c2cDataService: C2cDataService) { }

  ngOnInit(): void {
    this.userIdControl.valueChanges
      .debounceTime(500)
      .distinctUntilChanged()
      .subscribe(newValue => {
        this.userId = newValue;
        this.getC2cData(newValue);
      });
  }

  private getC2cData(userId: number): void {
    this.data = [];
    this.c2cDataService.getObservableData(userId).subscribe(data => {
      this.data = this.data.concat(...data);
      this.data.sort((o1, o2) => Date.parse(o1.date_start) - Date.parse(o2.date_start));
    },
    error => {
      // FIXME
    },
    () => {
      console.log('size: ' + this.data.length);
      // this.data = tmpData;
    });
  }

  onSelect(data: PieChartData): void {
    this.selectedPieChartData = data;
  }
}
