import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
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
  userId: number;
  userIdControl = new FormControl();
  data: Outing[] = [];

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
    this.c2cDataService.getData(userId).subscribe(data => {
      if (data.status === 'completed') {
        this.data = data.outings;
      }
    },
    error => {
      // TODO
    });
  }
}
